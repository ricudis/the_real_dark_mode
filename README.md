# Real Dark Mode — Chrome Extension (the REAL dark mode)

Not your grandma’s gray filter. This is Real Dark Mode: full blackout with a crisp spotlight that hunts with your cursor. Less glare. More stare.

## Features

- **Actual black**: A real overlay, not a washed‑out invert.
- **Spotlight reveal**: Smooth gradient around your cursor. Clean, readable, controlled.
- **Smart falloff**: Stays clear near center, drops fast near the edge.
- **Sticks per tab**: Reload or follow links—the darkness persists. Badge says "ON".
- **Real flashlight**: Illuminates your cursor.

## Install (Chrome, quick)

1. Open `chrome://extensions`
2. Turn on "Developer mode" (top-right)
3. Click "Load unpacked" and select this folder (the one with `manifest.json`)

To uninstall: close your eyes. Or, you know, remove it from the page.

## Use it (bring your own cursor)

1. Click the extension icon to drop the curtain
2. Move your mouse to peek at the world you left behind
3. Click the icon again to banish the light. Press `Esc` for a quick blackout

Badge says "ON" when the current tab is in stealth mode.

## Under the hood (because you asked)

- **Background (MV3 service worker)**: When you click the icon, it injects `content.js` using `chrome.scripting.executeScript` and sends `RDM_TOGGLE` / `RDM_SET`. It remembers per‑tab state in `chrome.storage.session`, so reloads and same‑tab navigations keep the vibe.
- **Content script**: Draws a full‑viewport canvas, fills it with black, then uses `destination-out` to cut out a spotlight around the cursor at 50px radius with a non‑uniform fade. It also draws a small flashlight graphic offset bottom‑right and rotated to point at the cursor. Science.

## Permissions (tiny list)

- `scripting`, `activeTab`, `tabs`, `storage`
- `host_permissions`: `<all_urls>` so it can work basically anywhere

## Privacy (dark, not nosy)

- No network calls
- No analytics, no tracking, no drama
- Uses session storage per tab for the badge and on/off state

## Compatibility

- Google Chrome (Manifest V3). Works great in Chrome; if you try another Chromium browser, your mileage may vary but your darkness will not.

## Troubleshooting

- "It does nothing" → Make sure the tab has focus and try clicking the icon again
- "Well, it does nothing useful anyways" → That's true.
- "It stops after I refresh" → That’s supposed to be fixed. If it isn’t, try toggling off/on or reloading the extension
- "Incognito?" → Enable "Allow in incognito" for the extension in `chrome://extensions`
