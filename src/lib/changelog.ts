export type Release = {
  version: string;
  build: number;
  date: string;
  changes: string[];
};

/** Newest first. The top entry must match app.json. */
export const CHANGELOG: Release[] = [
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
