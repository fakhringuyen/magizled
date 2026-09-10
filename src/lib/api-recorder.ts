export type RecordedCall = {
  id: string;
  at: number;
  kind: 'fetch' | 'xhr' | 'form' | 'ws';
  method: string;
  url: string;
  body?: string;
  status?: number;
};

export type PageMap = {
  kind: 'pagemap';
  title: string;
  forms: { action: string; method: string; fields: string[] }[];
  controls: { tag: string; type: string; id: string; name: string; label: string }[];
  scripts: string[];
  links: string[];
  /** Source of the page's inline scripts, where the firmware's mode map lives. */
  inline?: string;
};

export type RecorderMessage =
  | { kind: 'call'; call: RecordedCall }
  | PageMap;

/**
 * Wraps fetch, XMLHttpRequest and form submit before the firmware page runs,
 * so every request it makes is reported back. This is how the device API gets
 * mapped without the firmware source.
 */
export const RECORDER_JS = `
(function () {
  if (window.__magizRec) return;
  window.__magizRec = true;
  var seq = 0;
  function post(payload) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } catch (e) {}
  }
  // Never let a credential out of the page. The firmware posts the Wi-Fi
  // password in clear text, and this log is stored and screenshotted.
  var SECRET = /(pass|pwd|passwd|password|secret|token|key|psk)/i;
  function redact(body) {
    if (!body) return undefined;
    var s = String(body).slice(0, 900);
    return s.replace(/([^&=?]+)=([^&]*)/g, function (m, k, v) {
      return SECRET.test(k) ? k + '=***redacted***' : m;
    });
  }
  function send(kind, method, url, body, status) {
    post({ kind: 'call', call: {
      id: String(++seq), at: Date.now(), kind: kind,
      method: String(method || 'GET').toUpperCase(),
      url: redact(String(url)), body: redact(body),
      status: status
    }});
  }

  var of = window.fetch;
  if (of) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var m = (init && init.method) || (input && input.method) || 'GET';
      var b = init && init.body;
      return of.apply(this, arguments).then(function (r) {
        send('fetch', m, url, b, r && r.status); return r;
      }, function (e) { send('fetch', m, url, b, -1); throw e; });
    };
  }

  var oo = XMLHttpRequest.prototype.open;
  var os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) {
    this.__m = m; this.__u = u; return oo.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (b) {
    var self = this;
    this.addEventListener('loadend', function () {
      send('xhr', self.__m, self.__u, b, self.status);
    });
    return os.apply(this, arguments);
  };

  document.addEventListener('submit', function (e) {
    try {
      var f = e.target;
      var parts = [];
      for (var i = 0; i < f.elements.length; i++) {
        var el = f.elements[i];
        if (!el.name) continue;
        var val = el.type === 'checkbox' ? el.checked : el.value;
        parts.push(el.name + '=' + (SECRET.test(el.name) || el.type === 'password' ? '***redacted***' : val));
      }
      send('form', f.method || 'GET', f.action || location.href, parts.join('&'));
    } catch (err) {}
  }, true);

  function labelFor(el) {
    if (el.id) {
      var l = document.querySelector('label[for="' + el.id + '"]');
      if (l) return l.textContent.trim().slice(0, 40);
    }
    var p = el.closest('label');
    if (p) return p.textContent.trim().slice(0, 40);
    var prev = el.previousElementSibling;
    if (prev) return prev.textContent.trim().slice(0, 40);
    return '';
  }

  function mapPage() {
    try {
      var forms = [].slice.call(document.forms).map(function (f) {
        return {
          action: f.getAttribute('action') || '',
          method: (f.getAttribute('method') || 'GET').toUpperCase(),
          fields: [].slice.call(f.elements).map(function (e) { return e.name || e.id || ''; })
                    .filter(Boolean)
        };
      });
      var controls = [].slice.call(
        document.querySelectorAll('input,select,textarea,button')
      ).map(function (e) {
        return { tag: e.tagName.toLowerCase(), type: e.type || '', id: e.id || '',
                 name: e.name || '', label: labelFor(e) };
      });
      var scripts = [].slice.call(document.scripts)
        .map(function (s) { return s.src || '(inline ' + (s.textContent || '').length + ' chars)'; });
      var inline = [].slice.call(document.scripts)
        .filter(function (s) { return !s.src && s.textContent; })
        .map(function (s) { return s.textContent; })
        .join('\n/* --- next script --- */\n')
        .slice(0, 20000);
      var links = [].slice.call(document.links).map(function (a) { return a.getAttribute('href') || ''; });
      post({ kind: 'pagemap', title: document.title || '', forms: forms,
             controls: controls, scripts: scripts, links: links, inline: inline });
    } catch (err) {}
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(mapPage, 400);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(mapPage, 400); });
  }
})();
true;
`;
