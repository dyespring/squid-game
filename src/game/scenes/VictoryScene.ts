/**
 * VictoryScene
 * Displayed when player wins with score breakdown
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import { HighScoreManager } from '../managers/HighScoreManager';
import type { Difficulty } from '@/types/game.types';

export default class VictoryScene extends Phaser.Scene {
  private highScoreManager!: HighScoreManager;

  constructor() {
    super({ key: SCENES.VICTORY });
  }

  create(): void {
    console.log('🎉 VictoryScene');

    const { width, height } = this.cameras.main;

    // Get score data from registry
    const currentScore = (this.registry.get('currentScore') as number) || 0;
    const difficulty = (this.registry.get('currentDifficulty') as Difficulty) || 'NORMAL';
    const isPerfect = this.registry.get('isPerfectRun') as boolean;
    const scoreBreakdown = this.registry.get('scoreBreakdown') as any;

    // Initialize high score manager
    this.highScoreManager = new HighScoreManager();

    // Add to high scores
    const leaderboardPosition = this.highScoreManager.addScore({
      score: currentScore,
      difficulty,
      timestamp: Date.now(),
      isPerfect,
      playDuration: 0, // Will be calculated by ScoreSystem
    });

    const topScore = this.highScoreManager.getTopScore(difficulty);
    const isNewHighScore = leaderboardPosition === 1;

    // Fade in
    this.cameras.main.fadeIn(300);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.TRACKSUIT_GREEN, 0.9);

    // Title
    const title = this.add.text(width / 2, 80, 'VICTORY!', {
      fontSize: '56px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#008C62',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Animate title
    this.tweens.add({
      targets: title,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Perfect run badge
    if (isPerfect) {
      const perfectBadge = this.add.text(width / 2, 160, '⭐ PERFECT RUN ⭐', {
        fontSize: '18px',
        color: '#FFD700',
        fontStyle: 'bold',
      });
      perfectBadge.setOrigin(0.5);

      this.tweens.add({
        targets: perfectBadge,
        scale: 1.15,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }

    // Score breakdown
    const breakdownY = isPerfect ? 200 : 180;
    this.createScoreBreakdown(width / 2, breakdownY, scoreBreakdown, difficulty);

    // Final score - larger and prominent
    const finalScoreText = this.add.text(
      width / 2,
      breakdownY + 160,
      `${currentScore}`,
      {
        fontSize: '48px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#FFFFFF',
        strokeThickness: 3,
      }
    );
    finalScoreText.setOrigin(0.5);

    // High score status
    const statusY = breakdownY + 220;
    if (isNewHighScore && currentScore > 0) {
      const newHigh = this.add.text(width / 2, statusY, '🏆 NEW HIGH SCORE! 🏆', {
        fontSize: '20px',
        color: '#FFD700',
        fontStyle: 'bold',
      });
      newHigh.setOrigin(0.5);

      this.tweens.add({
        targets: newHigh,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else if (leaderboardPosition && leaderboardPosition <= 10) {
      this.add
        .text(
          width / 2,
          statusY,
          `#${leaderboardPosition} on ${difficulty} Leaderboard`,
          {
            fontSize: '16px',
            color: '#FFD700',
            fontStyle: 'bold',
          }
        )
        .setOrigin(0.5);
    } else if (topScore) {
      this.add
        .text(width / 2, statusY, `Best: ${topScore.score} (${difficulty})`, {
          fontSize: '16px',
          color: '#FFFFFF',
        })
        .setOrigin(0.5);
    }

    // Buttons
    this.createButton(width / 2, height - 140, 'PLAY AGAIN', () => {
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

  private createScoreBreakdown(
    x: number,
    y: number,
    breakdown: any,
    difficulty: Difficulty
  ): void {
    if (!breakdown) return;

    const lineHeight = 24;
    let currentY = y;

    // Base score
    this.createBreakdownLine(x, currentY, 'Base Score', breakdown.baseScore, '#FFFFFF');
    currentY += lineHeight;

    // Time bonus
    this.createBreakdownLine(x, currentY, 'Time Bonus', breakdown.timeBonus, '#FFFFFF');
    currentY += lineHeight;

    // Perfect bonus
    if (breakdown.perfectBonus > 0) {
      this.createBreakdownLine(
        x,
        currentY,
        'Perfect Bonus',
        breakdown.perfectBonus,
        '#FFD700'
      );
      currentY += lineHeight;
    }

    // Subtotal
    currentY += 5;
    this.createBreakdownLine(x, currentY, 'Subtotal', breakdown.subtotal, '#FFFFFF', true);
    currentY += lineHeight + 5;

    // Difficulty multiplier
    this.createBreakdownLine(
      x,
      currentY,
      `${difficulty} Multiplier (×${breakdown.difficultyMultiplier})`,
      '',
      '#FFFFFF'
    );
    currentY += lineHeight + 10;

    // Separator line
    const line = this.add.graphics();
    line.lineStyle(2, 0xffffff, 0.5);
    line.lineBetween(x - 120, currentY, x + 120, currentY);
    currentY += 15;

    // Total label
    this.add
      .text(x, currentY, 'TOTAL SCORE', {
        fontSize: '16px',
        color: '#FFD700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createBreakdownLine(
    x: number,
    y: number,
    label: string,
    value: number | string,
    color: string,
    bold: boolean = false
  ): void {
    const labelText = this.add.text(x - 120, y, label, {
      fontSize: '14px',
      color: color,
      fontStyle: bold ? 'bold' : 'normal',
    });
    labelText.setOrigin(0, 0.5);

    if (value !== '') {
      const valueText = this.add.text(x + 120, y, `${value}`, {
        fontSize: '14px',
        color: color,
        fontStyle: bold ? 'bold' : 'normal',
      });
      valueText.setOrigin(1, 0.5);
    }
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const button = this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#008C62',
      backgroundColor: '#FFFFFF',
      padding: { x: 30, y: 15 },
      fontStyle: 'bold',
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setScale(1.1);
      button.setStyle({ backgroundColor: '#FFD700' });
    });
    button.on('pointerout', () => {
      button.setScale(1);
      button.setStyle({ backgroundColor: '#FFFFFF' });
    });
    button.on('pointerdown', callback);
  }
}
