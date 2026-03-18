/**
 * HoneycombScene
 * Trace a stamped shape on a honeycomb candy with a needle.
 * Moving too fast, straying off the line, or running out of time cracks the candy.
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import type { Difficulty } from '@/types/game.types';
import SoundGenerator from '../utils/SoundGenerator';
import MusicGenerator from '../utils/MusicGenerator';
import ParticleManager from '../managers/ParticleManager';

interface PathPoint { x: number; y: number }

interface DifficultyParams {
  timeLimit: number;
  tolerance: number;     // max distance from path before pressure spikes
  pressureRate: number;  // pressure gain per frame when off-path or too fast
  pressureDecay: number; // pressure lost per second when on-path
  shape: string;
}

const DIFF_CONFIG: Record<string, DifficultyParams> = {
  EASY:   { timeLimit: 60, tolerance: 22, pressureRate: 0.15, pressureDecay: 12, shape: 'circle' },
  NORMAL: { timeLimit: 45, tolerance: 14, pressureRate: 0.30, pressureDecay: 8,  shape: 'triangle' },
  HARD:   { timeLimit: 30, tolerance: 8,  pressureRate: 0.55, pressureDecay: 4,  shape: 'umbrella' },
};

const SCORE_MULT: Record<string, number> = { EASY: 1.0, NORMAL: 1.5, HARD: 2.0 };
const MAX_PRESSURE = 100;
const COOKIE_RADIUS = 120;

export default class HoneycombScene extends Phaser.Scene {
  private difficulty!: Difficulty;
  private cfg!: DifficultyParams;

  private shapePath: PathPoint[] = [];
  private nextPointIndex: number = 0;
  private traceGraphics!: Phaser.GameObjects.Graphics;
  private crackGraphics!: Phaser.GameObjects.Graphics;
  private needleDot!: Phaser.GameObjects.Arc;

  private pressure: number = 0;
  private timeRemaining: number = 0;
  private isGameActive: boolean = false;
  private isTracing: boolean = false;
  private totalDeviation: number = 0;
  private deviationSamples: number = 0;
  private lastPointer: PathPoint | null = null;

  private timerText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private pressureBar!: Phaser.GameObjects.Rectangle;

  private soundGenerator!: SoundGenerator;
  private musicGenerator!: MusicGenerator;
  private particleManager!: ParticleManager;

  private isPaused: boolean = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  private cookieCenterX: number = 0;
  private cookieCenterY: number = 0;

  constructor() {
    super({ key: SCENES.HONEYCOMB });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.difficulty = (this.registry.get('difficulty') as Difficulty) || 'NORMAL';
    this.cfg = DIFF_CONFIG[this.difficulty];
    this.timeRemaining = this.cfg.timeLimit;
    this.pressure = 0;
    this.nextPointIndex = 0;
    this.isGameActive = false;
    this.isTracing = false;
    this.totalDeviation = 0;
    this.deviationSamples = 0;
    this.lastPointer = null;

    this.soundGenerator = new SoundGenerator();
    this.musicGenerator = new MusicGenerator();
    this.particleManager = new ParticleManager(this);
    this.cameras.main.fadeIn(500);

    const musicEnabled = this.registry.get('musicEnabled') ?? true;
    if (musicEnabled) this.musicGenerator.playHoneycombMusic();

    this.cookieCenterX = width / 2;
    this.cookieCenterY = height / 2 - 20;

    // Wooden table with warm ambient gradient and wood-grain lines
    const bgGfx = this.add.graphics().setDepth(-2);
    for (let i = 0; i < 15; i++) {
      const t = i / 15;
      const r = Math.floor(0x30 + t * 0x14);
      const g = Math.floor(0x22 + t * 0x0c);
      const b = Math.floor(0x14 + t * 0x08);
      bgGfx.fillStyle((r << 16) | (g << 8) | b, 1);
      bgGfx.fillRect(0, (i / 15) * height, width, height / 15 + 1);
    }

    // Wood grain
    bgGfx.lineStyle(1, 0x4a3520, 0.15);
    for (let i = 0; i < 12; i++) {
      const gy = Phaser.Math.Between(10, height - 10);
      const wobble = Phaser.Math.Between(-10, 10);
      bgGfx.beginPath();
      bgGfx.moveTo(0, gy);
      bgGfx.lineTo(width * 0.3, gy + wobble);
      bgGfx.lineTo(width * 0.7, gy - wobble);
      bgGfx.lineTo(width, gy + Phaser.Math.Between(-8, 8));
      bgGfx.strokePath();
    }

    // Vignette effect (dark corners)
    bgGfx.fillStyle(0x000000, 0.2);
    bgGfx.fillRect(0, 0, width, 30);
    bgGfx.fillRect(0, height - 30, width, 30);
    bgGfx.fillStyle(0x000000, 0.1);
    bgGfx.fillRect(0, 0, 20, height);
    bgGfx.fillRect(width - 20, 0, 20, height);

    // Cookie
    this.drawCookie();

    // Generate shape path
    this.shapePath = this.generateShapePath(this.cfg.shape);

    // Draw shape outline on cookie
    this.drawShapeOutline();

    // Trace overlay (what the player has traced so far)
    this.traceGraphics = this.add.graphics().setDepth(6);

    // Crack overlay
    this.crackGraphics = this.add.graphics().setDepth(7);

    // Needle
    this.needleDot = this.add.arc(0, 0, 5, 0, 360, false, 0xcccccc);
    this.needleDot.setStrokeStyle(2, 0x888888);
    this.needleDot.setDepth(10);
    this.needleDot.setVisible(false);

    // HUD
    this.timerText = this.add.text(width / 2, 22, `Time: ${this.cfg.timeLimit}s`, {
      fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.add.text(20, 22, this.difficulty, {
      fontSize: '14px', color: '#CCAA77',
    }).setDepth(100);

    // Progress bar
    const barY = height - 65;
    this.add.text(width / 2, barY - 16, 'PROGRESS', { fontSize: '11px', color: '#AAAAAA' }).setOrigin(0.5);
    this.add.rectangle(width / 2, barY, 220, 12, 0x333333).setStrokeStyle(1, 0x555555);
    this.progressBar = this.add.rectangle(width / 2 - 110, barY, 0, 10, COLORS.TRACKSUIT_GREEN);
    this.progressBar.setOrigin(0, 0.5);

    // Pressure bar
    const pBarY = height - 35;
    this.add.text(width / 2, pBarY - 16, 'PRESSURE', { fontSize: '11px', color: '#AAAAAA' }).setOrigin(0.5);
    this.add.rectangle(width / 2, pBarY, 220, 12, 0x333333).setStrokeStyle(1, 0x555555);
    this.pressureBar = this.add.rectangle(width / 2 - 110, pBarY, 0, 10, 0xff9800);
    this.pressureBar.setOrigin(0, 0.5);

    // Instructions
    this.add.text(width / 2, height - 10, 'Drag along the shape outline', {
      fontSize: '12px', color: '#887755',
    }).setOrigin(0.5);

    // Pause
    const pauseBtn = this.add.text(width - 20, 22, '⏸', { fontSize: '28px' }).setOrigin(0.5).setDepth(100);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.createPauseOverlay();

    // Pointer input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerup', () => this.onPointerUp());

    // Countdown
    this.startCountdown();
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || !this.isGameActive) return;

    // Timer
    this.timeRemaining -= delta / 1000;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.handleTimeUp();
      return;
    }
    this.timerText.setText(`Time: ${Math.ceil(this.timeRemaining)}s`);
    if (this.timeRemaining <= 10) this.timerText.setColor('#E63946');

    // Pressure decay when not tracing
    if (!this.isTracing && this.pressure > 0) {
      this.pressure = Math.max(0, this.pressure - this.cfg.pressureDecay * (delta / 1000));
    }

    // Pressure check
    if (this.pressure >= MAX_PRESSURE) {
      this.handleCrack();
      return;
    }

    this.updatePressureBar();
    this.updateCrackOverlay();
  }

  // ─── Shape Generation ────────────────────────────────

  private generateShapePath(shape: string): PathPoint[] {
    const cx = this.cookieCenterX;
    const cy = this.cookieCenterY;
    const r = COOKIE_RADIUS * 0.65;
    const points: PathPoint[] = [];

    switch (shape) {
      case 'circle': {
        const segments = 48;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
          points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        break;
      }
      case 'triangle': {
        const verts = [];
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
          verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        const segsPerSide = 20;
        for (let s = 0; s < 3; s++) {
          const from = verts[s];
          const to = verts[(s + 1) % 3];
          for (let j = 0; j <= segsPerSide; j++) {
            const t = j / segsPerSide;
            points.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
          }
        }
        break;
      }
      case 'umbrella': {
        // Semi-circle top
        const topSegs = 30;
        for (let i = 0; i <= topSegs; i++) {
          const angle = Math.PI + (i / topSegs) * Math.PI;
          points.push({ x: cx + Math.cos(angle) * r, y: cy - 10 + Math.sin(angle) * r * 0.7 });
        }
        // Scalloped bottom edge of canopy
        const scallops = 5;
        const scW = (r * 2) / scallops;
        for (let s = 0; s < scallops; s++) {
          const sx = cx - r + s * scW;
          for (let j = 0; j <= 8; j++) {
            const t = j / 8;
            const angle = Math.PI * t;
            points.push({
              x: sx + scW / 2 + Math.cos(Math.PI + angle) * (scW / 2),
              y: cy - 10 + Math.sin(Math.PI + angle) * 12,
            });
          }
        }
        // Handle (straight down)
        const handleTop = cy - 10;
        const handleBottom = cy + r * 0.8;
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          points.push({ x: cx, y: handleTop + (handleBottom - handleTop) * t });
        }
        // Hook at bottom
        for (let i = 0; i <= 8; i++) {
          const angle = -Math.PI / 2 + (i / 8) * Math.PI;
          points.push({ x: cx + 12 + Math.cos(angle) * 12, y: handleBottom + Math.sin(angle) * 12 });
        }
        break;
      }
    }

    return points;
  }

  // ─── Drawing ─────────────────────────────────────────

  private drawCookie(): void {
    const g = this.add.graphics().setDepth(1);
    // Shadow
    g.fillStyle(0x1a1008, 0.4);
    g.fillCircle(this.cookieCenterX + 4, this.cookieCenterY + 4, COOKIE_RADIUS + 2);
    // Cookie body
    g.fillStyle(0xd4a030, 1);
    g.fillCircle(this.cookieCenterX, this.cookieCenterY, COOKIE_RADIUS);
    // Slightly lighter inner circle for baked look
    g.fillStyle(0xe0b040, 0.5);
    g.fillCircle(this.cookieCenterX, this.cookieCenterY, COOKIE_RADIUS - 8);
    // Edge bevel
    g.lineStyle(3, 0xb08020, 0.6);
    g.strokeCircle(this.cookieCenterX, this.cookieCenterY, COOKIE_RADIUS);
    // Sugar texture dots
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (COOKIE_RADIUS - 15);
      g.fillStyle(0xc89828, 0.3);
      g.fillCircle(
        this.cookieCenterX + Math.cos(angle) * dist,
        this.cookieCenterY + Math.sin(angle) * dist,
        Phaser.Math.Between(1, 3)
      );
    }
  }

  private drawShapeOutline(): void {
    if (this.shapePath.length < 2) return;

    const g = this.add.graphics().setDepth(3);

    // Stamped impression (slightly indented look)
    g.lineStyle(3, 0x9a7818, 0.5);
    g.beginPath();
    g.moveTo(this.shapePath[0].x, this.shapePath[0].y);
    for (let i = 1; i < this.shapePath.length; i++) {
      g.lineTo(this.shapePath[i].x, this.shapePath[i].y);
    }
    g.strokePath();

    // Thin visible guide line
    g.lineStyle(1.5, 0x705010, 0.8);
    g.beginPath();
    g.moveTo(this.shapePath[0].x, this.shapePath[0].y);
    for (let i = 1; i < this.shapePath.length; i++) {
      g.lineTo(this.shapePath[i].x, this.shapePath[i].y);
    }
    g.strokePath();

    // Start marker
    const sp = this.shapePath[0];
    this.add.arc(sp.x, sp.y, 6, 0, 360, false, 0x44ee88, 0.7).setDepth(5);
    this.add.text(sp.x, sp.y - 16, 'START', {
      fontSize: '10px', color: '#44EE88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
  }

  // ─── Input ───────────────────────────────────────────

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!this.isGameActive || this.isPaused) return;

    const target = this.shapePath[this.nextPointIndex];
    const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
    if (dist <= this.cfg.tolerance * 2) {
      this.isTracing = true;
      this.needleDot.setVisible(true);
      this.needleDot.setPosition(p.x, p.y);
      this.lastPointer = { x: p.x, y: p.y };
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (!this.isGameActive || !this.isTracing || this.isPaused) return;

    this.needleDot.setPosition(p.x, p.y);

    if (this.lastPointer) {
      const moveDist = Phaser.Math.Distance.Between(p.x, p.y, this.lastPointer.x, this.lastPointer.y);
      if (moveDist > 30) {
        this.pressure += this.cfg.pressureRate * 2;
        // Needle wobble on fast movement
        this.tweens.add({
          targets: this.needleDot,
          scale: 1.4,
          duration: 40,
          yoyo: true,
        });
      }
    }
    this.lastPointer = { x: p.x, y: p.y };

    // Advance through path points that the pointer is near
    while (this.nextPointIndex < this.shapePath.length) {
      const target = this.shapePath[this.nextPointIndex];
      const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);

      this.totalDeviation += dist;
      this.deviationSamples++;

      if (dist > this.cfg.tolerance) {
        this.pressure += this.cfg.pressureRate;
        break;
      }

      if (this.nextPointIndex > 0) {
        const prev = this.shapePath[this.nextPointIndex - 1];

        // Main trace line
        this.traceGraphics.lineStyle(3, 0x44ee88, 0.9);
        this.traceGraphics.beginPath();
        this.traceGraphics.moveTo(prev.x, prev.y);
        this.traceGraphics.lineTo(target.x, target.y);
        this.traceGraphics.strokePath();

        // Glow behind recent segment
        const glowDot = this.add.arc(target.x, target.y, 6, 0, 360, false, 0x44ee88, 0.4).setDepth(5);
        this.tweens.add({
          targets: glowDot,
          alpha: 0, scale: 2,
          duration: 300,
          onComplete: () => glowDot.destroy(),
        });
      }

      this.nextPointIndex++;
      this.soundGenerator.playNeedleScratch();
      this.updateProgressBar();

      if (this.nextPointIndex >= this.shapePath.length) {
        this.handleVictory();
        return;
      }
    }
  }

  private onPointerUp(): void {
    this.isTracing = false;
  }

  // ─── UI Updates ──────────────────────────────────────

  private updateProgressBar(): void {
    const progress = this.nextPointIndex / this.shapePath.length;
    this.progressBar.width = 220 * progress;
  }

  private updatePressureBar(): void {
    const pct = this.pressure / MAX_PRESSURE;
    this.pressureBar.width = 220 * pct;

    if (pct > 0.7) {
      this.pressureBar.setFillStyle(COLORS.DANGER_RED);
    } else if (pct > 0.4) {
      this.pressureBar.setFillStyle(0xff9800);
    } else {
      this.pressureBar.setFillStyle(0xffcc00);
    }
  }

  private updateCrackOverlay(): void {
    this.crackGraphics.clear();
    if (this.pressure < 25) return;

    const intensity = (this.pressure - 25) / 75;
    const numCracks = Math.floor(intensity * 8);

    // Cookie shake at high pressure
    if (this.pressure > 60) {
      const shake = (this.pressure - 60) / 40;
      this.crackGraphics.x = (Math.random() - 0.5) * shake * 4;
      this.crackGraphics.y = (Math.random() - 0.5) * shake * 4;
    } else {
      this.crackGraphics.x = 0;
      this.crackGraphics.y = 0;
    }

    // Branching crack lines
    for (let i = 0; i < numCracks; i++) {
      const baseAngle = (i / numCracks) * Math.PI * 2 + i * 0.5;
      const len = 15 + intensity * 50;
      let sx = this.cookieCenterX + Math.cos(baseAngle) * 15;
      let sy = this.cookieCenterY + Math.sin(baseAngle) * 15;

      this.crackGraphics.lineStyle(1 + intensity, 0x705010, 0.5 + intensity * 0.5);
      this.crackGraphics.beginPath();
      this.crackGraphics.moveTo(sx, sy);

      const segments = 3 + Math.floor(intensity * 3);
      for (let s = 0; s < segments; s++) {
        const segLen = len / segments;
        const wobble = (Math.random() - 0.5) * 12;
        sx += Math.cos(baseAngle + wobble * 0.1) * segLen;
        sy += Math.sin(baseAngle + wobble * 0.1) * segLen;
        this.crackGraphics.lineTo(sx + wobble, sy + wobble);
      }
      this.crackGraphics.strokePath();
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
          countText.setText('TRACE!');
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

    const avgDev = this.deviationSamples > 0 ? this.totalDeviation / this.deviationSamples : 0;
    const accuracyBonus = Math.max(0, Math.floor((this.cfg.tolerance - avgDev) * 30));
    const baseScore = 1000;
    const timeBonus = Math.floor(this.timeRemaining * 12);
    const multiplier = SCORE_MULT[this.difficulty];
    const finalScore = Math.floor((baseScore + timeBonus + accuracyBonus) * multiplier);

    this.registry.set('currentScore', finalScore);
    this.registry.set('currentDifficulty', this.difficulty);
    this.registry.set('isPerfectRun', this.pressure < 20);
    this.registry.set('scoreBreakdown', {
      baseScore,
      timeBonus,
      perfectBonus: accuracyBonus,
      subtotal: baseScore + timeBonus + accuracyBonus,
      difficultyMultiplier: multiplier,
      finalScore,
    });

    this.soundGenerator.playVictory();
    this.particleManager.createConfetti(this.cookieCenterX, this.cookieCenterY);

    // Golden glow radiating from shape
    const glow = this.add.arc(this.cookieCenterX, this.cookieCenterY, 30, 0, 360, false, 0xffd700, 0.5).setDepth(15);
    this.tweens.add({
      targets: glow,
      radius: COOKIE_RADIUS * 1.5,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => glow.destroy(),
    });

    const { width } = this.cameras.main;
    this.add.text(width / 2, this.cookieCenterY - COOKIE_RADIUS - 30, 'COMPLETE!', {
      fontSize: '36px', color: '#44EE88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.VICTORY));
    });
  }

  private handleCrack(): void {
    this.isGameActive = false;

    this.cameras.main.shake(500, 0.02);
    this.soundGenerator.playCookieCrack();

    // Shatter cookie into segments that fly apart
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const nextAngle = ((i + 1) / 10) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;

      const seg = this.add.graphics().setDepth(20);
      seg.fillStyle(0xd4a030, 0.8);
      seg.beginPath();
      seg.moveTo(this.cookieCenterX, this.cookieCenterY);
      seg.lineTo(
        this.cookieCenterX + Math.cos(angle) * COOKIE_RADIUS,
        this.cookieCenterY + Math.sin(angle) * COOKIE_RADIUS
      );
      seg.lineTo(
        this.cookieCenterX + Math.cos(nextAngle) * COOKIE_RADIUS,
        this.cookieCenterY + Math.sin(nextAngle) * COOKIE_RADIUS
      );
      seg.closePath();
      seg.fillPath();
      seg.lineStyle(1, 0x705010, 0.8);
      seg.strokePath();

      this.tweens.add({
        targets: seg,
        x: Math.cos(midAngle) * Phaser.Math.Between(30, 80),
        y: Math.sin(midAngle) * Phaser.Math.Between(30, 80),
        angle: Phaser.Math.Between(-90, 90),
        alpha: 0,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => seg.destroy(),
      });
    }

    const { width } = this.cameras.main;
    this.add.text(width / 2, this.cookieCenterY, 'CRACKED!', {
      fontSize: '40px', color: '#E63946', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.setGameOverData('eliminated');

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.GAME_OVER));
    });
  }

  private handleTimeUp(): void {
    this.isGameActive = false;

    const { width } = this.cameras.main;
    this.add.text(width / 2, this.cookieCenterY, "TIME'S UP!", {
      fontSize: '36px', color: '#E63946', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.setGameOverData('timeout');

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.GAME_OVER));
    });
  }

  private setGameOverData(reason: 'eliminated' | 'timeout'): void {
    const progress = Math.floor((this.nextPointIndex / this.shapePath.length) * 100);
    this.registry.set('gameOverData', {
      reason,
      difficulty: this.difficulty,
      progressPercent: progress,
      timeSurvived: Math.floor(this.cfg.timeLimit - this.timeRemaining),
      timeLimit: this.cfg.timeLimit,
    });
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
    if (this.isPaused) {
      this.isTracing = false;
    }
  }

  shutdown(): void {
    this.isPaused = false;
    this.musicGenerator?.stopMusic();
    this.input.keyboard?.off('keydown-ESC');
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
  }
}
