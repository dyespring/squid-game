# Development Roadmap

## Project Timeline: 6 Weeks

This roadmap outlines the development plan for the Squid Game: Red Light, Green Light web game. Each phase builds upon the previous, with clear deliverables and milestones.

---

## Phase 1: Foundation (Week 1)

### Goal
Establish solid project foundation with core architecture and tooling.

### Tasks

#### Project Setup
- [x] Initialize Git repository
- [ ] Set up package.json with dependencies
  - Phaser 3.60+
  - TypeScript 5.0+
  - Vite 5.x
  - Tailwind CSS
  - GSAP
  - Howler.js
  - Vitest, Playwright
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up Vite build system (vite.config.ts)
- [ ] Configure ESLint + Prettier
- [ ] Set up Tailwind CSS
- [ ] Create folder structure

#### Core Architecture
- [ ] Implement Phaser game config (gameConfig.ts)
- [ ] Define game constants (constants.ts)
- [ ] Create difficulty settings (difficultySettings.ts)
- [ ] Set up Scene architecture
  - BootScene (initialization)
  - PreloadScene (asset loading)
  - MenuScene (main menu)
  - GameScene (gameplay)
  - GameOverScene (defeat)
  - VictoryScene (win)
- [ ] Implement scene transitions

#### Managers & Systems
- [ ] Create AudioManager with Howler.js
  - Mobile audio unlock handling
  - Sound effect pool
  - Music loop system
- [ ] Create InputManager
  - Touch detection
  - Keyboard handling
  - Unified input API
- [ ] Set up state management (Zustand)
  - Settings store
  - High score persistence

#### Development Tools
- [ ] Configure hot reload
- [ ] Set up source maps
- [ ] Add development logging
- [ ] Create build scripts

### Deliverables
- ✅ Project runs with `pnpm dev`
- ✅ Blank Phaser canvas appears
- ✅ Scene transitions functional
- ✅ Audio system initialized
- ✅ All tooling configured

### Estimated Time
**20-25 hours**

---

## Phase 2: Core Gameplay (Week 2)

### Goal
Implement fully playable game loop with win/lose conditions.

### Tasks

#### Player Entity
- [ ] Create Player class extending Phaser.Sprite
- [ ] Implement movement physics
  - Base speed: 150 px/s
  - Acceleration: 0.3s ramp-up
  - Momentum overshoot: 0.1s
- [ ] Add position tracking for detection
- [ ] Implement player animations (placeholder sprites)
  - Idle animation
  - Run cycle (4 frames)
  - Frozen state
- [ ] Add collision boundaries

#### Doll Entity
- [ ] Create Doll class
- [ ] Implement state machine
  - FACING_AWAY
  - TURNING_TO_FACE
  - FACING_PLAYERS
  - TURNING_AWAY
- [ ] Add rotation animations
- [ ] Implement randomized timing
  - Green light: 3-6s
  - Red light: 2-4s
- [ ] Sync animations with sounds

#### Game Systems
- [ ] Implement GameStateManager
  - State enum (READY, GREEN_LIGHT, RED_LIGHT, etc.)
  - State transitions
  - State change events
- [ ] Create MovementSystem
  - Update player position
  - Handle input
  - Boundary checking
- [ ] Implement DetectionSystem
  - Movement delta calculation
  - Threshold checking (by difficulty)
  - Detection feedback
- [ ] Create TimerSystem
  - Countdown timer
  - Time bonus calculation
  - Time's up detection

#### GameScene Integration
- [ ] Initialize player and doll
- [ ] Connect input to movement
- [ ] Implement game loop
- [ ] Add win condition (reach finish line)
- [ ] Add lose conditions (caught, time up)
- [ ] Scene transitions to victory/game over

#### Basic UI
- [ ] HUD with timer
- [ ] State indicator (Green/Red Light)
- [ ] Distance progress bar
- [ ] Touch control indicator

### Deliverables
- ✅ Playable game from start to finish
- ✅ Can win (reach finish line)
- ✅ Can lose (caught or time up)
- ✅ Detection system works correctly
- ✅ Basic visual feedback

### Estimated Time
**25-30 hours**

---

