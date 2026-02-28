/**
 * MenuScene
 * Main menu with difficulty selection
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';
import type { Difficulty } from '@/types/game.types';
import MusicGenerator from '../utils/MusicGenerator';

export default class MenuScene extends Phaser.Scene {
  private musicGenerator!: MusicGenerator;
  private musicEnabled: boolean = true;

  constructor() {
    super({ key: SCENES.MENU });
  }

  create(): void {
    console.log('🎮 MenuScene: Showing menu');

    const { width, height } = this.cameras.main;

    // Check music setting
    this.musicEnabled = this.registry.get('musicEnabled') ?? true;

    // Initialize music generator
    this.musicGenerator = new MusicGenerator();

    // Play menu music if enabled
    if (this.musicEnabled) {
      this.musicGenerator.playMenuMusic();
    }

    // Listen for music setting changes
    this.game.events.on('music-setting-changed', this.handleMusicSettingChanged, this);

    // Fade in
    this.cameras.main.fadeIn(500);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND_CREAM);

    // Title
    const title = this.add.text(width / 2, 100, 'SQUID GAME', {
      fontSize: '48px',
      color: '#FF4581',
      fontStyle: 'bold',
      stroke: '#8B2252',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setAlpha(0);

    // Animate title entrance
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 100,
      from: { y: 60 },
      duration: 800,
      ease: 'Back.easeOut',
    });

    // Pulsing title
    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    const subtitle = this.add.text(width / 2, 160, 'Red Light, Green Light', {
      fontSize: '20px',
      color: '#1A1A1A',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: 200,
    });

    // High score display
    const highScore = this.registry.get('highScore') as number;
    if (highScore > 0) {
      const hsText = this.add.text(
        width / 2,
        200,
        `🏆 High Score: ${highScore}`,
        {
          fontSize: '18px',
          color: '#FFD700',
          fontStyle: 'bold',
        }
      );
      hsText.setOrigin(0.5);
      hsText.setAlpha(0);

      this.tweens.add({
        targets: hsText,
        alpha: 1,
        duration: 800,
        delay: 400,
      });

      // Gentle pulse
      this.tweens.add({
        targets: hsText,
        scale: 1.1,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Difficulty buttons (with staggered entrance)
    this.createDifficultyButton(width / 2, 300, 'EASY', '#4CAF50', 600);
    this.createDifficultyButton(width / 2, 380, 'NORMAL', '#FF9800', 750);
    this.createDifficultyButton(width / 2, 460, 'HARD', '#F44336', 900);

    // Settings button (top right)
    this.createSettingsButton(width - 30, 30, 1050);

    // Instructions
    const instructions = this.add.text(
      width / 2,
      550,
      'Touch and hold to move\nRelease to freeze',
      {
        fontSize: '14px',
        color: '#8C8C8C',
        align: 'center',
      }
    );
    instructions.setOrigin(0.5);
  }

  private createSettingsButton(x: number, y: number, delay: number = 0): void {
    // Settings icon (gear)
    const gear = this.add.text(x, y, '⚙️', {
      fontSize: '32px',
    });
    gear.setOrigin(0.5);
    gear.setAlpha(0);
    gear.setInteractive({ useHandCursor: true });

    // Entrance animation
    this.tweens.add({
      targets: gear,
      alpha: 1,
      duration: 600,
      delay: delay,
    });

    // Hover effect - rotate
    gear.on('pointerover', () => {
      this.tweens.add({
        targets: gear,
        angle: 90,
        scale: 1.2,
        duration: 300,
        ease: 'Back.easeOut',
      });
    });

    gear.on('pointerout', () => {
      this.tweens.add({
        targets: gear,
        angle: 0,
        scale: 1,
        duration: 300,
      });
    });

    // Click handler
    gear.on('pointerdown', () => {
      this.tweens.add({
        targets: gear,
        angle: 180,
        duration: 200,
        onComplete: () => {
          this.openSettings();
        },
      });
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

  private openSettings(): void {
    // Stop music
    this.musicGenerator.stopMusic();

    // Fade out and open settings
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.SETTINGS, { from: SCENES.MENU });
    });
  }

  private createDifficultyButton(
    x: number,
    y: number,
    difficulty: Difficulty,
    color: string,
    delay: number = 0
  ): void {
    const width = 250;
    const height = 60;

    // Button background
    const button = this.add.rectangle(x, y, width, height, 0xffffff);
    button.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(color).color);
    button.setAlpha(0);

    // Button text
    const text = this.add.text(x, y, difficulty, {
      fontSize: '24px',
      color: color,
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setAlpha(0);

    // Entrance animation
    this.tweens.add({
      targets: [button, text],
      alpha: 1,
      x: x,
      from: { x: x - 100 },
      duration: 600,
      delay: delay,
      ease: 'Back.easeOut',
    });

    // Make interactive
    button.setInteractive({ useHandCursor: true });

    // Hover effect
    button.on('pointerover', () => {
      button.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.1);
      this.tweens.add({
        targets: [button, text],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
      button.setFillStyle(0xffffff);
      this.tweens.add({
        targets: [button, text],
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      });
    });

    // Click handler with animation
    button.on('pointerdown', () => {
      this.tweens.add({
        targets: [button, text],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.startGame(difficulty);
        },
      });
    });
  }

  private startGame(difficulty: Difficulty): void {
    console.log(`🎯 Starting game on ${difficulty} difficulty`);

    // Save difficulty to registry
    this.registry.set('difficulty', difficulty);

    // Stop menu music
    this.musicGenerator.stopMusic();

    // Fade out and start game
    this.cameras.main.fadeOut(500);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME);
    });
  }

  shutdown(): void {
    // Cleanup music
    if (this.musicGenerator) {
      this.musicGenerator.stopMusic();
    }

    // Remove event listeners
    this.game.events.off('music-setting-changed', this.handleMusicSettingChanged, this);
  }
}
