/**
 * Phaser Game Configuration
 * Main configuration for the Phaser game instance
 */

import Phaser from 'phaser';
import { COLORS } from './constants';

// Import scenes (will be created next)
import BootScene from '../scenes/BootScene';
import PreloadScene from '../scenes/PreloadScene';
import MenuScene from '../scenes/MenuScene';
import SettingsScene from '../scenes/SettingsScene';
import LeaderboardScene from '../scenes/LeaderboardScene';
import GameScene from '../scenes/GameScene';
import GlassBridgeScene from '../scenes/GlassBridgeScene';
import TugOfWarScene from '../scenes/TugOfWarScene';
import HoneycombScene from '../scenes/HoneycombScene';
import GameOverScene from '../scenes/GameOverScene';
import VictoryScene from '../scenes/VictoryScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  parent: 'game-container',
  width: 375,
  height: 667,
  backgroundColor: COLORS.BACKGROUND_CREAM,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false, // Set to true for development
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    SettingsScene,
    LeaderboardScene,
    GameScene,
    GlassBridgeScene,
    TugOfWarScene,
    HoneycombScene,
    GameOverScene,
    VictoryScene,
  ],
  input: {
    activePointers: 1, // Single touch for mobile
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};