## Phase 3: Visual Polish (Week 3)

### Goal
Achieve authentic Squid Game aesthetic with polished animations.

### Tasks

#### Asset Creation/Integration
- [ ] Design or source doll sprites
  - Front view (facing players)
  - Back view (facing away)
  - High resolution (400x600px)
- [ ] Create player sprite sheets
  - Idle frame
  - Run cycle (4 frames)
  - Frozen frame
  - 128x128px per frame
  - Green tracksuit with number
- [ ] Design background
  - Dirt field texture
  - Distance markers
  - Finish line
  - Side boundaries (trees/fence)
  - 1080x1920px (portrait)
- [ ] Create UI assets
  - Logo
  - Geometric shape buttons
  - Icons
  - Fonts (Korean-style brutalist)

#### Animation Implementation
- [ ] Doll animations
  - Turn sequence (0.5s)
  - Idle breathing effect
  - Eye glow during red light
  - Scanning laser effect
- [ ] Player animations
  - Run cycle animation
  - Acceleration/deceleration blending
  - Elimination sequence
  - Victory celebration
- [ ] Camera effects
  - Shake on elimination
  - Zoom during detection
  - Smooth follow during gameplay

#### Particle Effects
- [ ] Dust particles when running
- [ ] Elimination effect (stylized blood splatter)
- [ ] Victory confetti
- [ ] Spotlight effect
- [ ] Screen flash on gunshot

#### UI Styling
- [ ] Apply Squid Game color palette
  - Pink: #FF4581
  - Green: #008C62
  - Cream: #F5E6D3
  - Red: #E63946
- [ ] Style all UI screens
  - Menu with logo and geometric shapes
  - Difficulty selection cards
  - Settings panel
  - Victory/defeat screens
- [ ] Add state visual feedback
  - Green border during green light
  - Red border pulse during red light
  - Vignette effect
- [ ] Implement transitions (GSAP)
  - Screen fade in/out
  - Button hover effects
  - Panel slide animations

#### Responsive Design
- [ ] Test on multiple screen sizes
  - Mobile (375x667 minimum)
  - Tablet (768x1024)
  - Desktop (1920x1080)
- [ ] Implement canvas scaling
- [ ] Adjust UI layout for orientations
- [ ] Add "rotate device" prompt for landscape

### Deliverables
- ✅ Game has distinctive Squid Game look
- ✅ All sprites and backgrounds integrated
- ✅ Smooth 60fps animations
- ✅ Professional UI design
- ✅ Responsive across devices

### Estimated Time
**30-35 hours** (asset creation + implementation)

---

## Phase 4: Audio & Game Feel (Week 4)

### Goal
Create immersive audio experience and enhance game feel.

### Tasks

#### Audio Assets
- [ ] Source/create music tracks
  - Menu theme (eerie, calm)
  - Game theme (tense, building)
  - Victory music (triumphant)
  - Game over music (somber)
- [ ] Source/create sound effects
  - Doll turn sound (mechanical creak)
  - Footsteps (looping)
  - Gunshot
  - Detection sting
  - Victory chime
  - UI button clicks
  - Countdown beeps
- [ ] Optimize audio files
  - Convert to MP3 (music)
  - Convert to MP3/OGG (SFX)
  - Compress for fast loading

#### Audio Implementation
- [ ] Integrate all audio files
- [ ] Create audio sprite sheets for SFX
- [ ] Implement background music system
  - Crossfading between tracks
  - Loop seamlessly
- [ ] Sync sounds with animations
  - Doll turn sound timing
  - Footsteps match run cycle
  - Gunshot with flash effect
- [ ] Add spatial audio (volume based on distance)
- [ ] Implement volume controls
  - Master volume
  - Music volume
  - SFX volume
  - Mute toggle

#### Mobile Audio
- [ ] Test iOS audio unlock
- [ ] Add user interaction gate
- [ ] Handle audio context suspension
- [ ] Test on multiple devices
  - iPhone (Safari)
  - Android (Chrome)
  - iPad

#### Game Feel Enhancements
- [ ] Add screen shake
  - On elimination (strong)
  - On doll turn (subtle)
  - On gunshot
