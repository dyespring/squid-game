/**
 * GameOverScene
 * Displayed when player is eliminated or time runs out
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import { HighScoreManager } from '../managers/HighScoreManager';
import type { Difficulty } from '@/types/game.types';

interface GameOverData {
  reason: 'eliminated' | 'timeout';
  difficulty: Difficulty;
  progressPercent: number;
  timeSurvived: number;
  timeLimit: number;
}

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME_OVER });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    const data = this.registry.get('gameOverData') as GameOverData | undefined;
    const difficulty = data?.difficulty ?? 'NORMAL';

    this.cameras.main.fadeIn(300);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.GEOMETRIC_BLACK, 0.9);

    // Title
    const titleText = data?.reason === 'timeout' ? "TIME'S UP" : 'ELIMINATED';
    const title = this.add.text(width / 2, 80, titleText, {
      fontSize: '48px',
      color: '#E63946',
      fontStyle: 'bold',
      stroke: '#8B0000',
      strokeThickness: 3,
    });
    title.setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Progress stats
    if (data) {
      let infoY = 170;
      const lineHeight = 32;

      // Difficulty
      const diffColor =
        difficulty === 'EASY' ? '#4CAF50' : difficulty === 'HARD' ? '#F44336' : '#FF9800';
      this.add
        .text(width / 2, infoY, difficulty, {
          fontSize: '18px',
          color: diffColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      infoY += lineHeight + 8;

      // Progress bar
      this.createProgressBar(width / 2, infoY, data.progressPercent);
      infoY += 50;

      // Time survived
      this.createStatLine(width / 2, infoY, 'Time Survived', `${data.timeSurvived}s / ${data.timeLimit}s`);
      infoY += lineHeight;

      // Distance
      this.createStatLine(width / 2, infoY, 'Distance', `${data.progressPercent}%`);
      infoY += lineHeight + 16;

      // Tip
      const tip =
        data.reason === 'eliminated'
          ? 'Tip: Release before the doll turns around!'
          : 'Tip: Move quickly during green light to save time.';
      this.add
        .text(width / 2, infoY, tip, {
          fontSize: '13px',
          color: '#AAAAAA',
          fontStyle: 'italic',
          wordWrap: { width: width - 60 },
          align: 'center',
        })
        .setOrigin(0.5);
      infoY += 40;

      // Best score for this difficulty
      const hsManager = new HighScoreManager();
      const topScore = hsManager.getTopScore(difficulty);
      if (topScore) {
        this.add
          .text(width / 2, infoY, `Best (${difficulty}): ${topScore.score}`, {
            fontSize: '16px',
            color: '#FFD700',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
      }
    }

    // Buttons
    this.createButton(width / 2, height - 140, 'TRY AGAIN', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.GAME);
      });
    });

    this.createButton(width / 2, height - 70, 'MENU', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.MENU);
      });
    });
  }

  private createProgressBar(x: number, y: number, percent: number): void {
    const barWidth = 240;
    const barHeight = 16;

    // Background
    this.add
      .rectangle(x, y, barWidth, barHeight, 0x333333)
      .setStrokeStyle(2, 0x555555);

    // Fill
    const fillWidth = Math.max(2, (barWidth - 4) * (percent / 100));
    const fillColor = percent >= 75 ? 0x4caf50 : percent >= 40 ? 0xff9800 : 0xe63946;
    const fill = this.add.rectangle(
      x - barWidth / 2 + 2 + fillWidth / 2,
      y,
      fillWidth,
      barHeight - 4,
      fillColor
    );

    // Animate fill
    fill.scaleX = 0;
    this.tweens.add({
      targets: fill,
      scaleX: 1,
      duration: 800,
      ease: 'Power2',
      delay: 300,
    });

    // Label
    this.add
      .text(x, y, `${percent}%`, {
        fontSize: '11px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1);
  }

  private createStatLine(x: number, y: number, label: string, value: string): void {
    this.add
      .text(x - 100, y, label, {
        fontSize: '14px',
        color: '#AAAAAA',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 100, y, value, {
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const button = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#FFFFFF',
      backgroundColor: '#E63946',
      padding: { x: 30, y: 15 },
      fontStyle: 'bold',
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setScale(1.1);
      button.setStyle({ backgroundColor: '#FF4581' });
    });
    button.on('pointerout', () => {
      button.setScale(1);
      button.setStyle({ backgroundColor: '#E63946' });
    });
    button.on('pointerdown', callback);
  }
}
