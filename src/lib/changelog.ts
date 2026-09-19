export type Release = {
  version: string;
  build: number;
  date: string;
  changes: string[];
};

/** Newest first. The top entry must match app.json. */
export const CHANGELOG: Release[] = [
  {
    version: '4.7.0',
    build: 13,
    date: '2026-09-19',
    changes: [
      'Show one message on its own, instead of all three in rotation.',
      'A switch turns the animations off so text runs alone, and puts back the same set when you turn it on.',
      'The board has no display mode, so the app empties the other messages and holds them until you choose All.',
    ],
  },
  {
    version: '4.6.1',
    build: 13,
    date: '2026-09-19',
    changes: [
      'Arrived over the air.',
      'The message counter was wrong for emoji. A family emoji read as 20 of 60 while looking like one character.',
      'It now counts what you see, and shows bytes as well once a message leaves plain English.',
      'Typing can no longer cut an emoji in half. The board holds 60 bytes, and one emoji is four.',
    ],
  },
  {
    version: '4.6.0',
    build: 13,
    date: '2026-09-19',
    changes: [
      'The Android package is now com.fakhringuyen.magizled, following the account rename.',
      'Android treats this as a separate app, so the older MagizLED stays until you remove it.',
      'Saved animation names do not survive removing the old app. They live on the phone.',
    ],
  },
  {
    version: '4.5.0',
    build: 12,
    date: '2026-09-17',
    changes: [
      'Fixed: holding an animation acted as a tap. React Native cancels the hold after 1.6 mm of finger drift but keeps the press alive.',
      'Fixed: a message holding a percent sign made the whole panel report the board as unreachable.',
      'Fixed: "FISH & CHIPS" came back from the board as "FISH ".',
      'Fixed: a read already in flight could undo an animation you had just switched on.',
      'Fixed: pull to refresh left every slider and dropdown showing the old value.',
      'Fixed: Save Wi-Fi could send the previous network name if you typed and saved quickly.',
      'Fixed: a failed save erased its own error message within a second.',
      'Fixed: leaving a screen within a second of typing threw the edit away in silence.',
      'A screen reader can now reach the buttons inside every dialog. It could not before.',
      'Faint text, button labels and control outlines now meet the contrast standard.',
      'Animation buttons are 48 points and say "Animation 7" rather than "7".',
      'The keyboard no longer covers the Save button on Android.',
    ],
  },
  {
    version: '4.4.3',
    build: 11,
    date: '2026-09-12',
    changes: [
      'Fixed: after Check for updates the restart prompt never appeared.',
      'About is a modal screen, and the prompt opened behind it. The button now sits on the card itself.',
      'The app wide prompt still handles updates that download on their own.',
    ],
  },
  {
    version: '4.4.2',
    build: 11,
    date: '2026-09-12',
    changes: [
      'Hold an animation to open it: run it alone, then give it a name you recognise.',
      'Named animations show that name on the pill instead of the number.',
      'Names live on this phone only. The board has nowhere to keep them.',
    ],
  },
  {
    version: '4.4.1',
    build: 11,
    date: '2026-09-12',
    changes: [
      'Arrived over the air. No APK was installed for this one.',
      'Hold an animation number to run only that one, so you can see what it is.',
      'The firmware names none of the 41, so watching one alone is the only honest way to tell.',
    ],
  },
  {
    version: '4.4.0',
    build: 11,
    date: '2026-09-12',
    changes: [
      'A downloaded update now announces itself with a prompt, anywhere in the app.',
      'The prompt offers Restart now or Later, and asks once rather than on every screen.',
      'The update channel is renamed from preview to stable. It was only ever the build profile\u2019s name.',
    ],
  },
  {
    version: '4.3.1',
    build: 10,
    date: '2026-09-12',
    changes: [
      'Arrived over the air. No APK was installed for this one.',
      'Pull the panel down to read the board again.',
      'The build number stays at 10, because the installed app did not change.',
    ],
  },
  {
    version: '4.3.0',
    build: 10,
    date: '2026-09-12',
    changes: [
      'Buttons and animation pills answer with a spring instead of a flat colour swap.',
      'The status dot breathes while the app is waiting, and holds still when it is not.',
      'A tick fades in when a change lands, so the header no longer swaps text in place.',
      'The animation count nudges when it changes, so All and None are not silent.',
      'Cards arrive in order rather than all at once.',
      'Version numbers no longer break over the air updates. This build is the new baseline.',
    ],
  },
  {
    version: '4.2.0',
    build: 9,
    date: '2026-09-12',
    changes: [
      'Updates now arrive over the air. Only this build has to be installed by hand.',
      'About gained a Check for updates button, because the board\u2019s own Wi-Fi has no internet.',
      'Screens and logic ship this way. A new Android package still needs a new APK.',
    ],
  },
  {
    version: '4.1.0',
    build: 8,
    date: '2026-09-12',
    changes: [
      'Added this screen: app version, build number and history.',
      'The board’s own firmware name, version and status now show here too.',
      'Animations stay numbered. The firmware gives no names for them, so none are invented.',
    ],
  },
  {
    version: '4.0.0',
    build: 7,
    date: '2026-09-12',
    changes: [
      'The app now talks to the board over HTTP directly. The hidden WebView is gone.',
      'Wi-Fi no longer saves as you type. It has its own Save button and a confirm step.',
      'Controls carry the firmware’s own names: Brightness, Speed, Interval, Font, LED panels.',
      'Fixed a fault that would have pressed the board page’s reset button instead of save.',
      'The Wi-Fi password the board returns is dropped on the way in and never stored.',
    ],
  },
  {
    version: '3.0.1',
    build: 6,
    date: '2026-09-12',
    changes: [
      'Grouped the nine single-setting cards into one list.',
      'Widened the label search so controls stopped showing as parameter2 and parameter3.',
    ],
  },
  {
    version: '3.0.0',
    build: 5,
    date: '2026-09-11',
    changes: [
      'Replaced the embedded board page with a native panel.',
      'Sliders show their value. Animations became a grid with All and None.',
      'The board’s own page stays reachable from the bottom of the panel.',
    ],
  },
  {
    version: '2.1.1',
    build: 4,
    date: '2026-09-11',
    changes: ['Stopped the diagnostics recorder from logging the Wi-Fi password.'],
  },
  {
    version: '2.1.0',
    build: 3,
    date: '2026-09-10',
    changes: ['Added a recorder that maps the board’s HTTP interface.'],
  },
  {
    version: '2.0.0',
    build: 2,
    date: '2026-09-10',
    changes: [
      'Rebuilt from the original MIT App Inventor app.',
      'The connect screen asks the board itself instead of trusting the phone’s network flag.',
      'The controller address is editable and saved.',
      'Back walks the page history. The exit dialog says Close and Stay.',
      'minSdk 13 to 24, targetSdk 33 to 36.',
    ],
  },
];
