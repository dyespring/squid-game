/**
 * Main Entry Point
 * Initializes the Phaser game
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './game/config/gameConfig';
import AudioManager from './game/managers/AudioManager';
import './ui/styles/global.css';

console.log('🎮 Initializing Squid Game: Red Light, Green Light');
console.log('📍 Environment:', import.meta.env.MODE);

// Initialize Audio Manager (singleton instance)
const audioManager = new AudioManager();

// Create Phaser game instance
const game = new Phaser.Game({
  ...GAME_CONFIG,
  callbacks: {
    preBoot: (game: Phaser.Game) => {
      console.log('🚀 Phaser pre-boot');

      // Store AudioManager in registry for global access
      game.registry.set('audioManager', audioManager);

      // Log device info
      console.log('📱 Device:', {
        os: game.device.os,
        browser: game.device.browser,
        pixelRatio: window.devicePixelRatio,
        touchSupport: game.device.input.touch,
      });
    },
    postBoot: (game: Phaser.Game) => {
      console.log('✅ Phaser booted successfully');
      console.log('🎮 Canvas size:', game.canvas.width, 'x', game.canvas.height);
    },
  },
});

// Handle visibility change (pause when tab is hidden)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('⏸️ Game paused (tab hidden)');
      game.sound.pauseAll();
    } else {
      console.log('▶️ Game resumed (tab visible)');
      game.sound.resumeAll();
    }
  });
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  console.log('👋 Cleaning up...');
  audioManager.destroy();
  game.destroy(true);
});

// Expose game instance for debugging (only in development)
if (import.meta.env.DEV) {
  (window as any).game = game;
  (window as any).audioManager = audioManager;
  console.log('🐛 Debug mode: game and audioManager available on window object');
}

// Log startup complete
console.log('✅ Game initialization complete');
console.log('🎮 Ready to play!');

export default game;