- [ ] Implement haptic feedback (mobile)
  - Vibration on detection
  - Vibration on doll turn
- [ ] Add visual punch
  - Freeze frames at key moments
  - Slow motion on elimination
  - Screen flash effects
- [ ] Polish timing
  - Adjust animation speeds
  - Fine-tune state transitions
  - Balance difficulty timing

#### NPC System
- [ ] Create NPC class
- [ ] Implement AI behavior
  - Risk levels (cautious, balanced, risky)
  - Movement patterns
  - Elimination chance
- [ ] Add visual variety
  - Different player numbers
  - Slight position offsets
- [ ] NPC elimination sequences
- [ ] Spawn based on difficulty
  - Easy: 5 NPCs
  - Normal: 10 NPCs
  - Hard: 15 NPCs

#### UI Enhancements
- [ ] Add tutorial overlay
  - Animated instructions
  - Skippable
  - Show only on first play
- [ ] Create loading screen
  - Progress bar
  - Tips/instructions
  - Squid Game themed
- [ ] Implement pause menu
  - Resume button
  - Restart button
  - Settings access
  - Exit to menu
- [ ] Add settings panel
  - Audio sliders
  - Difficulty selector
  - Controls remapping (desktop)

### Deliverables
- ✅ Full audio integration
- ✅ Game feels punchy and responsive
- ✅ NPCs add atmosphere
- ✅ Mobile audio works correctly
- ✅ Complete UI flow

### Estimated Time
**25-30 hours**

---

## Phase 5: Features & Testing (Week 5)

### Goal
Complete all features and ensure quality through testing.

### Tasks

#### Scoring System
- [ ] Implement score calculation
  - Base score: 1000
  - Time bonus: remaining seconds × 10
  - Difficulty multiplier (1.0x, 1.5x, 2.0x)
  - Perfect run bonus: +500
- [ ] Display live score during gameplay
- [ ] Show score breakdown on victory screen
- [ ] Implement high score system
  - Per-difficulty leaderboard
  - localStorage persistence
  - Display on menu
  - Timestamp tracking

#### Difficulty System
- [ ] Implement difficulty selection UI
- [ ] Configure difficulty parameters
  - Time limits (90s, 75s, 60s)
  - Finish distances (800px, 1000px, 1200px)
  - Detection thresholds (0.3, 0.2, 0.1)
  - Doll timing ranges
- [ ] Add "Hard Mode" special features
  - Fake doll turns (head twitches)
  - Stricter detection
- [ ] Balance through playtesting

#### Victory/Defeat Screens
- [ ] Victory screen
  - Animated celebration
  - Score breakdown display
  - High score comparison
  - Social share button
  - "Play Again" button
  - "Menu" button
- [ ] Game Over screen
  - Elimination replay
  - Score display
  - Retry button
  - Difficulty change option
  - Menu button

#### Settings & Persistence
- [ ] Implement settings persistence
  - Volume preferences
  - Difficulty preference
  - Tutorial completion flag
  - High scores
- [ ] Add settings validation
- [ ] Create reset function
- [ ] Export/import settings (future feature)

#### Unit Testing
- [ ] Set up Vitest
- [ ] Test DetectionSystem
  - Movement threshold detection
  - Difficulty variations
  - Edge cases
- [ ] Test ScoreSystem
  - Score calculation accuracy
  - Difficulty multipliers
  - Bonus scoring
- [ ] Test GameStateManager
  - State transitions
  - Event emissions
  - Invalid state handling
- [ ] Test TimerSystem
- [ ] Aim for 80%+ coverage on systems

#### E2E Testing
- [ ] Set up Playwright
- [ ] Test critical user paths
  - Start game → Play → Win
  - Start game → Play → Lose
  - Settings changes persist
  - High score saves
- [ ] Test on multiple browsers
  - Chrome (desktop + mobile)
  - Firefox
  - Safari (iOS)
- [ ] Test touch vs keyboard controls

#### Performance Testing
- [ ] Profile frame rate
  - Target: 60 FPS on iPhone SE (2020)
  - Monitor dropped frames
- [ ] Optimize bundle size
  - Code splitting
  - Tree shaking
  - Asset compression
