/**
 * TugOfWarScene
 * Rapid-tap game where the player's team pulls against an AI team.
 * Tap/click rapidly to pull; tapping in rhythm gives a power boost.
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import type { Difficulty } from '@/types/game.types';
import SoundGenerator from '../utils/SoundGenerator';
import MusicGenerator from '../utils/MusicGenerator';

const DIFFICULTY_CONFIG = {
  EASY:   { aiStrength: 0.55, timeLimit: 30, staminaDrain: 0.6, staminaRegen: 8 },
  NORMAL: { aiStrength: 0.72, timeLimit: 25, staminaDrain: 0.8, staminaRegen: 6 },
  HARD:   { aiStrength: 0.88, timeLimit: 20, staminaDrain: 1.0, staminaRegen: 4 },
} as const;

const SCORE_MULTIPLIER = { EASY: 1.0, NORMAL: 1.5, HARD: 2.0 } as const;

const WIN_THRESHOLD = 100;
const ROPE_CENTER_Y = 340;

export default class TugOfWarScene extends Phaser.Scene {
  private difficulty!: Difficulty;
  private ropePosition: number = 0; // negative = player winning, positive = AI winning
  private stamina: number = 100;
  private timeRemaining: number = 0;
  private isGameActive: boolean = false;
  private soundGenerator!: SoundGenerator;
  private musicGenerator!: MusicGenerator;

  // UI elements
  private ropeGraphics!: Phaser.GameObjects.Graphics;
  private markerDot!: Phaser.GameObjects.Arc;
  private staminaBar!: Phaser.GameObjects.Rectangle;
  private staminaBarBg!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private positionText!: Phaser.GameObjects.Text;
  private pullText!: Phaser.GameObjects.Text;
  private tapZone!: Phaser.GameObjects.Rectangle;

  // Rhythm tracking
  private lastTapTime: number = 0;
  private tapIntervals: number[] = [];
  private rhythmMultiplier: number = 1;
  private rhythmText!: Phaser.GameObjects.Text;

  // Team members
  private playerTeam: Phaser.GameObjects.Container[] = [];
  private aiTeam: Phaser.GameObjects.Container[] = [];

  // AI state
  private aiPullAccumulator: number = 0;

  private isPaused: boolean = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENES.TUG_OF_WAR });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.difficulty = (this.registry.get('difficulty') as Difficulty) || 'NORMAL';
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    this.timeRemaining = cfg.timeLimit;
    this.ropePosition = 0;
    this.stamina = 100;
    this.isGameActive = false;
    this.lastTapTime = 0;
    this.tapIntervals = [];
    this.rhythmMultiplier = 1;
    this.aiPullAccumulator = 0;
    this.playerTeam = [];
    this.aiTeam = [];

    this.soundGenerator = new SoundGenerator();
    this.musicGenerator = new MusicGenerator();
    this.cameras.main.fadeIn(500);

    const musicEnabled = this.registry.get('musicEnabled') ?? true;
    if (musicEnabled) this.musicGenerator.playTugMusic();

    // Background — arena with gradient ground and crowd silhouettes
    const bgGfx = this.add.graphics().setDepth(-2);
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const r = Math.floor(0x1a + t * 0x1a);
      const g = Math.floor(0x1a + t * 0x18);
      const b = Math.floor(0x10 + t * 0x10);
      bgGfx.fillStyle((r << 16) | (g << 8) | b, 1);
      bgGfx.fillRect(0, (i / 12) * height, width, height / 12 + 1);
    }

    // Crowd silhouettes along top edge
    bgGfx.fillStyle(0x111108, 0.6);
    for (let i = 0; i < 20; i++) {
      const cx = (width / 20) * i + width / 40;
      const cr = 8 + Math.random() * 6;
      bgGfx.fillCircle(cx, 20 + Math.random() * 10, cr);
      bgGfx.fillRect(cx - cr * 0.5, 20 + cr * 0.6, cr, cr * 1.2);
    }

    // Dramatic overhead light cone
    bgGfx.fillStyle(0xffee88, 0.04);
    bgGfx.fillTriangle(width / 2, 0, width / 2 - 120, height, width / 2 + 120, height);

    // Pit zone (center danger zone)
    this.add.rectangle(width / 2, ROPE_CENTER_Y + 50, 80, 8, COLORS.DANGER_RED, 0.5);
    this.add.text(width / 2, ROPE_CENTER_Y + 65, 'PIT', {
      fontSize: '11px', color: '#E63946',
    }).setOrigin(0.5);

    // Rope
    this.ropeGraphics = this.add.graphics().setDepth(5);

    // Position marker
    this.markerDot = this.add.arc(width / 2, ROPE_CENTER_Y - 10, 8, 0, 360, false, 0xffd700);
    this.markerDot.setStrokeStyle(2, 0xcc9900);
    this.markerDot.setDepth(10);

    // Win zones (visual indicators)
    this.add.rectangle(40, ROPE_CENTER_Y, 6, 40, COLORS.TRACKSUIT_GREEN, 0.6);
    this.add.text(40, ROPE_CENTER_Y + 30, 'WIN', {
      fontSize: '10px', color: '#4CAF50',
    }).setOrigin(0.5);

    this.add.rectangle(width - 40, ROPE_CENTER_Y, 6, 40, COLORS.DANGER_RED, 0.6);
    this.add.text(width - 40, ROPE_CENTER_Y + 30, 'LOSE', {
      fontSize: '10px', color: '#E63946',
    }).setOrigin(0.5);

    // Draw teams
    this.createTeams(width);

    // Stamina bar
    const barY = 90;
    this.staminaBarBg = this.add.rectangle(width / 2, barY, 200, 14, 0x333333);
    this.staminaBarBg.setStrokeStyle(1, 0x555555);
    this.staminaBar = this.add.rectangle(width / 2, barY, 200, 12, COLORS.TRACKSUIT_GREEN);

    this.add.text(width / 2, barY - 16, 'STAMINA', {
      fontSize: '11px', color: '#AAAAAA',
    }).setOrigin(0.5);

    // HUD
    this.timerText = this.add.text(width / 2, 20, `Time: ${this.timeRemaining}s`, {
      fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.positionText = this.add.text(width / 2, 48, 'EVEN', {
      fontSize: '14px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(100);

    this.rhythmText = this.add.text(width / 2, 115, '', {
      fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    // Difficulty
    this.add.text(20, 20, this.difficulty, {
      fontSize: '14px', color: '#8C8C8C',
    }).setDepth(100);

    // Tap zone (large interactive area)
    this.tapZone = this.add.rectangle(width / 2, height - 140, width - 40, 180, COLORS.TRACKSUIT_GREEN, 0.15);
    this.tapZone.setStrokeStyle(3, COLORS.TRACKSUIT_GREEN, 0.3);
    this.tapZone.setInteractive({ useHandCursor: true });

    this.pullText = this.add.text(width / 2, height - 140, 'TAP TO PULL!', {
      fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.7);

    // Input handlers
    this.tapZone.on('pointerdown', () => this.handleTap());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleTap());

    // Pause
    const pauseBtn = this.add.text(width - 20, 20, '⏸', { fontSize: '28px' }).setOrigin(0.5).setDepth(100);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.createPauseOverlay();

    // Countdown then start
    this.startCountdown();
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || !this.isGameActive) return;

    const cfg = DIFFICULTY_CONFIG[this.difficulty];

    // Timer
    this.timeRemaining -= delta / 1000;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.handleTimeUp();
      return;
    }
    this.timerText.setText(`Time: ${Math.ceil(this.timeRemaining)}s`);
    if (this.timeRemaining <= 5) this.timerText.setColor('#E63946');

    // AI pulls continuously
    this.aiPullAccumulator += delta;
    const aiPullInterval = 180; // AI "taps" every ~180ms
    while (this.aiPullAccumulator >= aiPullInterval) {
      this.aiPullAccumulator -= aiPullInterval;
      const aiPull = cfg.aiStrength * (0.8 + Math.random() * 0.4);
      this.ropePosition += aiPull;
    }

    // Stamina regeneration
    this.stamina = Math.min(100, this.stamina + cfg.staminaRegen * (delta / 1000));
    this.updateStaminaBar();

    // Decay rhythm multiplier
    const now = performance.now();
    if (now - this.lastTapTime > 800) {
      this.rhythmMultiplier = Math.max(1, this.rhythmMultiplier - delta * 0.002);
      if (this.rhythmMultiplier <= 1.05) this.rhythmText.setText('');
    }

    // Clamp position
    this.ropePosition = Phaser.Math.Clamp(this.ropePosition, -WIN_THRESHOLD, WIN_THRESHOLD);

    // Update visuals
    this.updateRopeVisuals();
    this.updatePositionText();
    this.updateTeamPositions();

    // Win/lose check
    if (this.ropePosition <= -WIN_THRESHOLD) {
      this.handleVictory();
    } else if (this.ropePosition >= WIN_THRESHOLD) {
      this.handleGameOver();
    }
  }

  // ─── Input ───────────────────────────────────────────

  private handleTap(): void {
    if (!this.isGameActive || this.isPaused) return;

    const now = performance.now();

    // Stamina cost
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    if (this.stamina <= 0) return;
    this.stamina = Math.max(0, this.stamina - cfg.staminaDrain);

    // Rhythm detection
    if (this.lastTapTime > 0) {
      const interval = now - this.lastTapTime;
      this.tapIntervals.push(interval);
      if (this.tapIntervals.length > 6) this.tapIntervals.shift();

      if (this.tapIntervals.length >= 3) {
        const avg = this.tapIntervals.reduce((a, b) => a + b, 0) / this.tapIntervals.length;
        const variance = this.tapIntervals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / this.tapIntervals.length;
        const stdDev = Math.sqrt(variance);
        const consistency = 1 - Math.min(1, stdDev / avg);

        if (consistency > 0.7) {
          this.rhythmMultiplier = Math.min(2.0, 1 + consistency * 0.8);
          this.rhythmText.setText(`RHYTHM x${this.rhythmMultiplier.toFixed(1)}`);
          this.rhythmText.setColor(this.rhythmMultiplier >= 1.5 ? '#FFD700' : '#AAAAAA');
        }
      }
    }
    this.lastTapTime = now;

    // Pull strength
    const basePull = 1.2;
    const staminaFactor = 0.5 + (this.stamina / 100) * 0.5;
    const pull = basePull * this.rhythmMultiplier * staminaFactor;
    this.ropePosition -= pull;

    // Visual feedback
    this.tweens.add({
      targets: this.pullText,
      scale: 1.15,
      duration: 60,
      yoyo: true,
    });

    this.tapZone.setFillStyle(COLORS.TRACKSUIT_GREEN, 0.3);
    this.time.delayedCall(80, () => {
      if (this.tapZone?.active) this.tapZone.setFillStyle(COLORS.TRACKSUIT_GREEN, 0.15);
    });

    this.soundGenerator.playRopeStrain(0.15);

    // Screen edge pulse on strong rhythm
    if (this.rhythmMultiplier > 1.3) {
      const { height: sh } = this.cameras.main;
      const edge = this.add.rectangle(0, sh / 2, 4, sh, COLORS.TRACKSUIT_GREEN, 0.4).setOrigin(0, 0.5).setDepth(50);
      this.tweens.add({ targets: edge, alpha: 0, duration: 200, onComplete: () => edge.destroy() });
    }
  }

  // ─── Visuals ─────────────────────────────────────────

  private createTeams(sceneWidth: number): void {
    const makeTeamMember = (x: number, y: number, color: number): Phaser.GameObjects.Container => {
      const c = this.add.container(x, y);
      const head = this.add.arc(0, -12, 6, 0, 360, false, color);
      head.setStrokeStyle(1, 0x333333);
      const body = this.add.rectangle(0, 2, 10, 16, color);
      body.setStrokeStyle(1, 0x333333);
      c.add([head, body]);
      c.setDepth(4);
      return c;
    };

    for (let i = 0; i < 5; i++) {
      const px = 30 + i * 22;
      this.playerTeam.push(makeTeamMember(px, ROPE_CENTER_Y + 10, COLORS.TRACKSUIT_GREEN));
    }

    for (let i = 0; i < 5; i++) {
      const ax = sceneWidth - 30 - i * 22;
      this.aiTeam.push(makeTeamMember(ax, ROPE_CENTER_Y + 10, COLORS.DANGER_RED));
    }
  }

  private updateTeamPositions(): void {
    const offset = (this.ropePosition / WIN_THRESHOLD) * 30;
    const leanAngle = (this.ropePosition / WIN_THRESHOLD) * 15;

    this.playerTeam.forEach((m, i) => {
      m.x = 30 + i * 22 - offset;
      m.angle = -leanAngle;
    });
    const w = this.cameras.main.width;
    this.aiTeam.forEach((m, i) => {
      m.x = w - 30 - i * 22 - offset;
      m.angle = leanAngle;
    });
  }

  private updateRopeVisuals(): void {
    const { width } = this.cameras.main;
    const g = this.ropeGraphics;
    g.clear();

    const offset = (this.ropePosition / WIN_THRESHOLD) * (width / 2 - 60);
    const jitter = this.isGameActive ? (Math.random() - 0.5) * 2 : 0;

    // Rope shadow
    g.lineStyle(8, 0x000000, 0.15);
    g.beginPath();
    g.moveTo(30 - offset * 0.3, ROPE_CENTER_Y + 3);
    g.lineTo(width - 30 - offset * 0.3, ROPE_CENTER_Y + 3);
    g.strokePath();

    // Main rope with fibrous texture
    g.lineStyle(7, 0x8b6914, 1);
    g.beginPath();
    g.moveTo(30 - offset * 0.3, ROPE_CENTER_Y + jitter);
    g.lineTo(width - 30 - offset * 0.3, ROPE_CENTER_Y + jitter);
    g.strokePath();

    // Highlight strand
    g.lineStyle(2, 0xb08f30, 0.5);
    g.beginPath();
    g.moveTo(30 - offset * 0.3, ROPE_CENTER_Y - 2 + jitter);
    g.lineTo(width - 30 - offset * 0.3, ROPE_CENTER_Y - 2 + jitter);
    g.strokePath();

    // Knot marks
    for (let i = 0; i < 5; i++) {
      const kx = 80 + i * 50 - offset * 0.3;
      g.fillStyle(0x6b4f10, 1);
      g.fillCircle(kx, ROPE_CENTER_Y + jitter, 5);
      g.lineStyle(1, 0x5a4010, 1);
      g.strokeCircle(kx, ROPE_CENTER_Y + jitter, 5);
    }

    this.markerDot.x = width / 2 + offset;
  }

  private updateStaminaBar(): void {
    const fill = this.stamina / 100;
    this.staminaBar.width = 200 * fill;
    this.staminaBar.x = this.cameras.main.width / 2 - (200 * (1 - fill)) / 2;

    if (this.stamina < 20) {
      this.staminaBar.setFillStyle(COLORS.DANGER_RED);
    } else if (this.stamina < 50) {
      this.staminaBar.setFillStyle(0xff9800);
    } else {
      this.staminaBar.setFillStyle(COLORS.TRACKSUIT_GREEN);
    }
  }

  private updatePositionText(): void {
    const pct = this.ropePosition / WIN_THRESHOLD;
    if (pct < -0.1) {
      this.positionText.setText('PULLING AHEAD!');
      this.positionText.setColor('#4CAF50');
    } else if (pct > 0.1) {
      this.positionText.setText('LOSING GROUND!');
      this.positionText.setColor('#E63946');
    } else {
      this.positionText.setText('EVEN');
      this.positionText.setColor('#FFD700');
    }
  }

  // ─── Game Flow ───────────────────────────────────────

  private startCountdown(): void {
    const { width, height } = this.cameras.main;
    const countText = this.add.text(width / 2, height / 2, '3', {
      fontSize: '64px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    let count = 3;
    const timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (count > 1) {
          count--;
          countText.setText(`${count}`);
          this.soundGenerator.playCountdown();
        } else {
          countText.setText('PULL!');
          this.soundGenerator.playCountdown(0.5);
          timer.remove();
          this.time.delayedCall(500, () => {
            countText.destroy();
            this.isGameActive = true;
          });
        }
      },
      repeat: 2,
    });
    this.soundGenerator.playCountdown();
    this.soundGenerator.playGameStart();
  }

  private handleVictory(): void {
    this.isGameActive = false;

    const baseScore = 1000;
    const timeBonus = Math.floor(this.timeRemaining * 20);
    const marginBonus = Math.floor(Math.abs(this.ropePosition) * 3);
    const multiplier = SCORE_MULTIPLIER[this.difficulty];
    const finalScore = Math.floor((baseScore + timeBonus + marginBonus) * multiplier);

    this.registry.set('currentScore', finalScore);
    this.registry.set('currentDifficulty', this.difficulty);
    this.registry.set('isPerfectRun', this.stamina > 30);
    this.registry.set('scoreBreakdown', {
      baseScore,
      timeBonus,
      perfectBonus: marginBonus,
      subtotal: baseScore + timeBonus + marginBonus,
      difficultyMultiplier: multiplier,
      finalScore,
    });

    this.soundGenerator.playVictory();
    this.soundGenerator.playCrowdCheer();

    // Team celebration — members jump
    this.playerTeam.forEach((m, i) => {
      this.tweens.add({
        targets: m,
        y: m.y - 20,
        duration: 250,
        yoyo: true,
        repeat: 2,
        delay: i * 80,
        ease: 'Quad.easeOut',
      });
    });

    const { width } = this.cameras.main;
    this.add.text(width / 2, ROPE_CENTER_Y - 60, 'YOU WIN!', {
      fontSize: '40px', color: '#4CAF50', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.VICTORY);
      });
    });
  }

  private handleGameOver(): void {
    this.isGameActive = false;

    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    this.registry.set('gameOverData', {
      reason: 'eliminated' as const,
      difficulty: this.difficulty,
      progressPercent: Math.max(0, Math.floor(50 - (this.ropePosition / WIN_THRESHOLD) * 50)),
      timeSurvived: Math.floor(cfg.timeLimit - this.timeRemaining),
      timeLimit: cfg.timeLimit,
    });

    this.soundGenerator.playEliminationDramatic();
    this.cameras.main.shake(500, 0.02);

    const { width } = this.cameras.main;
    this.add.text(width / 2, ROPE_CENTER_Y - 60, 'ELIMINATED', {
      fontSize: '36px', color: '#E63946', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.GAME_OVER);
      });
    });
  }

  private handleTimeUp(): void {
    // If time runs out, whoever is winning wins
    if (this.ropePosition <= 0) {
      this.handleVictory();
    } else {
      this.handleGameOver();
    }
  }

  // ─── Pause ───────────────────────────────────────────

  private createPauseOverlay(): void {
    const { width, height } = this.cameras.main;
    this.pauseOverlay = this.add.container(0, 0).setDepth(300).setVisible(false);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    bg.setInteractive();
    this.pauseOverlay.add(bg);

    this.pauseOverlay.add(
      this.add.text(width / 2, height / 2 - 80, 'PAUSED', { fontSize: '48px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5)
    );

    const mkBtn = (y: number, label: string, cb: () => void) => {
      const b = this.add.text(width / 2, y, label, {
        fontSize: '20px', color: '#FFFFFF', backgroundColor: '#FF4581',
        padding: { x: 24, y: 12 }, fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      b.on('pointerover', () => b.setScale(1.08));
      b.on('pointerout', () => b.setScale(1));
      b.on('pointerdown', cb);
      this.pauseOverlay.add(b);
    };

    mkBtn(height / 2, 'RESUME', () => this.togglePause());
    mkBtn(height / 2 + 60, 'QUIT TO MENU', () => {
      this.isPaused = false;
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.MENU));
    });
  }

  private togglePause(): void {
    if (!this.isGameActive && !this.isPaused) return;
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);
  }

  shutdown(): void {
    this.isPaused = false;
    this.musicGenerator?.stopMusic();
    this.input.keyboard?.off('keydown-SPACE');
    this.input.keyboard?.off('keydown-ESC');
  }
}
