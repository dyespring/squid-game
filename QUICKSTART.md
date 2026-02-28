# Quick Start Guide

## Phase 1 Complete! 🎉

You've successfully completed Phase 1: Foundation. The project is now set up with all the core architecture.

## What Was Created

### Configuration Files ✅
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Code formatting rules
- `.gitignore` - Git ignore patterns

### Core Architecture ✅
- **Game Configuration**
  - `src/game/config/constants.ts` - All game constants
  - `src/game/config/difficultySettings.ts` - Difficulty configs
  - `src/game/config/gameConfig.ts` - Phaser configuration

- **Scene System** (6 scenes)
  - `BootScene` - Initialization
  - `PreloadScene` - Asset loading
  - `MenuScene` - Main menu with difficulty selection
  - `GameScene` - Main gameplay (basic structure)
  - `GameOverScene` - Defeat screen
  - `VictoryScene` - Win screen

- **Managers**
  - `AudioManager` - Sound/music with mobile support
  - `InputManager` - Touch and keyboard input

- **Types**
  - `game.types.ts` - TypeScript type definitions

### Entry Points ✅
- `index.html` - HTML entry point
- `src/main.ts` - TypeScript entry point
- `src/ui/styles/global.css` - Global styles

## Next Steps

### 1. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### 2. Start Development Server

```bash
pnpm dev
```

The game will open at `http://localhost:5173`

### 3. What You'll See

Currently, you'll see:
- ✅ Loading screen with progress bar
- ✅ Main menu with difficulty selection (Easy/Normal/Hard)
- ✅ Basic game screen with timer and field
- ✅ Game Over and Victory screens
- ✅ Scene transitions

### 4. Available Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build

# Code Quality
pnpm lint         # Check code quality
pnpm format       # Format code
pnpm type-check   # TypeScript checking

# Testing (not yet configured)
pnpm test         # Run tests
```

## What's Missing (Next Phases)

### Phase 2 Tasks:
- [ ] Player entity with movement physics
- [ ] Doll entity with state machine
- [ ] Detection system
- [ ] Complete game loop
- [ ] Win/lose logic

### Phase 3 Tasks:
- [ ] Game assets (sprites, backgrounds)
- [ ] Animations
- [ ] Particle effects
- [ ] UI polish

### Phase 4 Tasks:
- [ ] Sound effects
- [ ] Background music
- [ ] NPC players
- [ ] Game feel enhancements

## Current Features

✅ **Working:**
- Scene management and transitions
- Difficulty selection
- Basic UI with Squid Game colors
- Mobile-ready input system
- Audio system (ready for sounds)
- Timer system
- Device detection (mobile vs desktop)

⏳ **Not Yet Implemented:**
- Player movement
- Doll behavior
- Detection mechanics
- Scoring
- Assets (using placeholder shapes)
- Sound effects

## File Structure

```
squid_game/
├── docs/                    # Documentation
├── src/
│   ├── game/
│   │   ├── config/         # Game configuration ✅
│   │   ├── scenes/         # Game scenes ✅
│   │   ├── managers/       # Audio, Input managers ✅
│   │   ├── entities/       # Player, Doll (Phase 2)
│   │   ├── systems/        # Detection, Movement (Phase 2)
│   │   └── utils/          # Utility functions
│   ├── ui/
│   │   ├── components/     # React components (future)
│   │   ├── hooks/          # Custom hooks (future)
│   │   └── styles/         # CSS ✅
│   └── types/              # TypeScript types ✅
├── public/
│   └── assets/             # Game assets (Phase 3)
└── [config files]          # Build configs ✅
```

## Troubleshooting

### Dependencies won't install
- Make sure you have Node.js 18+ installed
- Try deleting `node_modules` and `pnpm-lock.yaml` and reinstalling

### TypeScript errors
- Run `pnpm type-check` to see all errors
- Make sure all dependencies are installed

### Vite won't start
- Check port 5173 isn't already in use
- Try `pnpm dev --port 3000` to use a different port

### Game doesn't load
- Check the browser console for errors
- Make sure all files were created correctly
- Try clearing browser cache

## Development Tips

1. **Hot Reload**: Vite provides instant hot reload - just save and see changes
2. **Debug Mode**: Open browser console to see detailed logs
3. **Device Testing**: Test on mobile early and often
4. **Scene Testing**: Comment out scene transitions to test specific scenes

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser Examples](https://phaser.io/examples)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Ready to Continue?

When you're ready to start Phase 2 (Core Gameplay), you'll implement:
1. Player entity with movement
2. Doll behavior system
3. Detection mechanics
4. Full game loop

Refer to `docs/ROADMAP.md` for the complete Phase 2 task list.

Happy coding! 🦑