- [ ] Test load time
  - Target: < 3s on 4G
- [ ] Memory leak detection
- [ ] Long play session testing

#### Bug Fixes
- [ ] Fix all known issues
- [ ] Address tester feedback
- [ ] Polish edge cases
- [ ] Cross-browser compatibility
- [ ] Mobile device testing

#### Accessibility
- [ ] Add keyboard navigation
- [ ] Implement screen reader support
- [ ] Color blind mode
- [ ] Adjustable text size
- [ ] WCAG 2.1 compliance

### Deliverables
- ✅ All features implemented
- ✅ Comprehensive test coverage
- ✅ Performance optimized
- ✅ Bug-free stable build
- ✅ Accessible to all users

### Estimated Time
**30-35 hours**

---

## Phase 6: Launch & Documentation (Week 6)

### Goal
Prepare for deployment and create portfolio-ready presentation.

### Tasks

#### Documentation
- [x] Write comprehensive README.md
  - Project overview
  - Features list
  - Installation instructions
  - How to play guide
  - Tech stack
  - Project structure
  - Scripts documentation
- [x] Create ARCHITECTURE.md
  - System design overview
  - Technology decisions
  - Core architecture
  - Design patterns
  - Performance optimizations
  - Testing strategy
- [x] Write GAMEPLAY.md
  - Game mechanics breakdown
  - State machine documentation
  - Scoring system
  - Difficulty design
- [x] Create ROADMAP.md (this document)
- [ ] Add inline code documentation
  - JSDoc comments
  - Complex algorithm explanations
  - Type documentation
- [ ] Create CHANGELOG.md
- [ ] Write CONTRIBUTING.md

#### Build Optimization
- [ ] Configure production build
- [ ] Enable code minification
- [ ] Enable asset compression (gzip)
- [ ] Optimize images
  - Convert to WebP where supported
  - Generate multiple resolutions
  - Implement lazy loading
- [ ] Optimize audio
  - Compress files
  - Create audio sprites
- [ ] Code splitting
  - Lazy load scenes
  - Separate vendor bundles
- [ ] Remove console.logs in production
- [ ] Source map generation

#### PWA Setup
- [ ] Create manifest.json
  - App name and description
  - Icons (192x192, 512x512)
  - Theme color
  - Display mode
- [ ] Implement service worker
  - Cache assets
  - Offline support
  - Update strategy
- [ ] Add to home screen prompt
- [ ] Test PWA functionality

#### Deployment
- [ ] Set up Vercel project
- [ ] Configure build settings
- [ ] Set up custom domain (optional)
- [ ] Configure environment variables
- [ ] Enable automatic deployments
- [ ] Set up preview deployments for PRs

#### CI/CD
- [ ] Create GitHub Actions workflows
  - Run tests on push
  - Type checking
  - Linting
  - Build verification
- [ ] Automated deployment on main branch
- [ ] Status badges for README

#### Analytics & Monitoring
- [ ] Implement privacy-friendly analytics
  - Page views
  - Play sessions
  - Completion rate
  - Average play time
- [ ] Error tracking (Sentry or similar)
- [ ] Performance monitoring
  - Core Web Vitals
  - Load times
  - Frame rate

#### Portfolio Integration
- [ ] Create case study write-up
  - Problem statement
  - Solution approach
  - Technical challenges
  - Results and learnings
- [ ] Record gameplay video
  - Screen capture with audio
  - Show all features
  - Demonstrate victory and defeat
  - Edit to 1-2 minutes
- [ ] Create screenshot gallery
  - Menu screen
  - Gameplay (green light)
  - Gameplay (red light)
  - Victory screen
  - Settings panel
- [ ] Write technical blog post
  - Interesting challenges solved
  - Code examples
  - Performance optimizations
  - Lessons learned
- [ ] Create social media assets
  - Twitter card image
  - LinkedIn preview
  - Portfolio thumbnail

#### Launch Checklist
- [ ] Final QA pass
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance audit (Lighthouse)
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90
- [ ] Security audit
- [ ] Legal review (disclaimer text)
- [ ] Backup project

