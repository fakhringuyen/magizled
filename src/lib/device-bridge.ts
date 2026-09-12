/**
 * Drives the firmware page from a hidden WebView.
 *
 * The board's own JavaScript decides which `mode` each form posts, so instead
 * of reverse engineering those numbers this reads the page's real forms, hands
 * the shape to the native UI, and writes back by filling the real fields and
 * submitting the real form. The firmware stays the source of truth.
 */

export type FieldSchema = {
  name: string;
  type: string;
  value: string;
  checked?: boolean;
  label: string;
  min?: string;
  max?: string;
  step?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
};

export type FormSchema = {
  index: number;
  action: string;
  fields: FieldSchema[];
  /** Text of the form's own submit control, usually the save icon's title. */
  submitLabel: string;
};

export type BridgeMessage =
  | {
      kind: 'schema';
      title: string;
      forms: FormSchema[];
      /** Inline script source, where the firmware's mode numbers live. */
      inline?: string;
      /** Form markup, so labels can be mapped exactly instead of guessed. */
      markup?: string;
    }
  | { kind: 'ack'; form: number; ok: boolean; error?: string }
  | { kind: 'data'; body: string }
  | { kind: 'log'; text: string };

/** Builds the JS that applies one change and submits its form. */
export function applyCommand(
  formIndex: number,
  values: Record<string, string | boolean>
): string {
  return `window.__magiz && window.__magiz.apply(${formIndex}, ${JSON.stringify(values)}); true;`;
}

export function refreshCommand(): string {
  return `window.__magiz && window.__magiz.schema(); true;`;
}

const SECRET = `/(pass|pwd|passwd|password|secret|token|key|psk)/i`;

export const BRIDGE_JS = `
(function () {
  if (window.__magiz) return;
  var SECRET = ${SECRET};
  function post(p) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(p)); } catch (e) {}
  }
  function clean(t) {
    return String(t || '').replace(/\\s+/g, ' ').trim().slice(0, 40);
  }
  // Text belonging to this node alone, with nested controls stripped out.
  function ownText(node) {
    if (!node) return '';
    var c = node.cloneNode(true);
    [].slice.call(c.querySelectorAll('input,select,textarea,button,script,style'))
      .forEach(function (n) { n.parentNode && n.parentNode.removeChild(n); });
    return clean(c.textContent);
  }
  function labelFor(el) {
    if (el.id) {
      var l = document.querySelector('label[for="' + el.id + '"]');
      if (l && clean(l.textContent)) return clean(l.textContent);
    }
    var wrap = el.closest('label');
    if (wrap && ownText(wrap)) return ownText(wrap);
    // Firmware pages wrap a control several levels deep and put the caption in
    // a sibling cell, so climb the tree instead of checking one sibling.
    var node = el;
    for (var depth = 0; depth < 4 && node; depth++) {
      var sib = node.previousElementSibling;
      while (sib) {
        var t = ownText(sib);
        if (t && t.length <= 40) return t;
        sib = sib.previousElementSibling;
      }
      var own = ownText(node.parentElement);
      if (own && own.length <= 40) return own;
      node = node.parentElement;
    }
    return el.name || el.id || '';
  }

  function fieldOf(el) {
    var f = {
      name: el.name || el.id || '',
      type: (el.type || el.tagName).toLowerCase(),
      value: el.type === 'password' ? '' : String(el.value == null ? '' : el.value),
      label: labelFor(el)
    };
    if (el.type === 'checkbox' || el.type === 'radio') f.checked = !!el.checked;
    if (el.min !== undefined && el.min !== '') f.min = String(el.min);
    if (el.max !== undefined && el.max !== '') f.max = String(el.max);
    if (el.step !== undefined && el.step !== '') f.step = String(el.step);
    if (el.maxLength && el.maxLength > 0) f.maxLength = el.maxLength;
    if (el.tagName === 'SELECT') {
      f.options = [].slice.call(el.options).map(function (o) {
        return { value: o.value, label: (o.textContent || o.value).trim().slice(0, 48) };
      });
    }
    return f;
  }

  function submitLabelOf(form) {
    var b = form.querySelector('[type=submit],button,input[type=image]');
    if (!b) return '';
    return (b.title || b.alt || b.value || b.textContent || '').trim().slice(0, 40);
  }

  function schema() {
    try {
      var forms = [].slice.call(document.forms).map(function (form, i) {
        var fields = [].slice.call(form.elements)
          .filter(function (el) { return (el.name || el.id) && el.type !== 'submit' && el.type !== 'button'; })
          .map(fieldOf);
        return {
          index: i,
          action: form.getAttribute('action') || '',
          fields: fields,
          submitLabel: submitLabelOf(form)
        };
      });
      var inline = [].slice.call(document.scripts)
        .filter(function (sc) { return !sc.src && sc.textContent; })
        .map(function (sc) { return sc.textContent; })
        .join('\\n/* --- next script --- */\\n')
        .slice(0, 20000);
      var markup = [].slice.call(document.forms)
        .map(function (f, n) { return '<!-- form ' + n + ' -->\\n' + f.outerHTML; })
        .join('\\n')
        .slice(0, 20000);
      post({ kind: 'schema', title: document.title || '', forms: forms,
             inline: inline, markup: markup });
    } catch (e) { log('schema failed: ' + e.message); }
  }

  function setValue(el, v) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = v === true || v === 'true' || v === '1';
    } else {
      el.value = String(v);
    }
    // Fire what firmware pages commonly listen for.
    ['input', 'change'].forEach(function (t) {
      el.dispatchEvent(new Event(t, { bubbles: true }));
    });
  }

  function apply(index, values) {
    try {
      var form = document.forms[index];
      if (!form) { post({ kind: 'ack', form: index, ok: false, error: 'no form ' + index }); return; }
      Object.keys(values).forEach(function (name) {
        var el = form.elements[name];
        if (el && el.length && el.tagName === undefined) el = el[0];
        if (el) setValue(el, values[name]);
      });
      // Prefer the page's own submit button, so its click handler runs.
      var btn = form.querySelector('[type=submit],button:not([type=button]),input[type=image]');
      if (btn) btn.click();
      else if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.submit();
      post({ kind: 'ack', form: index, ok: true });
    } catch (e) {
      post({ kind: 'ack', form: index, ok: false, error: e.message });
    }
  }

  // Forward the board's own status poll so the native UI can show live state.
  var of = window.fetch;
  if (of) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      return of.apply(this, arguments).then(function (r) {
        if (/\\/data\\b/.test(url)) {
          r.clone().text().then(function (t) { post({ kind: 'data', body: t.slice(0, 4000) }); }).catch(function () {});
        }
        return r;
      });
    };
  }
  var oo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oo.apply(this, arguments); };
  var os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    var self = this;
    this.addEventListener('load', function () {
      if (/\\/data\\b/.test(String(self.__u || ''))) {
        post({ kind: 'data', body: String(self.responseText || '').slice(0, 4000) });
      }
    });
    return os.apply(this, arguments);
  };

  window.__magiz = { schema: schema, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(schema, 500); });
  } else {
    setTimeout(schema, 500);
  }
})();
true;
`;
