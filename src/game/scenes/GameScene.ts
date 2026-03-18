/**
 * GameScene
 * Main gameplay scene with complete game loop
 */

import Phaser from 'phaser';
import { SCENES, COLORS, GAME_CONSTANTS } from '../config/constants';
import { GameState, type Difficulty } from '@/types/game.types';
import { getDifficultyConfig } from '../config/difficultySettings';

// Import entities and systems
import Player from '../entities/Player';
import NPC from '../entities/NPC';
import Doll from '../entities/Doll';
import InputManager from '../managers/InputManager';
import ParticleManager from '../managers/ParticleManager';
import DetectionSystem from '../systems/DetectionSystem';
import MovementSystem from '../systems/MovementSystem';
import GameStateManager from '../systems/GameStateManager';
import { ScoreSystem } from '../systems/ScoreSystem';
import SoundGenerator from '../utils/SoundGenerator';
import MusicGenerator from '../utils/MusicGenerator';

export default class GameScene extends Phaser.Scene {
  // Configuration
  private difficulty!: Difficulty;
  private finishY!: number;

  // Entities
  private player!: Player;
  private npcs: NPC[] = [];
  private doll!: Doll;

  // Systems
  private inputManager!: InputManager;
  private particleManager!: ParticleManager;
  private detectionSystem!: DetectionSystem;
  private movementSystem!: MovementSystem;
  private stateManager!: GameStateManager;
  private scoreSystem!: ScoreSystem;
  private soundGenerator!: SoundGenerator;
  private musicGenerator!: MusicGenerator;
  private musicEnabled: boolean = true;

  // UI
  private stateText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timeRemaining: number = 0;

