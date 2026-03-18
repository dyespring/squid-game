/**
 * MenuScene
 * Main menu with game selection and difficulty picker
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import type { Difficulty } from '@/types/game.types';
import MusicGenerator from '../utils/MusicGenerator';
import { HighScoreManager } from '../managers/HighScoreManager';

interface GameOption {
  key: string;
  label: string;
  subtitle: string;
  color: string;
  scene: string;
}

const GAMES: GameOption[] = [
  { key: 'rlgl', label: 'Red Light Green Light', subtitle: 'Hold to move, freeze on red', color: '#E63946', scene: SCENES.GAME },
  { key: 'glass', label: 'Glass Bridge', subtitle: 'Pick the safe panel', color: '#4488FF', scene: SCENES.GLASS_BRIDGE },
  { key: 'tug', label: 'Tug of War', subtitle: 'Tap to pull your team', color: '#FF9800', scene: SCENES.TUG_OF_WAR },
  { key: 'honey', label: 'Honeycomb', subtitle: 'Trace the shape carefully', color: '#D4A030', scene: SCENES.HONEYCOMB },
];

export default class MenuScene extends Phaser.Scene {
  private musicGenerator!: MusicGenerator;
  private highScoreManager!: HighScoreManager;
  private musicEnabled: boolean = true;
  private selectedGame: GameOption = GAMES[0];
  private difficultyButtons: Map<Difficulty, { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = new Map();
  private selectedDifficulty: Difficulty = 'NORMAL';

  constructor() {
    super({ key: SCENES.MENU });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.musicEnabled = this.registry.get('musicEnabled') ?? true;

    this.musicGenerator = new MusicGenerator();
    this.highScoreManager = new HighScoreManager();

    if (this.musicEnabled) {
      this.musicGenerator.playMenuMusic();
    }

    this.game.events.on('music-setting-changed', this.handleMusicSettingChanged, this);

    this.cameras.main.fadeIn(500);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND_CREAM);

    // Title
    const title = this.add.text(width / 2, 60, 'SQUID GAME', {
      fontSize: '42px',
      color: '#FF4581',
      fontStyle: 'bold',
      stroke: '#8B2252',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 60,
      from: { y: 30 },
      duration: 800,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // High score
    const allScores = this.highScoreManager.getAllHighScores();
    const bestOverall = Math.max(
      allScores.EASY[0]?.score || 0,
      allScores.NORMAL[0]?.score || 0,
      allScores.HARD[0]?.score || 0
    );

    if (bestOverall > 0) {
      let bestDiff: Difficulty = 'NORMAL';
      if (allScores.EASY[0]?.score === bestOverall) bestDiff = 'EASY';
      else if (allScores.HARD[0]?.score === bestOverall) bestDiff = 'HARD';

      const hs = this.add.text(width / 2, 105, `Best: ${bestOverall} (${bestDiff})`, {
        fontSize: '15px', color: '#B8860B', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: hs, alpha: 1, duration: 800, delay: 300 });
    }

    // ─── SELECT GAME ───────────────────────────────────

    this.add.text(width / 2, 135, 'SELECT GAME', {
      fontSize: '13px', color: '#8C8C8C', fontStyle: 'bold',
    }).setOrigin(0.5);

    GAMES.forEach((game, i) => {
      this.createGameCard(width / 2, 172 + i * 60, game, 400 + i * 120);
    });

    // ─── DIFFICULTY ────────────────────────────────────

    this.add.text(width / 2, 420, 'DIFFICULTY', {
      fontSize: '13px', color: '#8C8C8C', fontStyle: 'bold',
    }).setOrigin(0.5);

    const difficulties: { key: Difficulty; color: string }[] = [
      { key: 'EASY', color: '#4CAF50' },
      { key: 'NORMAL', color: '#FF9800' },
      { key: 'HARD', color: '#F44336' },
    ];

    const diffBtnWidth = 90;
    const totalDiffWidth = 3 * diffBtnWidth + 2 * 10;
    const diffStartX = (width - totalDiffWidth) / 2 + diffBtnWidth / 2;

    difficulties.forEach((d, i) => {
      const x = diffStartX + i * (diffBtnWidth + 10);
      this.createDifficultyChip(x, 450, d.key, d.color, 800 + i * 100);
    });

    // ─── PLAY BUTTON ───────────────────────────────────

    const playBtn = this.add.text(width / 2, 510, 'PLAY', {
      fontSize: '28px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      backgroundColor: '#FF4581',
      padding: { x: 50, y: 14 },
    }).setOrigin(0.5).setAlpha(0);

    playBtn.setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: playBtn, alpha: 1, duration: 600, delay: 1100 });

    playBtn.on('pointerover', () => {
      playBtn.setScale(1.08);
      playBtn.setStyle({ backgroundColor: '#E6366E' });
    });
    playBtn.on('pointerout', () => {
      playBtn.setScale(1);
      playBtn.setStyle({ backgroundColor: '#FF4581' });
    });
    playBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: playBtn, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true,
        onComplete: () => this.startSelectedGame(),
      });
    });

    // ─── BOTTOM ROW ────────────────────────────────────

    this.createLeaderboardButton(width / 2 - 70, 575, 1200);
    this.createSettingsButton(width / 2 + 70, 575, 1200);

    // Instructions
    this.add.text(width / 2, 620, 'Mobile: Tap & hold  |  Desktop: SPACE', {
      fontSize: '11px', color: '#AAAAAA',
    }).setOrigin(0.5);
  }

  // ─── Game Cards ──────────────────────────────────────

  private createGameCard(x: number, y: number, game: GameOption, delay: number): void {
    const cardW = 300;
    const cardH = 48;

    const bg = this.add.rectangle(x, y, cardW, cardH, 0xffffff);
    bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(game.color).color);
    bg.setAlpha(0);

    const label = this.add.text(x, y - 8, game.label, {
      fontSize: '16px', color: game.color, fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(x, y + 14, game.subtitle, {
      fontSize: '11px', color: '#8C8C8C',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [bg, label, sub],
      alpha: 1,
      duration: 500,
      delay,
      ease: 'Power2',
    });

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(game.color).color, 0.08);
      this.tweens.add({ targets: [bg, label, sub], scaleX: 1.03, scaleY: 1.03, duration: 150 });
    });
    bg.on('pointerout', () => {
      if (this.selectedGame.key !== game.key) bg.setFillStyle(0xffffff);
      this.tweens.add({ targets: [bg, label, sub], scaleX: 1, scaleY: 1, duration: 150 });
    });
    bg.on('pointerdown', () => {
      this.selectGame(game, bg);
    });

    if (game.key === this.selectedGame.key) {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(game.color).color, 0.12);
      bg.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(game.color).color);
    }
  }

  private selectGame(game: GameOption, bg: Phaser.GameObjects.Rectangle): void {
    this.selectedGame = game;

    bg.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(game.color).color);
    bg.setFillStyle(Phaser.Display.Color.HexStringToColor(game.color).color, 0.12);
  }

  // ─── Difficulty Chips ────────────────────────────────

  private createDifficultyChip(x: number, y: number, diff: Difficulty, color: string, delay: number): void {
    const chipW = 90;
    const chipH = 34;
    const isSelected = diff === this.selectedDifficulty;
    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;

    const bg = this.add.rectangle(x, y, chipW, chipH, isSelected ? colorNum : 0xffffff);
    bg.setStrokeStyle(2, colorNum);
    bg.setAlpha(0);

    const text = this.add.text(x, y, diff, {
      fontSize: '14px',
      color: isSelected ? '#FFFFFF' : color,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [bg, text], alpha: 1, duration: 400, delay });

    this.difficultyButtons.set(diff, { bg, text });

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.selectDifficulty(diff));
  }

  private selectDifficulty(diff: Difficulty): void {
    this.selectedDifficulty = diff;

    const colorMap: Record<Difficulty, string> = { EASY: '#4CAF50', NORMAL: '#FF9800', HARD: '#F44336' };

    this.difficultyButtons.forEach((btn, key) => {
      const c = colorMap[key];
      const colorNum = Phaser.Display.Color.HexStringToColor(c).color;
      if (key === diff) {
        btn.bg.setFillStyle(colorNum);
        btn.text.setColor('#FFFFFF');
      } else {
        btn.bg.setFillStyle(0xffffff);
        btn.text.setColor(c);
      }
    });
  }

  // ─── Navigation ──────────────────────────────────────

  private startSelectedGame(): void {
    this.registry.set('difficulty', this.selectedDifficulty);

    this.musicGenerator.stopMusic();
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.selectedGame.scene);
    });
  }

  private createLeaderboardButton(x: number, y: number, delay: number): void {
    const btn = this.add.text(x, y, 'LEADERBOARD', {
      fontSize: '13px', color: '#B8860B', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: btn, alpha: 1, duration: 500, delay });

    btn.on('pointerover', () => btn.setScale(1.1));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', () => {
      this.musicGenerator.stopMusic();
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.LEADERBOARD));
    });
  }

  private createSettingsButton(x: number, y: number, delay: number): void {
    const gear = this.add.text(x, y, '⚙️', { fontSize: '28px' }).setOrigin(0.5).setAlpha(0);
    gear.setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: gear, alpha: 1, duration: 500, delay });

    gear.on('pointerover', () => this.tweens.add({ targets: gear, angle: 90, scale: 1.2, duration: 300, ease: 'Back.easeOut' }));
    gear.on('pointerout', () => this.tweens.add({ targets: gear, angle: 0, scale: 1, duration: 300 }));
    gear.on('pointerdown', () => {
      this.musicGenerator.stopMusic();
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.SETTINGS, { from: SCENES.MENU }));
    });
  }

  private handleMusicSettingChanged(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (enabled && !this.musicGenerator.isPlayingMusic()) {
      this.musicGenerator.playMenuMusic();
    } else if (!enabled) {
      this.musicGenerator.stopMusic();
    }
  }

  shutdown(): void {
    if (this.musicGenerator) {
      this.musicGenerator.stopMusic();
    }
    this.game.events.off('music-setting-changed', this.handleMusicSettingChanged, this);
  }
}
