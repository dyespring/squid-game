# 🦑 Squid Game: Red Light, Green Light

A mobile-first web game recreating the iconic Red Light, Green Light challenge from Netflix's Squid Game. Built with TypeScript and Phaser 3 as a portfolio project showcasing modern game development techniques.

![Game Status](https://img.shields.io/badge/status-in%20development-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Phaser 3](https://img.shields.io/badge/Phaser-3.60+-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 About

Experience the tension and thrill of the deadly Red Light, Green Light game from your mobile device. Touch and hold to sprint toward the finish line, but freeze immediately when the giant doll turns around. Get caught moving and you're eliminated. Can you make it across?

### Key Features

- 🎯 **Authentic Gameplay** - Recreates the tense timing mechanics from the show
- 📱 **Mobile-First Design** - Optimized touch controls and responsive layout
- 🎨 **Squid Game Aesthetic** - Distinctive pink guards, green tracksuits, and geometric UI
- 🎵 **Immersive Audio** - Tension-building soundtrack and sound effects
- 🏆 **Three Difficulty Levels** - Easy, Normal, and Hard modes with different challenges
- 💾 **High Score Tracking** - Persistent local leaderboard
- 🤖 **AI Players** - NPCs create an immersive competitive atmosphere
- ⚡ **Smooth Performance** - 60 FPS gameplay on mobile devices

## 🚀 Live Demo

**Coming Soon** - Game currently in development

## 🛠️ Tech Stack

### Core Technologies
- **TypeScript** - Type-safe game logic
- **Phaser 3.60+** - Battle-tested HTML5 game framework
- **Vite 5.x** - Lightning-fast development and building
- **Tailwind CSS** - Utility-first styling for UI components
- **GSAP** - Smooth UI animations and transitions
- **Howler.js** - Cross-browser audio management

### Development Tools
- **pnpm** - Fast, efficient package management
- **ESLint + Prettier** - Code quality and formatting
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **GitHub Actions** - CI/CD pipeline

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm 8+ (or npm/yarn)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/squid-game.git
cd squid_game

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173 in your browser
```

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server with hot reload
pnpm build        # Build for production
pnpm preview      # Preview production build locally

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm type-check   # TypeScript type checking

# Testing
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run end-to-end tests
pnpm test:coverage # Generate coverage report
```

## 🎯 How to Play

### Controls
- **Mobile/Touch**: Touch and hold anywhere on the screen to move forward
- **Desktop**: Hold SPACE or click-and-hold to move

### Rules
1. **Green Light** - The doll faces away, you can move
2. **Red Light** - The doll turns around, you must freeze
3. **Detection** - Any movement during red light = elimination
4. **Victory** - Cross the finish line before time runs out
5. **Scoring** - Faster completion and perfect timing = higher score

### Tips
- Listen for the doll's turning sound
- Time your sprints carefully during long green lights
- The doll's timing is randomized - stay alert
- Momentum causes slight overshoot - release early
- Watch the timer - you only have 60-90 seconds

## 🏗️ Project Structure

```
squid_game/
├── src/
│   ├── game/              # Core game logic
│   │   ├── scenes/        # Phaser scenes (Menu, Game, GameOver, etc.)
│   │   ├── entities/      # Game objects (Player, Doll, NPC)
│   │   ├── systems/       # Game systems (Detection, Movement, Score)
│   │   ├── managers/      # Managers (Audio, Input, Particles)
│   │   ├── config/        # Configuration and constants
│   │   └── utils/         # Utility functions
│   ├── ui/                # React UI components
│   │   ├── components/    # UI components (Menu, HUD, Settings)
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # Global styles
│   ├── types/             # TypeScript type definitions
│   ├── main.ts            # Application entry point
│   └── App.tsx            # Root React component
├── public/
│   └── assets/            # Game assets (images, audio, fonts)
├── tests/                 # Test files
├── docs/                  # Additional documentation
└── [config files]         # Build and tool configuration
```

## 📚 Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical architecture and system design
- **[docs/GAMEPLAY.md](docs/GAMEPLAY.md)** - Detailed game design document
- **[docs/ROADMAP.md](docs/ROADMAP.md)** - Development roadmap and implementation plan
- **[docs/SETUP.md](docs/SETUP.md)** - Development environment setup guide

## 🎨 Design Philosophy

### Squid Game Aesthetic
- **Color Palette**: Pink guards (#FF4581), green tracksuits (#008C62), cream backgrounds (#F5E6D3)
- **Geometric Shapes**: Circles, triangles, and squares throughout UI
- **Minimalist Style**: Clean, flat design with strategic shadows
- **Korean Retro**: Playground aesthetic with brutalist typography

### Game Design Principles
- **Simple to Learn** - Intuitive one-button control scheme
- **Difficult to Master** - Randomized timing creates unpredictability
- **Tension Building** - Audio and visual cues create suspense
- **Fair Challenge** - Detection system is consistent and learnable
- **Immediate Feedback** - Clear visual and audio responses to player actions

## 🗺️ Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] Core architecture and scene system
- [ ] Audio and state management

### Phase 2: Core Gameplay (Week 2)
- [ ] Player movement system
- [ ] Doll behavior and state machine
- [ ] Detection system
- [ ] Basic win/lose conditions

### Phase 3: Visual Polish (Week 3)
- [ ] Character sprites and animations
- [ ] Background and environment art
- [ ] Particle effects
- [ ] UI design and styling

### Phase 4: Audio & Game Feel (Week 4)
- [ ] Sound effect integration
- [ ] Background music
- [ ] Screen transitions
- [ ] NPC AI players

### Phase 5: Features & Testing (Week 5)
- [ ] Scoring system
- [ ] Difficulty modes
- [ ] High score persistence
- [ ] Comprehensive testing

### Phase 6: Launch (Week 6)
- [ ] Documentation completion
- [ ] Performance optimization
- [ ] Production deployment
- [ ] Portfolio integration

### Future Enhancements
- Additional Squid Game mini-games (Honeycomb, Tug of War, Glass Bridge)
- Multiplayer mode with real-time competition
- Global leaderboard with backend
- Mobile app versions (iOS/Android)
- Achievements and unlockables
- Custom player skins

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a fan-made game inspired by Netflix's Squid Game series. It is not affiliated with, endorsed by, or connected to Netflix or the creators of Squid Game. All rights to the Squid Game IP belong to their respective owners. This project is for educational and portfolio purposes only.

## 🙏 Acknowledgments

- Netflix's Squid Game for the inspiration
- Phaser community for excellent documentation
- Game design patterns from Game Programming Patterns by Robert Nystrom
- Mobile game optimization techniques from HTML5 Game Development

---

Built with ❤️ and TypeScript
