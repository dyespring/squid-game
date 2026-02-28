# Architecture Documentation

## Table of Contents
- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Core Architecture](#core-architecture)
- [Scene Management](#scene-management)
- [Entity System](#entity-system)
- [Game Systems](#game-systems)
- [State Management](#state-management)
- [Performance Optimization](#performance-optimization)
- [Mobile Considerations](#mobile-considerations)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React UI Layer (menus/overlays)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Phaser Game Engine (canvas)                 │   │
│  │  ┌────────────┬────────────┬────────────────────┐    │   │
│  │  │   Scenes   │  Entities  │  Systems/Managers  │    │   │
│  │  └────────────┴────────────┴────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (Zustand) + Audio (Howler.js)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **Entity-Component Pattern** - Game objects (Player, Doll) encapsulate behavior
2. **System Architecture** - Pure logic systems (Detection, Movement) operate on entities
3. **State Machine** - Game flow controlled by explicit state transitions
4. **Manager Pattern** - Singleton-style managers for cross-cutting concerns
5. **Configuration-Driven** - Constants and settings in separate config files

---

## Technology Stack

### Why Phaser 3?

**Advantages:**
- Battle-tested framework with 10+ years of development
- Built-in systems: physics, input, sound, scenes
- Excellent mobile support and touch handling
- Active community and extensive documentation
- Small bundle size (~1MB minified)
- TypeScript definitions included

**Selected Over:**
- Pure Canvas API - Too low-level
- Three.js - Overkill for 2D
- PixiJS - Great renderer but lacks game structure
- Unity WebGL - Large bundle size

### Core Technologies

```json
{
  "Language": "TypeScript 5.0+",
  "Game Engine": "Phaser 3.60+",
  "Build Tool": "Vite 5.x",
  "UI Framework": "React 18+",
  "Styling": "Tailwind CSS",
  "Animation": "GSAP 3.x",
  "Audio": "Howler.js 2.x",
  "State": "Zustand 4.x",
  "Testing": "Vitest + Playwright"
}
```

---

## Core Architecture

### Configuration System

**File: `src/game/config/gameConfig.ts`**

```typescript
export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  parent: 'game-container',
  width: 375,
  height: 667,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.PORTRAIT
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene],
  backgroundColor: '#F5E6D3'
};
```

**File: `src/game/config/constants.ts`**

```typescript
export const GAME_CONSTANTS = {
  // Player
  PLAYER_BASE_SPEED: 150,
  PLAYER_ACCELERATION_TIME: 300,
  PLAYER_MOMENTUM_OVERSHOOT: 100,

  // Detection
  DETECTION_THRESHOLD_EASY: 0.3,
  DETECTION_THRESHOLD_NORMAL: 0.2,
  DETECTION_THRESHOLD_HARD: 0.1,

  // Doll timing
  DOLL_TURN_DURATION: 500,
  GREEN_LIGHT_DURATION_MIN: 3000,
  GREEN_LIGHT_DURATION_MAX: 6000,
  RED_LIGHT_DURATION_MIN: 2000,
  RED_LIGHT_DURATION_MAX: 4000,

  // Game rules
  FINISH_LINE_PERCENTAGE: 0.9,
  TIME_LIMIT_EASY: 90,
  TIME_LIMIT_NORMAL: 75,
  TIME_LIMIT_HARD: 60,

  // Scoring
  BASE_SCORE: 1000,
  TIME_BONUS_MULTIPLIER: 10,
  DIFFICULTY_MULTIPLIER: {
    EASY: 1.0,
    NORMAL: 1.5,
    HARD: 2.0
  },
  PERFECT_RUN_BONUS: 500
};
```

---

## Scene Management

### Scene Flow

```
BootScene → PreloadScene → MenuScene → GameScene
                                           ↓
                                    GameOverScene
                                    VictoryScene
                                           ↓
                                      MenuScene
```

### Scene Responsibilities

**BootScene**
- Initialize game systems
- Setup audio context (mobile handling)
- Check device capabilities
- Load critical assets

**PreloadScene**
- Load all assets with progress bar
- Create sprite atlases
- Initialize audio
- Transition to MenuScene

**MenuScene**
- Main menu UI
- Difficulty selection
- Settings
- High scores

**GameScene**
- Main gameplay loop
- Entity management
- System updates
- Win/lose checking

**GameOverScene / VictoryScene**
- End game UI
- Score display
- Retry/menu options

---

## Entity System

### Base Entity Class

```typescript
export abstract class BaseEntity extends Phaser.GameObjects.Sprite {
  protected scene: Phaser.Scene;
  public entityId: string;

  constructor(scene: Phaser.Scene, x: number, y: number,
              texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    this.scene = scene;
    this.entityId = Phaser.Utils.String.UUID();
    scene.add.existing(this);
  }

  abstract update(time: number, delta: number): void;
  abstract destroy(): void;
}
```

### Player Entity

```typescript
export class Player extends BaseEntity {
  private velocity: number = 0;
  private targetVelocity: number = 0;
  private lastPosition: Phaser.Math.Vector2;
  public isMoving: boolean = false;

  startMoving(): void {
    this.isMoving = true;
    this.targetVelocity = GAME_CONSTANTS.PLAYER_BASE_SPEED;
    this.anims.play('player-run', true);
  }

  stopMoving(): void {
    this.isMoving = false;
    this.targetVelocity = 0;
    this.anims.play('player-idle', true);
  }

  update(time: number, delta: number): void {
    // Smooth acceleration
    this.velocity = Phaser.Math.Linear(
      this.velocity,
      this.targetVelocity,
      delta / GAME_CONSTANTS.PLAYER_ACCELERATION_TIME
    );

    // Update position
    this.y -= this.velocity * (delta / 1000);
    this.lastPosition.set(this.x, this.y);
  }

  getMovementDelta(): number {
    return Math.abs(this.y - this.lastPosition.y);
  }
}
```

---

## Game Systems

### Detection System

```typescript
export class DetectionSystem {
  private threshold: number;

  constructor(scene: Phaser.Scene, difficulty: Difficulty) {
    this.scene = scene;
    this.threshold = this.getThresholdForDifficulty(difficulty);
  }

  checkPlayer(player: Player, gameState: GameState): boolean {
    if (gameState !== GameState.RED_LIGHT) return false;

    const movementDelta = player.getMovementDelta();

    if (movementDelta > this.threshold) {
      this.handleDetection(player);
      return true;
    }

    return false;
  }

  private handleDetection(player: Player): void {
    // Visual feedback
    this.createSpotlight(player);
    this.scene.cameras.main.shake(500, 0.01);

    // Audio feedback
    this.scene.registry.get('audioManager').play('detected');

    // Emit event
    this.scene.events.emit('player-detected', { player });
  }
}
```

### Game State Manager

```typescript
export enum GameState {
  READY = 'READY',
  GREEN_LIGHT = 'GREEN_LIGHT',
  TRANSITION = 'TRANSITION',
  RED_LIGHT = 'RED_LIGHT',
  CHECKING = 'CHECKING',
  ELIMINATION = 'ELIMINATION',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export class GameStateManager {
  private currentState: GameState;
  private listeners: Map<GameState, Function[]>;

  setState(newState: GameState): void {
    const oldState = this.currentState;
    this.currentState = newState;

    this.scene.events.emit('state-change', {
      from: oldState,
      to: newState
    });

    // Call registered listeners
    const callbacks = this.listeners.get(newState) || [];
    callbacks.forEach(cb => cb(newState, oldState));
  }

  onStateChange(state: GameState, callback: Function): void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    this.listeners.get(state)!.push(callback);
  }
}
```

---

## State Management

### Zustand Store

```typescript
import { create } from 'zustand';

interface GameStore {
  volume: number;
  difficulty: Difficulty;
  currentScore: number;
  highScore: number;

  setVolume: (volume: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setScore: (score: number) => void;
  saveHighScore: (score: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  volume: 0.7,
  difficulty: 'NORMAL',
  currentScore: 0,
  highScore: parseInt(localStorage.getItem('highScore') || '0'),

  setVolume: (volume) => set({ volume }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setScore: (score) => set({ currentScore: score }),

  saveHighScore: (score) => {
    const currentHigh = get().highScore;
    if (score > currentHigh) {
      set({ highScore: score });
      localStorage.setItem('highScore', score.toString());
    }
  }
}));
```

---

## Performance Optimization

### Object Pooling

```typescript
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
}

// Usage for particles
const particlePool = new ObjectPool(
  () => scene.add.circle(0, 0, 5, 0xFFFFFF),
  (particle) => {
    particle.setActive(false);
    particle.setVisible(false);
  },
  50 // initial size
);
```

### Texture Atlases

```json
{
  "frames": {
    "idle": { "x": 0, "y": 0, "w": 128, "h": 128 },
    "run-1": { "x": 128, "y": 0, "w": 128, "h": 128 },
    "run-2": { "x": 256, "y": 0, "w": 128, "h": 128 },
    "run-3": { "x": 384, "y": 0, "w": 128, "h": 128 },
    "run-4": { "x": 512, "y": 0, "w": 128, "h": 128 }
  }
}
```

**Benefits:**
- Single HTTP request
- GPU optimization
- Reduced state changes
- Smaller total file size

---

## Mobile Considerations

### Touch Input Handling

```typescript
export class InputManager {
  private isTouchDevice: boolean;
  private isPointerDown: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.isTouchDevice = 'ontouchstart' in window;
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    if (this.isTouchDevice) {
      this.scene.input.on('pointerdown', () => {
        this.isPointerDown = true;
      });

      this.scene.input.on('pointerup', () => {
        this.isPointerDown = false;
      });
    } else {
      this.setupKeyboardControls();
    }
  }

  isMovementInputActive(): boolean {
    return this.isPointerDown;
  }
}
```

### iOS Audio Workaround

```typescript
export class AudioManager {
  private isUnlocked: boolean = false;

  constructor() {
    this.setupMobileAudioUnlock();
  }

  private setupMobileAudioUnlock(): void {
    const unlockAudio = () => {
      if (!this.isUnlocked) {
        const silent = new Howl({
          src: ['data:audio/wav;base64,...'],
          volume: 0
        });
        silent.play();
        silent.once('play', () => {
          this.isUnlocked = true;
          document.removeEventListener('touchstart', unlockAudio);
        });
      }
    };

    document.addEventListener('touchstart', unlockAudio);
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/DetectionSystem.test.ts
describe('DetectionSystem', () => {
  it('should detect movement above threshold', () => {
    const player = createMockPlayer({ velocity: 5 });
    const detected = detectionSystem.checkPlayer(player);
    expect(detected).toBe(true);
  });

  it('should not detect during green light', () => {
    gameState.set('GREEN_LIGHT');
    const player = createMockPlayer({ velocity: 5 });
    const detected = detectionSystem.checkPlayer(player);
    expect(detected).toBe(false);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/gameplay.spec.ts
test('complete game on easy difficulty', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Start Game');
  await page.click('text=Easy');

  // Wait for green light
  await page.waitForSelector('.green-light-indicator');

  // Move player
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();

  // Verify victory
  await expect(page.locator('.victory-screen')).toBeVisible();
});
```

---

## Build Configuration

### Vite Production Build

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), viteCompression()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          vendor: ['react', 'zustand'],
          audio: ['howler']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
});
```

---

## Summary

This architecture provides:

✅ **Separation of Concerns** - Clear boundaries between systems
✅ **Testability** - Isolated, testable components
✅ **Scalability** - Easy to add new games
✅ **Performance** - Optimized for mobile
✅ **Maintainability** - TypeScript ensures type safety
✅ **Mobile-First** - Touch and iOS audio handled

The design balances pragmatism with best practices, creating a solid foundation for a portfolio-quality game.
