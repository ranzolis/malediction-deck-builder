# Malediction Deck Builder

An offline, single-file deck builder for the Malediction card game. Everything —
card data, thumbnails, styles, scripts, QR generation and QR scanning — is embedded
in `malediction-deck-builder.html`, so it runs directly from `file://` without a
server or internet connection.

## Features

- Seeker-led deck construction with live legality checks (main 30–50, side 0–7,
  Basic/Elite/Unique limits, matching Legacy, one Terrain).
- Autosave, named local saved decks, search and faction/type filters.
- Full-screen card viewer with swipe and keyboard navigation.
- Deck analytics: mana curve and type composition.
- Export as an official-style plain list (`.txt` / copy) or a print-ready
  formatted sheet (`.html` / Print to PDF).

## Play tab

The Play tab turns the builder into a shared table tracker. Open **Play**, create a
game, and pair two devices directly with WebRTC:

1. The host creates a table and shows an invite QR code.
2. The opponent opens **Join**, scans the invite, and shows a reply QR code.
3. The host scans the reply. The table is connected.
4. Each player picks a saved deck (or the current build).
5. The host starts the game. Both devices stay in sync.

Both players can track:

- round number (shared, host advances it)
- echo
- base mastery from units
- relics held; each relic contributes 10 mastery
- mastery target (25 / 40 / 50)
- a shared table log

Either player can open the other player's deck from the table. Finishing a game
saves the result locally and produces a report payload.

Pairing uses a two-code handshake because the app is fully offline: a static HTML
file cannot run a signaling server, so the host and guest exchange connection data
through the two QR codes (or the copy/paste fields). Once paired, the WebRTC data
channel works over the local network and, when internet is available, across
networks.

## Reporting to the Malediction stats site

The finished game produces a `malediction.game.v1` payload containing the room,
rounds, result, players, Seekers, decks, echo, relics, mastery, and log. It can be
copied or downloaded as JSON today.

When the stats site exposes a report endpoint, point the app at it from the console
or from a future settings panel:

```js
window.__PLAY.setReportEndpoint('https://example.com/api/games');
```

After that, **Report to website** POSTs the JSON payload to that endpoint. If the
request fails or no endpoint is configured, the app copies the payload instead so
the result is never lost.

## Usage

Open `malediction-deck-builder.html` in a modern browser. To host it, publish that
single file (for example, via GitHub Pages) — no build step is required to use it.
