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
import Doll from '../entities/Doll';
import InputManager from '../managers/InputManager';
import ParticleManager from '../managers/ParticleManager';
import DetectionSystem from '../systems/DetectionSystem';
import MovementSystem from '../systems/MovementSystem';
import GameStateManager from '../systems/GameStateManager';
import SoundGenerator from '../utils/SoundGenerator';
import AudioManager from '../managers/AudioManager';

export default class GameScene extends Phaser.Scene {
  // Configuration
  private difficulty!: Difficulty;
  private finishY!: number;

  // Entities
  private player!: Player;
  private doll!: Doll;

  // Systems
  private inputManager!: InputManager;
  private particleManager!: ParticleManager;
  private detectionSystem!: DetectionSystem;
  private movementSystem!: MovementSystem;
  private stateManager!: GameStateManager;
  private soundGenerator!: SoundGenerator;
  private audioManager!: AudioManager;
  private musicEnabled: boolean = true;

  // UI
  private stateText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timeRemaining: number = 0;

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

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND_CREAM);

    // Create field visualization
    this.createField();

    // Create entities
    this.player = new Player(this, width / 2, height * 0.9);
    this.doll = new Doll(this, width / 2, 80, config);

    // Check music setting
    this.musicEnabled = this.registry.get('musicEnabled') ?? true;

    // Get AudioManager from registry
    this.audioManager = this.registry.get('audioManager') as AudioManager;

    // Load gameplay music
    if (!this.audioManager) {
      console.warn('AudioManager not found in registry, creating new instance');
      this.audioManager = new AudioManager();
    }

    // Load the Squid Game background music
    this.audioManager.loadMusic('gameplay', ['/audio/gameplay-music.mp3']);

    // Create systems
    this.inputManager = new InputManager(this);
    this.particleManager = new ParticleManager(this);
    this.detectionSystem = new DetectionSystem(this, config);
    this.movementSystem = new MovementSystem(this, this.player, this.inputManager);
    this.stateManager = new GameStateManager(GameState.READY);
    this.soundGenerator = new SoundGenerator();

    // Create UI
    this.createHUD();

    // Set up event listeners
    this.setupEventListeners();

    // Start game countdown
    this.startCountdown();
  }

  update(time: number, delta: number): void {
    // Update entities
    if (this.stateManager.isPlaying()) {
      this.player.update(time, delta);
      this.doll.update(time, delta);
      this.movementSystem.update(time, delta);

      // Check for detection during red light
      if (this.stateManager.isRedLight()) {
        const caught = this.detectionSystem.checkPlayer(this.player, this.doll.isFacing());
        if (caught) {
          this.handlePlayerCaught();
        }
      }

      // Check for victory
      if (this.movementSystem.checkFinishLine(this.finishY)) {
        this.handleVictory();
      }

      // Update timer
      this.updateTimer(delta);
    }
  }

  private createField(): void {
    const { width, height } = this.cameras.main;

    // State border (will change color based on light)
    this.stateBorder = this.add.rectangle(width / 2, height / 2, width, height);
    this.stateBorder.setStrokeStyle(8, COLORS.CONCRETE_GRAY, 0);
    this.stateBorder.setDepth(-1);

    // Draw simple field
    const fieldGraphics = this.add.graphics();

    // Starting area
    fieldGraphics.fillStyle(0x8c8c8c, 0.3);
    fieldGraphics.fillRect(0, height * 0.8, width, height * 0.2);

    // Finish line
    fieldGraphics.fillStyle(COLORS.TRACKSUIT_GREEN, 0.5);
    fieldGraphics.fillRect(0, 0, width, height * 0.1);
    this.add.text(width / 2, height * 0.05, 'FINISH', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Distance markers
    for (let i = 1; i < 4; i++) {
      const y = height * (0.2 + i * 0.15);
      fieldGraphics.lineStyle(2, 0x8c8c8c, 0.3);
      fieldGraphics.lineBetween(0, y, width, y);
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

    // Start Squid Game background music
    if (this.musicEnabled) {
      this.audioManager.playMusic();
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

    // Warning color when low on time
    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#E63946');

      // Pulse animation
      if (Math.floor(this.timeRemaining) !== Math.floor(this.timeRemaining + delta / 1000)) {
        this.tweens.add({
          targets: this.timerText,
          scale: 1.2,
          duration: 100,
          yoyo: true,
        });
      }
    }
  }

  private handlePlayerCaught(): void {
    console.log('💀 Player caught moving!');

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
      this.gameOver();
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
      this.gameOver();
    });
  }

  private calculateScore(): number {
    const timeBonus = Math.ceil(this.timeRemaining) * GAME_CONSTANTS.TIME_BONUS_MULTIPLIER;
    const difficultyMultiplier = GAME_CONSTANTS.DIFFICULTY_MULTIPLIER[this.difficulty];
    const baseScore = GAME_CONSTANTS.BASE_SCORE;

    const finalScore = Math.floor((baseScore + timeBonus) * difficultyMultiplier);
    return finalScore;
  }

  private gameOver(): void {
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME_OVER);
    });
  }

  private victory(score: number): void {
    // Save score to registry for victory screen
    this.registry.set('currentScore', score);

    // Update high score
    const highScore = this.registry.get('highScore') as number;
    if (score > highScore) {
      this.registry.set('highScore', score);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('squidgame-highscore', score.toString());
      }
    }

    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.VICTORY);
    });
  }

  shutdown(): void {
    // Cleanup music
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }

    // Cleanup events
    this.events.off('doll-green-light');
    this.events.off('doll-turning-to-face');
    this.events.off('doll-red-light');
    this.events.off('doll-turning-away');
    this.events.off('player-detected');
  }
}