  // Pause
  private isPaused: boolean = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  // Screen border for state visualization
  private stateBorder!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: SCENES.GAME });
  }

  create(): void {
    console.log('🎮 GameScene: Starting game');

    const { width, height } = this.cameras.main;

    // Get difficulty from registry
    this.difficulty = this.registry.get('difficulty') as Difficulty;
    const config = getDifficultyConfig(this.difficulty);
    this.timeRemaining = config.timeLimit;
    this.finishY = height * GAME_CONSTANTS.FINISH_LINE_PERCENTAGE;

    // Fade in
    this.cameras.main.fadeIn(500);

    // Create field visualization (includes gradient background)
    this.createField();

    // Create entities
    this.player = new Player(this, width / 2, height * 0.9);
    this.createNPCs(width, height);
    this.doll = new Doll(this, width / 2, 80, config);

    this.musicEnabled = this.registry.get('musicEnabled') ?? true;
    this.musicGenerator = MusicGenerator.getInstance();

    // Create systems
    this.inputManager = new InputManager(this);
    this.particleManager = new ParticleManager(this);
    this.detectionSystem = new DetectionSystem(this, config);
    this.movementSystem = new MovementSystem(this, this.player, this.inputManager);
    this.stateManager = new GameStateManager(GameState.READY);
    this.scoreSystem = new ScoreSystem();
    this.soundGenerator = new SoundGenerator();

    // Create UI
    this.createHUD();

    // Set up event listeners
    this.setupEventListeners();

    // Start game countdown
    this.startCountdown();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    if (this.stateManager.isPlaying()) {
      this.player.update(time, delta);
      this.doll.update(time, delta);
      this.movementSystem.update(time, delta);

      // Update NPCs with AI
      const isGreenLight = this.stateManager.isGreenLight();
      this.npcs.forEach(npc => {
        npc.updateAI(isGreenLight, delta);
        npc.update(time, delta);
      });

      // Check for detection during red light
      if (this.stateManager.isRedLight()) {
        const caught = this.detectionSystem.checkPlayer(this.player, this.doll.isFacing());
        if (caught) {
          this.handlePlayerCaught();
        }

        // Check NPCs for detection
        this.npcs.forEach(npc => {
          if (!npc.isEliminated) {
            const npcCaught = this.detectionSystem.checkPlayer(npc as any, this.doll.isFacing());
            if (npcCaught) {
              npc.eliminate();
            }
          }
        });
      }

      // Check for victory
      if (this.movementSystem.checkFinishLine(this.finishY)) {
        this.handleVictory();
      }

      // Update timer
      this.updateTimer(delta);
    }
  }

  private createNPCs(width: number, height: number): void {
    // Get NPC count based on difficulty
    let npcCount: number;
    switch (this.difficulty) {
      case 'EASY':
        npcCount = GAME_CONSTANTS.NPC_COUNT_EASY;
        break;
      case 'NORMAL':
        npcCount = GAME_CONSTANTS.NPC_COUNT_NORMAL;
        break;
      case 'HARD':
        npcCount = GAME_CONSTANTS.NPC_COUNT_HARD;
        break;
      default:
        npcCount = GAME_CONSTANTS.NPC_COUNT_NORMAL;
    }

    console.log(`🤖 Creating ${npcCount} NPCs for ${this.difficulty} difficulty`);

    // Create NPCs at random positions
    for (let i = 0; i < npcCount; i++) {
      // Random X position (avoid edges and player position)
      const playerX = width / 2;
      let x = 50 + Math.random() * (width - 100);

      // Keep NPCs away from player starting position
      while (Math.abs(x - playerX) < 60) {
        x = 50 + Math.random() * (width - 100);
      }

      // Random Y position in starting area (slight variation)
      const y = height * 0.85 + Math.random() * height * 0.1;

      // Random player number (avoiding 456 which is the player)
      const playerNumber = Math.floor(Math.random() * 455) + 1;

      const npc = new NPC(this, x, y, playerNumber);
      this.npcs.push(npc);
    }
  }

  private createField(): void {
    const { width, height } = this.cameras.main;

    // Gradient sky
    const bg = this.add.graphics().setDepth(-2);
    const skySteps = 20;
    for (let i = 0; i < skySteps; i++) {
      const t = i / skySteps;
      const r = Math.floor(0x7a + (0xf5 - 0x7a) * t);
      const g = Math.floor(0xbb + (0xe6 - 0xbb) * t);
      const b = Math.floor(0xdd + (0xd3 - 0xdd) * t);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, (i / skySteps) * height * 0.5, width, (height * 0.5) / skySteps + 1);
    }

    // Ground gradient
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const r = Math.floor(0xd0 - t * 0x30);
      const g = Math.floor(0xc0 - t * 0x20);
      const b = Math.floor(0xa0 - t * 0x20);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, height * 0.5 + (i / 10) * height * 0.5, width, (height * 0.5) / 10 + 1);
    }

    // Distant wall silhouette
    bg.fillStyle(0x888888, 0.3);
    bg.fillRect(0, height * 0.08, width, 8);

    // Lane lines on ground
    const fieldGfx = this.add.graphics().setDepth(-1);
    for (let i = 1; i <= 5; i++) {
      const lx = (width / 6) * i;
      fieldGfx.lineStyle(1, 0xaaaaaa, 0.15);
      fieldGfx.lineBetween(lx, height * 0.1, lx, height);
    }

    // State border
    this.stateBorder = this.add.rectangle(width / 2, height / 2, width, height);
    this.stateBorder.setStrokeStyle(8, COLORS.CONCRETE_GRAY, 0);
    this.stateBorder.setDepth(-1);

    // Starting area
    fieldGfx.fillStyle(0x8c8c8c, 0.2);
    fieldGfx.fillRect(0, height * 0.8, width, height * 0.2);

    // Finish line
    fieldGfx.fillStyle(COLORS.TRACKSUIT_GREEN, 0.5);
    fieldGfx.fillRect(0, 0, width, height * 0.1);
    this.add.text(width / 2, height * 0.05, 'FINISH', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Distance markers
    for (let i = 1; i < 4; i++) {
      const y = height * (0.2 + i * 0.15);
      fieldGfx.lineStyle(1, 0x8c8c8c, 0.2);
      fieldGfx.lineBetween(0, y, width, y);
      this.add.text(width - 10, y + 4, `${75 - i * 25}%`, {
        fontSize: '9px', color: '#999999',
      }).setOrigin(1, 0).setDepth(0);
    }
  }

  private createHUD(): void {
    const { width, height } = this.cameras.main;

    // Timer
    this.timerText = this.add.text(width / 2, 30, `Time: ${this.timeRemaining}s`, {
      fontSize: '20px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(0.5);
    this.timerText.setDepth(100);

    // State indicator
    this.stateText = this.add.text(width / 2, height - 100, 'GET READY', {
      fontSize: '32px',
      color: '#FF4581',
      fontStyle: 'bold',
    });
    this.stateText.setOrigin(0.5);
    this.stateText.setDepth(100);

    // Difficulty indicator
    this.add.text(20, 60, `Difficulty: ${this.difficulty}`, {
      fontSize: '14px',
      color: '#8C8C8C',
    }).setDepth(100);

    // Instructions
    const isMobile = this.registry.get('isMobile') as boolean;
    const instructions = isMobile ? 'Hold to Move' : 'Hold SPACE to Move';
    this.add.text(width / 2, height - 60, instructions, {
      fontSize: '14px',
      color: '#8C8C8C',
    }).setOrigin(0.5).setDepth(100);

    // Pause button
    const pauseBtn = this.add.text(width - 20, 30, '⏸', {
      fontSize: '28px',
    });
    pauseBtn.setOrigin(0.5).setDepth(100);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());

    // Keyboard pause (ESC or P)
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    // Build pause overlay (hidden initially)
    this.createPauseOverlay();
  }

  private createPauseOverlay(): void {
    const { width, height } = this.cameras.main;
    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.setDepth(200);
    this.pauseOverlay.setVisible(false);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    bg.setInteractive(); // block clicks from reaching the game
    this.pauseOverlay.add(bg);

    const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
      fontSize: '48px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.pauseOverlay.add(title);

    const resumeBtn = this.createPauseButton(width / 2, height / 2 - 20, 'RESUME', () => {
      this.togglePause();
    });
    this.pauseOverlay.add(resumeBtn);

    const restartBtn = this.createPauseButton(width / 2, height / 2 + 50, 'RESTART', () => {
      this.isPaused = false;
      this.scene.restart();
    });
    this.pauseOverlay.add(restartBtn);

    const menuBtn = this.createPauseButton(width / 2, height / 2 + 120, 'QUIT TO MENU', () => {
      this.isPaused = false;
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.MENU);
      });
    });
    this.pauseOverlay.add(menuBtn);
  }

  private createPauseButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, {
      fontSize: '20px',
      color: '#FFFFFF',
      backgroundColor: '#FF4581',
      padding: { x: 24, y: 12 },
      fontStyle: 'bold',
    });
    btn.setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setScale(1.08));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', callback);
    return btn;
  }

  private togglePause(): void {
    if (this.stateManager.isState(GameState.GAME_OVER) ||
        this.stateManager.isState(GameState.VICTORY) ||
        this.stateManager.isState(GameState.ELIMINATION) ||
        this.stateManager.isState(GameState.READY)) {
      return;
    }

    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);

    if (this.isPaused) {
      this.inputManager.reset();
      this.player.stopMoving();
    }
  }

  private setupEventListeners(): void {
    // Doll events
    this.events.on('doll-green-light', () => {
      this.stateManager.setState(GameState.GREEN_LIGHT);
      this.updateStateUI('GREEN LIGHT!', '#4CAF50', COLORS.TRACKSUIT_GREEN);
      this.soundGenerator.playGreenLight();
    });

    this.events.on('doll-turning-to-face', () => {
      this.stateManager.setState(GameState.TRANSITION);
      this.updateStateUI('STOP!', '#FF9800', COLORS.SQUID_PINK);
      this.particleManager.createWarningFlash();
      this.soundGenerator.playWarning();
      this.soundGenerator.playDollTurn();
    });

    this.events.on('doll-red-light', () => {
      this.stateManager.setState(GameState.RED_LIGHT);
      this.updateStateUI('RED LIGHT!', '#E63946', COLORS.DANGER_RED);
      this.soundGenerator.playRedLight();
    });

    this.events.on('doll-turning-away', () => {
      this.stateManager.setState(GameState.TRANSITION);
      this.soundGenerator.playDollTurn();
    });

    // Detection event
    this.events.on('player-detected', () => {
      // Handled in handlePlayerCaught
    });

    // Player particle events
    this.events.on('player-emit-dust', (data: { x: number; y: number }) => {
      this.particleManager.emitDust(data.x, data.y);
      this.soundGenerator.playFootstep(0.2);
    });

    this.events.on('player-eliminated', (data: { x: number; y: number }) => {
      this.particleManager.createElimination(data.x, data.y);
      this.soundGenerator.playGunshot();
    });

    this.events.on('player-victory', (data: { x: number; y: number }) => {
      this.particleManager.createConfetti(data.x, data.y);
      this.particleManager.createFloatingText(data.x, data.y - 60, 'WINNER!', '#FFD700');
      this.soundGenerator.playVictory();
    });

    this.events.on('npc-eliminated', (data: { x: number; y: number }) => {
      this.particleManager.createElimination(data.x, data.y);
      this.soundGenerator.playGunshot();
    });
  }

  private updateStateUI(text: string, color: string, borderColor: number): void {
    this.stateText.setText(text);
    this.stateText.setColor(color);

    // Animate border
    this.stateBorder.setStrokeStyle(8, borderColor, 0.6);

    this.tweens.add({
      targets: this.stateBorder,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
    });

    // Pulse text
    this.particleManager.createPulse(this.stateText, 1.3, 250);
  }

  private startCountdown(): void {
    let count = 3;

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (count > 0) {
          this.stateText.setText(`${count}`);
          this.soundGenerator.playCountdown();
          count--;
        } else {
          this.stateText.setText('GO!');
          this.soundGenerator.playCountdown(0.5);
          countdownTimer.remove();

          // Start actual game after brief delay
          this.time.delayedCall(500, () => {
            this.startGameplay();
          });
        }
      },
      repeat: 3,
    });
  }

  private startGameplay(): void {
    console.log('🏃 Starting gameplay');

    // Start score tracking
    this.scoreSystem.start();

    if (this.musicEnabled) {
      this.musicGenerator.playGameplayMusic();
    }

    // Start doll cycle
    this.doll.startCycle();

    // Set initial state
    this.stateManager.setState(GameState.GREEN_LIGHT);
  }

  private updateTimer(delta: number): void {
    this.timeRemaining -= delta / 1000;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.handleTimeUp();
      return;
    }

    this.timerText.setText(`Time: ${Math.ceil(this.timeRemaining)}s`);

    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#E63946');

      if (Math.floor(this.timeRemaining) !== Math.floor(this.timeRemaining + delta / 1000)) {
        this.tweens.add({
          targets: this.timerText,
          scale: 1.3,
          duration: 100,
          yoyo: true,
        });
        this.soundGenerator.playTimerTick();
      }
    }
  }

  private handlePlayerCaught(): void {
    console.log('💀 Player caught moving!');

    this.scoreSystem.recordDetection();

    // Stop game
    this.doll.stopCycle();
    this.stateManager.setState(GameState.ELIMINATION);

    // Eliminate player
    this.player.eliminate();

    // Update UI
    this.stateText.setText('ELIMINATED!');
    this.stateText.setColor('#E63946');

    // Wait then show game over
    this.time.delayedCall(2000, () => {
      this.gameOver('eliminated');
    });
  }

  private handleVictory(): void {
    console.log('🎉 Player reached finish!');

    // Stop game
    this.doll.stopCycle();
    this.stateManager.setState(GameState.VICTORY);

    // Victory animation
    this.player.playVictoryAnimation();

    // Update UI
    this.stateText.setText('VICTORY!');
    this.stateText.setColor('#4CAF50');

    // Calculate score
    const score = this.calculateScore();
    console.log(`📊 Final Score: ${score}`);

    // Wait then show victory screen
    this.time.delayedCall(2000, () => {
      this.victory(score);
    });
  }

  private handleTimeUp(): void {
    console.log("⏰ Time's up!");

    // Stop game
    this.doll.stopCycle();
    this.stateManager.setState(GameState.GAME_OVER);

    // Update UI
    this.stateText.setText("TIME'S UP!");
    this.stateText.setColor('#E63946');

    // Wait then show game over
    this.time.delayedCall(2000, () => {
      this.gameOver('timeout');
    });
  }

  private calculateScore(): number {
    // Calculate score using ScoreSystem
    const scoreCalculation = this.scoreSystem.calculateFinalScore(
      Math.ceil(this.timeRemaining),
      this.difficulty
    );

    // Store score breakdown in registry for victory screen
    this.registry.set('scoreBreakdown', scoreCalculation);

    return scoreCalculation.finalScore;
  }

  private gameOver(reason: 'eliminated' | 'timeout'): void {
    const config = getDifficultyConfig(this.difficulty);
    const { height } = this.cameras.main;
    const totalDistance = height * 0.9 - this.finishY;
    const progressPercent = Math.min(
      100,
      Math.floor((this.player.distanceTraveled / totalDistance) * 100)
    );
    const timeSurvived = config.timeLimit - Math.max(0, Math.ceil(this.timeRemaining));

    this.registry.set('gameOverData', {
      reason,
      difficulty: this.difficulty,
      progressPercent,
      timeSurvived,
      timeLimit: config.timeLimit,
    });

    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME_OVER);
    });
  }

  private victory(score: number): void {
    // Save score to registry for victory screen
    this.registry.set('currentScore', score);
    this.registry.set('currentDifficulty', this.difficulty);
    this.registry.set('isPerfectRun', this.scoreSystem.isPerfectRun());

    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.VICTORY);
    });
  }

  shutdown(): void {
    this.isPaused = false;

    if (this.musicGenerator) {
      this.musicGenerator.stopMusic();
    }

    this.input.keyboard?.off('keydown-ESC');
    this.input.keyboard?.off('keydown-P');

    this.events.off('doll-green-light');
    this.events.off('doll-turning-to-face');
    this.events.off('doll-red-light');
    this.events.off('doll-turning-away');
    this.events.off('player-detected');
    this.events.off('player-emit-dust');
    this.events.off('player-eliminated');
    this.events.off('player-victory');
    this.events.off('npc-eliminated');
  }
}
