/**
 * BootScene
 * First scene that loads - initializes core systems
 */

import Phaser from 'phaser';
import { SCENES } from '../config/constants';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    // Create simple loading graphics
    this.createLoadingGraphics();
  }

  create(): void {
    console.log('🚀 BootScene: Initializing game...');

    // Check if mobile device
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);

    // Set up device-specific settings
    if (isMobile) {
      this.setupMobileSettings();
    }

    // Initialize game registry for shared data
    this.registry.set('isMobile', isMobile);
    this.registry.set('difficulty', 'NORMAL');
    this.registry.set('highScore', this.getHighScore());

    // Proceed to PreloadScene
    this.time.delayedCall(500, () => {
      this.scene.start(SCENES.PRELOAD);
    });
  }

  private createLoadingGraphics(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0xf5e6d3);

    // Title text
    const title = this.add.text(width / 2, height / 2 - 50, 'SQUID GAME', {
      fontSize: '32px',
      color: '#FF4581',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 2 + 10,
      'Red Light, Green Light',
      {
        fontSize: '16px',
        color: '#1A1A1A',
      }
    );
    subtitle.setOrigin(0.5);

    // Loading text
    const loading = this.add.text(width / 2, height / 2 + 60, 'Loading...', {
      fontSize: '14px',
      color: '#8C8C8C',
    });
    loading.setOrigin(0.5);
  }

  private setupMobileSettings(): void {
    // Prevent pull-to-refresh on mobile
    if (typeof window !== 'undefined') {
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'none';
    }

    // Lock orientation to portrait if possible
    if (screen.orientation && 'lock' in screen.orientation) {
      (screen.orientation as any).lock('portrait').catch((err: any) => {
        console.warn('Could not lock orientation:', err);
      });
    }
  }

  private getHighScore(): number {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('squidgame-highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  }
}
