/**
 * PreloadScene
 * Loads all game assets with progress bar
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';

export default class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload(): void {
    console.log('📦 PreloadScene: Loading assets...');

    this.createLoadingScreen();
    this.loadAssets();

    // Set up loading event listeners
    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);
  }

  create(): void {
    console.log('✅ PreloadScene: Assets loaded');

    // Fade out loading screen
    this.cameras.main.fadeOut(500);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  private createLoadingScreen(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND_CREAM);

    // Title
    const title = this.add.text(width / 2, height / 2 - 100, 'SQUID GAME', {
      fontSize: '36px',
      color: '#FF4581',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 2 - 50,
      'Red Light, Green Light',
      {
        fontSize: '18px',
        color: '#1A1A1A',
      }
    );
    subtitle.setOrigin(0.5);

    // Loading bar background
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(COLORS.CONCRETE_GRAY, 0.3);
    this.loadingBar.fillRect(width / 2 - 150, height / 2 + 50, 300, 20);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(
      width / 2,
      height / 2 + 100,
      'Loading: 0%',
      {
        fontSize: '16px',
        color: '#8C8C8C',
      }
    );
    this.loadingText.setOrigin(0.5);
  }

  private loadAssets(): void {
    // TODO: Load actual game assets
    // For now, we'll use placeholder shapes and proceed

    // Placeholder for future asset loading
    // this.load.image('player', 'assets/images/characters/player.png');
    // this.load.image('doll', 'assets/images/doll/doll.png');
    // this.load.image('background', 'assets/images/backgrounds/field.png');
    // this.load.audio('music', 'assets/audio/music/game-theme.mp3');

    // Simulate loading time for development
    this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  private onLoadProgress(progress: number): void {
    const { width, height } = this.cameras.main;
    const percentage = Math.round(progress * 100);

    // Update progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(COLORS.SQUID_PINK, 1);
    this.progressBar.fillRect(
      width / 2 - 150,
      height / 2 + 50,
      300 * progress,
      20
    );

    // Update loading text
    this.loadingText.setText(`Loading: ${percentage}%`);
  }

  private onLoadComplete(): void {
    console.log('✅ All assets loaded');
    this.loadingText.setText('Loading: Complete!');
  }
}
