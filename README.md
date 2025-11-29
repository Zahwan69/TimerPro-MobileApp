# TimerPro Mobile App

TimerPro is a cross-platform timer and record-tracking app built with Expo, React Native, and TypeScript. It supports custom timer categories, lap tracking, personal bests, and full UI theming (dark mode, font scaling, custom backgrounds).

## Features
- Create custom timer categories (ASAP or Endurance)
- Start, pause, reset, and lap timers
- Save timing records with lap breakdowns
- Personal best logic per category
- Transfer records between categories
- Dark mode, font size scaling, and custom wallpaper support
- All state persisted via AsyncStorage
- Responsive UI with smooth button animations

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- Expo CLI (`npm install -g expo-cli`)
- Android/iOS device or simulator

### Install dependencies
```powershell
npm install
```

### Run in development
```powershell
npx expo start
```
- Scan QR code with Expo Go (iOS/Android) or run on a simulator.

### Build for production
```powershell
npm run build:prod
```

## Project Structure
```
app/                # Expo Router pages (main screens)
components/         # Reusable UI components
store/              # Zustand state management
lib/                # Utilities
assets/             # Images and static assets
```

## Key Files
- `app/(tabs)/index.tsx` — Main timer screen
- `app/(tabs)/analysis.tsx` — Records analysis screen
- `app/(tabs)/settings.tsx` — Settings/profile screen
- `store/useTimerStore.ts` — Centralized state logic
- `components/TimerDisplay.tsx` — Timer display
- `components/TimerControls.tsx` — Timer control buttons
- `components/AnimatedPressable.tsx` — Animated button wrapper

## Customization
- Change theme, font size, and background in the Settings screen
- Add new timer categories and set goals

## License
MIT

---
For more details, see `.github/copilot-instructions.md` for agent/dev setup.
