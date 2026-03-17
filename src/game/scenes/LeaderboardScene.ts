/**
 * LeaderboardScene
 * Displays top scores per difficulty with stats
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import { HighScoreManager } from '../managers/HighScoreManager';
import type { Difficulty } from '@/types/game.types';

export default class LeaderboardScene extends Phaser.Scene {
  private highScoreManager!: HighScoreManager;
  private activeDifficulty: Difficulty = 'NORMAL';
  private listContainer!: Phaser.GameObjects.Container;
  private tabs: Map<Difficulty, Phaser.GameObjects.Text> = new Map();
  private statsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.LEADERBOARD });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.highScoreManager = new HighScoreManager();
    this.cameras.main.fadeIn(300);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND_CREAM);

    // Title
    const title = this.add.text(width / 2, 50, 'LEADERBOARD', {
      fontSize: '36px',
      color: '#FF4581',
      fontStyle: 'bold',
      stroke: '#8B2252',
      strokeThickness: 3,
    });
    title.setOrigin(0.5);

    // Difficulty tabs
    this.createTabs(width);

    // Score list container
    this.listContainer = this.add.container(0, 0);

    // Stats text
    this.statsText = this.add.text(width / 2, height - 120, '', {
      fontSize: '13px',
      color: '#8C8C8C',
      align: 'center',
    });
    this.statsText.setOrigin(0.5);

    // Show default tab
    this.showDifficulty(this.activeDifficulty);

    // Back button
    const backBtn = this.add.text(width / 2, height - 50, 'BACK TO MENU', {
      fontSize: '18px',
      color: '#FFFFFF',
      backgroundColor: '#FF4581',
      padding: { x: 24, y: 12 },
      fontStyle: 'bold',
    });
    backBtn.setOrigin(0.5);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setScale(1.08));
    backBtn.on('pointerout', () => backBtn.setScale(1));
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.MENU);
      });
    });
  }

  private createTabs(sceneWidth: number): void {
    const difficulties: { key: Difficulty; label: string; color: string }[] = [
      { key: 'EASY', label: 'EASY', color: '#4CAF50' },
      { key: 'NORMAL', label: 'NORMAL', color: '#FF9800' },
      { key: 'HARD', label: 'HARD', color: '#F44336' },
    ];

    const tabWidth = 100;
    const totalWidth = difficulties.length * tabWidth + (difficulties.length - 1) * 10;
    const startX = (sceneWidth - totalWidth) / 2 + tabWidth / 2;

    difficulties.forEach((d, i) => {
      const x = startX + i * (tabWidth + 10);
      const tab = this.add.text(x, 100, d.label, {
        fontSize: '16px',
        color: d.color,
        fontStyle: 'bold',
        backgroundColor: '#FFFFFF',
        padding: { x: 16, y: 8 },
      });
      tab.setOrigin(0.5);
      tab.setInteractive({ useHandCursor: true });
      tab.on('pointerdown', () => this.showDifficulty(d.key));

      this.tabs.set(d.key, tab);
    });
  }

  private showDifficulty(difficulty: Difficulty): void {
    this.activeDifficulty = difficulty;

    // Update tab styling
    this.tabs.forEach((tab, key) => {
      if (key === difficulty) {
        tab.setStyle({ backgroundColor: '#FF4581', color: '#FFFFFF' });
      } else {
        const color = key === 'EASY' ? '#4CAF50' : key === 'HARD' ? '#F44336' : '#FF9800';
        tab.setStyle({ backgroundColor: '#FFFFFF', color });
      }
    });

    // Clear existing list
    this.listContainer.removeAll(true);

    const { width } = this.cameras.main;
    const scores = this.highScoreManager.getHighScores(difficulty);
    const startY = 145;
    const rowHeight = 36;

    // Header
    this.addRow(width, startY, '#', 'Score', 'Date', 'P', true);

    if (scores.length === 0) {
      const emptyText = this.add.text(width / 2, startY + 80, 'No scores yet.\nPlay a game!', {
        fontSize: '16px',
        color: '#AAAAAA',
        align: 'center',
      });
      emptyText.setOrigin(0.5);
      this.listContainer.add(emptyText);
    } else {
      scores.forEach((entry, index) => {
        const y = startY + (index + 1) * rowHeight;
        const date = new Date(entry.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const perfect = entry.isPerfect ? '\u2605' : '';
        this.addRow(width, y, `${index + 1}`, `${entry.score}`, dateStr, perfect, false, index);
      });
    }

    // Stats
    const stats = this.highScoreManager.getDifficultyStats(difficulty);
    if (stats.gamesPlayed > 0) {
      this.statsText.setText(
        `Games: ${stats.gamesPlayed}  |  Avg: ${stats.averageScore}  |  Perfect Runs: ${stats.perfectRuns}`
      );
    } else {
      this.statsText.setText('');
    }
  }

  private addRow(
    sceneWidth: number,
    y: number,
    rank: string,
    score: string,
    date: string,
    perfect: string,
    isHeader: boolean,
    index?: number
  ): void {
    const style = {
      fontSize: isHeader ? '13px' : '14px',
      color: isHeader ? '#8C8C8C' : '#1A1A1A',
      fontStyle: isHeader ? 'bold' : (index === 0 ? 'bold' : 'normal'),
    };

    const rankColor = !isHeader && index === 0 ? '#FFD700' : style.color;

    const cols = [
      { text: rank, x: sceneWidth * 0.12, color: rankColor },
      { text: score, x: sceneWidth * 0.38, color: style.color },
      { text: date, x: sceneWidth * 0.65, color: style.color },
      { text: perfect, x: sceneWidth * 0.85, color: '#FFD700' },
    ];

    cols.forEach((col) => {
      const t = this.add.text(col.x, y, col.text, {
        fontSize: style.fontSize,
        color: col.color,
        fontStyle: style.fontStyle as string,
      });
      t.setOrigin(0.5);
      this.listContainer.add(t);
    });

    if (isHeader) {
      const line = this.add.graphics();
      line.lineStyle(1, 0xcccccc, 0.6);
      line.lineBetween(sceneWidth * 0.05, y + 14, sceneWidth * 0.95, y + 14);
      this.listContainer.add(line);
    }
  }
}
