/**
 * GlassBridgeScene
 * Players must cross a bridge by choosing the correct glass panel (left or right)
 * at each step. Tempered glass holds; regular glass shatters.
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import type { Difficulty } from '@/types/game.types';
import SoundGenerator from '../utils/SoundGenerator';
import ParticleManager from '../managers/ParticleManager';

interface PanelPair {
  safeIndex: 0 | 1; // 0 = left is safe, 1 = right is safe
  leftRect: Phaser.GameObjects.Rectangle;
  rightRect: Phaser.GameObjects.Rectangle;
  leftBorder: Phaser.GameObjects.Rectangle;
  rightBorder: Phaser.GameObjects.Rectangle;
  revealed: boolean;
}

interface NpcRunner {
  dot: Phaser.GameObjects.Arc;
  row: number;
  alive: boolean;
  speed: number;
  nextMoveTime: number;
}

const DIFFICULTY_CONFIG = {
  EASY: { rows: 8, timeLimit: 60, npcCount: 3, npcHintChance: 0.7 },
  NORMAL: { rows: 12, timeLimit: 50, npcCount: 2, npcHintChance: 0.55 },
  HARD: { rows: 16, timeLimit: 40, npcCount: 1, npcHintChance: 0.5 },
} as const;

const SCORE_MULTIPLIER = { EASY: 1.0, NORMAL: 1.5, HARD: 2.0 } as const;

export default class GlassBridgeScene extends Phaser.Scene {
  private difficulty!: Difficulty;
  private panels: PanelPair[] = [];
  private currentRow: number = -1;
  private playerDot!: Phaser.GameObjects.Arc;
  private timeRemaining: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private rowLabel!: Phaser.GameObjects.Text;
  private isGameActive: boolean = false;
  private soundGenerator!: SoundGenerator;
  private particleManager!: ParticleManager;
  private npcRunners: NpcRunner[] = [];
  private streak: number = 0;
  private panelWidth: number = 0;
  private panelHeight: number = 0;
  private bridgeTop: number = 0;
  private bridgeLeft: number = 0;
  private gap: number = 0;
  private rowHeight: number = 0;
  private isPaused: boolean = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENES.GLASS_BRIDGE });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.difficulty = (this.registry.get('difficulty') as Difficulty) || 'NORMAL';
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    this.timeRemaining = cfg.timeLimit;
    this.streak = 0;
    this.currentRow = -1;
    this.isGameActive = false;
    this.panels = [];
    this.npcRunners = [];

    this.soundGenerator = new SoundGenerator();
    this.particleManager = new ParticleManager(this);

    this.cameras.main.fadeIn(500);

    // Background — dark atmosphere
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a2e);

    // Layout
    this.gap = 14;
    this.panelWidth = (width - 60 - this.gap) / 2;
    this.panelHeight = Math.min(36, (height - 180) / cfg.rows - 4);
    this.rowHeight = this.panelHeight + 4;
    const totalBridgeHeight = cfg.rows * this.rowHeight;
    this.bridgeTop = (height - totalBridgeHeight) / 2 + 10;
    this.bridgeLeft = 30;

    // Side rails
    const railColor = 0x444488;
    this.add.rectangle(this.bridgeLeft - 4, height / 2, 4, totalBridgeHeight + 20, railColor);
    this.add.rectangle(width - this.bridgeLeft + 4, height / 2, 4, totalBridgeHeight + 20, railColor);

    // Build panels (bottom = row 0, top = last row = finish)
    for (let i = 0; i < cfg.rows; i++) {
      const safeIndex = Math.random() < 0.5 ? 0 : 1 as 0 | 1;
      const y = this.bridgeTop + (cfg.rows - 1 - i) * this.rowHeight + this.panelHeight / 2;

      const leftX = this.bridgeLeft + this.panelWidth / 2;
      const rightX = this.bridgeLeft + this.panelWidth + this.gap + this.panelWidth / 2;

      const leftRect = this.add.rectangle(leftX, y, this.panelWidth, this.panelHeight, 0x88ccff, 0.35);
      const rightRect = this.add.rectangle(rightX, y, this.panelWidth, this.panelHeight, 0x88ccff, 0.35);
      const leftBorder = this.add.rectangle(leftX, y, this.panelWidth, this.panelHeight).setStrokeStyle(2, 0x6699cc, 0.6);
      leftBorder.isFilled = false;
      const rightBorder = this.add.rectangle(rightX, y, this.panelWidth, this.panelHeight).setStrokeStyle(2, 0x6699cc, 0.6);
      rightBorder.isFilled = false;

      this.panels.push({ safeIndex, leftRect, rightRect, leftBorder, rightBorder, revealed: false });
    }

    // Player dot (starts below the bridge)
    const startY = this.bridgeTop + cfg.rows * this.rowHeight + 20;
    this.playerDot = this.add.arc(width / 2, startY, 10, 0, 360, false, COLORS.TRACKSUIT_GREEN);
    this.playerDot.setStrokeStyle(2, 0x005a42);
    this.playerDot.setDepth(10);

    // HUD
    this.timerText = this.add.text(width / 2, 20, `Time: ${this.timeRemaining}s`, {
      fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.rowLabel = this.add.text(width / 2, 48, `Step 0 / ${cfg.rows}`, {
      fontSize: '14px', color: '#AAAAEE',
    }).setOrigin(0.5).setDepth(100);

    this.add.text(width / 2, height - 20, 'Tap LEFT or RIGHT panel to step', {
      fontSize: '13px', color: '#8888CC',
    }).setOrigin(0.5);

    // Difficulty label
    this.add.text(20, 20, this.difficulty, {
      fontSize: '14px', color: '#8888CC',
    }).setDepth(100);

    // Pause
    const pauseBtn = this.add.text(width - 20, 20, '⏸', { fontSize: '28px' }).setOrigin(0.5).setDepth(100);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.createPauseOverlay();

    // NPC runners
    this.createNpcRunners(cfg.npcCount, cfg.rows);

    // Countdown then start
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

    // NPC AI
    this.updateNpcs(delta);
  }

  // ─── NPC AI ──────────────────────────────────────────

  private createNpcRunners(count: number, totalRows: number): void {
    for (let i = 0; i < count; i++) {
      const startY = this.bridgeTop + totalRows * this.rowHeight + 20;
      const offsetX = Phaser.Math.Between(-40, 40);
      const dot = this.add.arc(this.cameras.main.width / 2 + offsetX, startY, 7, 0, 360, false, 0xaaaaaa);
      dot.setStrokeStyle(1, 0x666666);
      dot.setDepth(8);
      this.npcRunners.push({
        dot,
        row: -1,
        alive: true,
        speed: Phaser.Math.Between(1500, 3000),
        nextMoveTime: Phaser.Math.Between(800, 2000),
      });
    }
  }

  private updateNpcs(delta: number): void {
    const cfg = DIFFICULTY_CONFIG[this.difficulty];

    this.npcRunners.forEach((npc) => {
      if (!npc.alive) return;
      npc.nextMoveTime -= delta;
      if (npc.nextMoveTime > 0) return;

      npc.nextMoveTime = npc.speed;
      const nextRow = npc.row + 1;
      if (nextRow >= cfg.rows) {
        npc.alive = false;
        npc.dot.setVisible(false);
        return;
      }

      const panel = this.panels[nextRow];
      const choosesCorrect = Math.random() < cfg.npcHintChance;
      const chosenSide = choosesCorrect ? panel.safeIndex : (1 - panel.safeIndex) as 0 | 1;

      npc.row = nextRow;
      const targetY = panel.leftRect.y;
      const targetX = chosenSide === 0 ? panel.leftRect.x : panel.rightRect.x;

      if (!choosesCorrect) {
        // NPC falls
        this.tweens.add({
          targets: npc.dot,
          x: targetX, y: targetY,
          duration: 300,
          onComplete: () => {
            npc.alive = false;
            this.shatterPanel(nextRow, chosenSide);
            this.tweens.add({
              targets: npc.dot,
              y: npc.dot.y + 200, alpha: 0,
              duration: 600,
              onComplete: () => npc.dot.destroy(),
            });
          },
        });
      } else {
        this.tweens.add({
          targets: npc.dot,
          x: targetX, y: targetY,
          duration: 300,
        });
      }
    });
  }

  // ─── Player Input ────────────────────────────────────

  private enableRowInput(row: number): void {
    const pair = this.panels[row];

    const handleChoice = (side: 0 | 1) => {
      if (!this.isGameActive) return;
      pair.leftRect.disableInteractive();
      pair.rightRect.disableInteractive();
      this.stepOnPanel(row, side);
    };

    pair.leftRect.setInteractive({ useHandCursor: true });
    pair.rightRect.setInteractive({ useHandCursor: true });

    // Hover highlight
    [pair.leftRect, pair.rightRect].forEach((rect) => {
      rect.on('pointerover', () => { if (this.isGameActive) rect.setFillStyle(0x88ccff, 0.6); });
      rect.on('pointerout', () => { if (this.isGameActive) rect.setFillStyle(0x88ccff, 0.35); });
    });

    pair.leftRect.on('pointerdown', () => handleChoice(0));
    pair.rightRect.on('pointerdown', () => handleChoice(1));

    // Keyboard: left/right arrows
    const onKey = (e: KeyboardEvent) => {
      if (!this.isGameActive || pair.revealed) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { handleChoice(0); this.input.keyboard?.off('keydown', onKey); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { handleChoice(1); this.input.keyboard?.off('keydown', onKey); }
    };
    this.input.keyboard?.on('keydown', onKey);
  }

  private stepOnPanel(row: number, side: 0 | 1): void {
    const pair = this.panels[row];
    const cfg = DIFFICULTY_CONFIG[this.difficulty];
    const rect = side === 0 ? pair.leftRect : pair.rightRect;

    // Move player dot
    this.tweens.add({
      targets: this.playerDot,
      x: rect.x,
      y: rect.y,
      duration: 250,
      ease: 'Quad.easeOut',
    });

    if (side === pair.safeIndex) {
      // Correct — tempered glass
      pair.revealed = true;
      this.streak++;
      this.currentRow = row;
      this.soundGenerator.playFootstep(0.4);
      rect.setFillStyle(0x44ee88, 0.6);
      (side === 0 ? pair.leftBorder : pair.rightBorder).setStrokeStyle(2, 0x44ee88, 1);

      this.rowLabel.setText(`Step ${row + 1} / ${cfg.rows}`);

      if (row + 1 >= cfg.rows) {
        this.time.delayedCall(400, () => this.handleVictory());
      } else {
        this.time.delayedCall(300, () => this.enableRowInput(row + 1));
      }
    } else {
      // Wrong — glass shatters
      this.isGameActive = false;
      this.shatterPanel(row, side);
      this.soundGenerator.playGunshot();
      this.cameras.main.shake(400, 0.015);

      this.tweens.add({
        targets: this.playerDot,
        y: this.playerDot.y + 200,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeIn',
      });

      this.time.delayedCall(1200, () => this.handleGameOver());
    }
  }

  private shatterPanel(row: number, side: 0 | 1): void {
    const pair = this.panels[row];
    const rect = side === 0 ? pair.leftRect : pair.rightRect;
    const border = side === 0 ? pair.leftBorder : pair.rightBorder;

    rect.setFillStyle(0xe63946, 0.6);
    border.setStrokeStyle(2, 0xe63946, 1);

    // Shatter particles
    for (let i = 0; i < 8; i++) {
      const shard = this.add.rectangle(
        rect.x + Phaser.Math.Between(-20, 20),
        rect.y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(4, 10),
        Phaser.Math.Between(4, 10),
        0x88ccff,
        0.8
      );
      shard.setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({
        targets: shard,
        y: shard.y + Phaser.Math.Between(60, 160),
        x: shard.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: 700,
        ease: 'Quad.easeIn',
        onComplete: () => shard.destroy(),
      });
    }

    // Fade out the panel
    this.tweens.add({
      targets: [rect, border],
      alpha: 0.15,
      duration: 500,
    });

    pair.revealed = true;
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
          countText.setText('GO!');
          this.soundGenerator.playCountdown(0.5);
          timer.remove();
          this.time.delayedCall(500, () => {
            countText.destroy();
            this.isGameActive = true;
            this.enableRowInput(0);
          });
        }
      },
      repeat: 2,
    });
    this.soundGenerator.playCountdown();
  }

  private handleVictory(): void {
    this.isGameActive = false;
    const cfg = DIFFICULTY_CONFIG[this.difficulty];

    const baseScore = 1000;
    const timeBonus = Math.floor(this.timeRemaining * 15);
    const streakBonus = this.streak * 50;
    const multiplier = SCORE_MULTIPLIER[this.difficulty];
    const finalScore = Math.floor((baseScore + timeBonus + streakBonus) * multiplier);

    this.registry.set('currentScore', finalScore);
    this.registry.set('currentDifficulty', this.difficulty);
    this.registry.set('isPerfectRun', this.streak >= cfg.rows);
    this.registry.set('scoreBreakdown', {
      baseScore,
      timeBonus,
      perfectBonus: streakBonus,
      subtotal: baseScore + timeBonus + streakBonus,
      difficultyMultiplier: multiplier,
      finalScore,
    });

    this.soundGenerator.playVictory();
    this.particleManager.createConfetti(this.playerDot.x, this.playerDot.y);

    const { width } = this.cameras.main;
    const winText = this.add.text(width / 2, this.playerDot.y - 40, 'SAFE!', {
      fontSize: '36px', color: '#44EE88', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: winText,
      scale: 1.2, alpha: 0,
      duration: 1500,
    });

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
      progressPercent: Math.floor(((this.currentRow + 1) / cfg.rows) * 100),
      timeSurvived: Math.floor(cfg.timeLimit - this.timeRemaining),
      timeLimit: cfg.timeLimit,
    });

    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME_OVER);
    });
  }

  private handleTimeUp(): void {
    this.isGameActive = false;
    const cfg = DIFFICULTY_CONFIG[this.difficulty];

    this.registry.set('gameOverData', {
      reason: 'timeout' as const,
      difficulty: this.difficulty,
      progressPercent: Math.floor(((this.currentRow + 1) / cfg.rows) * 100),
      timeSurvived: cfg.timeLimit,
      timeLimit: cfg.timeLimit,
    });

    const { width } = this.cameras.main;
    this.add.text(width / 2, this.cameras.main.height / 2, "TIME'S UP!", {
      fontSize: '36px', color: '#E63946', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.GAME_OVER);
      });
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
  }

  shutdown(): void {
    this.isPaused = false;
    this.input.keyboard?.off('keydown-ESC');
  }
}
