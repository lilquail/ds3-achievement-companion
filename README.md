# Dark Souls III Achievement Companion

A browser-based checklist for the collectible achievements in **Dark Souls III**. Track your progress toward the Platinum / 100% without ever leaving the page.

![Dark Souls III Achievement Companion](https://img.shields.io/badge/Dark%20Souls%20III-Achievement%20Companion-c8a84b?style=for-the-badge)
[![Use it here](https://img.shields.io/badge/Use%20it%20here-4a90d9?style=for-the-badge)](https://lilquail.github.io/ds3-achievement-companion/)

## Features

- Checklist tracking for all collectible achievements:
  - Master of Rings (base, +1, +2, +3)
  - Master of Expression (Gestures)
  - Master of Miracles
  - Master of Sorceries
  - Master of Pyromancies
  - Master of Infusion
- Live search to filter items by name
- Hide Collected toggle to focus on what's left
- Grouped / Ungrouped ring variants display
- Persistent progress saved to browser `localStorage`
- Confetti burst when you complete a category
- Every item links directly to its Fextralife wiki page
- Spell requirement scrolls displayed inline per spell

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- Vanilla CSS
- [canvas-confetti](https://github.com/catdad/canvas-confetti)

## Getting Started

```bash
npm install
npm run dev
```

## Attributions

- Game data, item descriptions, and icons sourced from the [Dark Souls 3 Wiki (Fextralife)](https://darksouls3.wiki.fextralife.com/).
- All game assets and icons are the property of FromSoftware / Bandai Namco. This is an unofficial fan project with no affiliation.
- A remake/clone of the original [Dark Souls Achievement Companion](https://lorthiz.github.io/ds-achievement-companion/) by [Lorthiz](https://github.com/lorthiz).