#### Post-Launch
- [ ] Monitor error reports
- [ ] Collect user feedback
- [ ] Address critical bugs
- [ ] Performance monitoring
- [ ] Plan v1.1 features

### Deliverables
- ✅ Live deployed game
- ✅ Professional documentation
- ✅ Portfolio case study
- ✅ Social media ready
- ✅ CI/CD pipeline functional

### Estimated Time
**20-25 hours**

---

## Future Phases (Post-Launch)

### Version 1.1: Polish & Fixes
- Fix bugs reported by users
- Performance improvements
- Additional audio/visual polish
- Accessibility enhancements

### Version 2.0: Additional Games
- Honeycomb/Dalgona Candy game
- Unified game selector menu
- Shared progression system
- Achievements system

### Version 2.1: Social Features
- Global leaderboard (requires backend)
- Share score to social media
- Challenge friends
- Daily/weekly challenges

### Version 3.0: Multiplayer
- Real-time multiplayer mode
- Lobby system
- Spectator mode
- Chat functionality

### Version 3.1: Mobile Apps
- React Native port
- iOS App Store release
- Google Play Store release
- Native performance optimizations

---

## Time Estimate Summary

| Phase | Hours | Duration |
|-------|-------|----------|
| Phase 1: Foundation | 20-25h | Week 1 |
| Phase 2: Core Gameplay | 25-30h | Week 2 |
| Phase 3: Visual Polish | 30-35h | Week 3 |
| Phase 4: Audio & Feel | 25-30h | Week 4 |
| Phase 5: Features & Testing | 30-35h | Week 5 |
| Phase 6: Launch | 20-25h | Week 6 |
| **Total** | **150-180h** | **6 weeks** |

**Assumptions:**
- 25-30 hours per week of focused development
- Asset creation included in estimates
- No major blockers or scope changes
- Single developer

---

## Risk Management

### Potential Blockers

1. **Asset Creation**
   - **Risk**: Creating quality sprites takes longer than expected
   - **Mitigation**: Use placeholder sprites initially, iterate on art later
   - **Backup**: Source free/paid assets from asset stores

2. **Mobile Audio Issues**
   - **Risk**: iOS audio policies cause problems
   - **Mitigation**: Research best practices early, test frequently
   - **Backup**: Simplify audio or make it optional

3. **Performance on Low-End Devices**
   - **Risk**: Game runs slowly on older phones
   - **Mitigation**: Profile early, optimize continuously
   - **Backup**: Reduce visual effects, lower frame rate target

4. **Scope Creep**
   - **Risk**: Adding features extends timeline
   - **Mitigation**: Stick to roadmap, defer non-critical features
   - **Backup**: Create "nice-to-have" backlog for post-launch

5. **Testing Takes Longer Than Expected**
   - **Risk**: Bug fixes eat into launch timeline
   - **Mitigation**: Test continuously during development
   - **Backup**: Launch with known minor bugs, patch post-launch

---

## Success Metrics

### Technical Metrics
- ✅ 80%+ test coverage on core systems
- ✅ 60 FPS on iPhone SE (2020)
- ✅ < 3 second load time on 4G
- ✅ < 500KB initial bundle size
- ✅ Lighthouse score > 90

### User Experience Metrics
- ✅ Playable on first attempt without instructions
- ✅ Win rate: 30-50% on Normal difficulty
- ✅ Average play session: 5-10 minutes
- ✅ Positive feedback from 10+ playtesters

### Portfolio Metrics
- ✅ Featured on personal portfolio
- ✅ Shared on LinkedIn/Twitter
- ✅ Positive reactions from peers
- ✅ Demonstrates full-stack game development skills
- ✅ Shows end-to-end project execution

---

## Conclusion

This roadmap provides a structured path from empty repository to deployed, portfolio-ready game in 6 weeks. Each phase builds upon the previous, with clear deliverables and time estimates.

The key to success is:
1. **Stick to the plan** - Resist scope creep
2. **Test continuously** - Don't leave testing to the end
3. **Iterate** - Start simple, add polish incrementally
4. **Document** - Write docs as you build, not after
5. **Have fun!** - This is a learning project, enjoy the process

Good luck building your Squid Game! 🦑
