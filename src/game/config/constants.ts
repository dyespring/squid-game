/**
 * Game Constants
 * All game constants in one place for easy tuning
 */

export const GAME_CONSTANTS = {
  // Player Movement
  PLAYER_BASE_SPEED: 70, // pixels per second (reduced for more realistic movement)
  PLAYER_ACCELERATION_TIME: 300, // milliseconds to reach full speed
  PLAYER_MOMENTUM_OVERSHOOT: 100, // milliseconds of drift after stopping

  // Detection System
  DETECTION_THRESHOLD_EASY: 0.3, // pixels per frame
  DETECTION_THRESHOLD_NORMAL: 0.2,
  DETECTION_THRESHOLD_HARD: 0.1,

  // Doll Behavior
  DOLL_TURN_DURATION: 500, // milliseconds
  GREEN_LIGHT_DURATION_MIN: 3000,
  GREEN_LIGHT_DURATION_MAX: 6000,
  RED_LIGHT_DURATION_MIN: 2000,
  RED_LIGHT_DURATION_MAX: 4000,

  // Game Rules
  FINISH_LINE_PERCENTAGE: 0.1, // 10% from top of screen
  TIME_LIMIT_EASY: 90, // seconds
  TIME_LIMIT_NORMAL: 75,
  TIME_LIMIT_HARD: 60,

  // Distances
  FINISH_DISTANCE_EASY: 800,
  FINISH_DISTANCE_NORMAL: 1000,
  FINISH_DISTANCE_HARD: 1200,

  // Scoring
  BASE_SCORE: 1000,
  TIME_BONUS_MULTIPLIER: 10,
  DIFFICULTY_MULTIPLIER: {
    EASY: 1.0,
    NORMAL: 1.5,
    HARD: 2.0,
  },
  PERFECT_RUN_BONUS: 500,

  // NPC
  NPC_COUNT_EASY: 5,
  NPC_COUNT_NORMAL: 10,
  NPC_COUNT_HARD: 15,

  // Visual
  CAMERA_SHAKE_DURATION: 500,
  CAMERA_SHAKE_INTENSITY: 0.01,
  ELIMINATION_ANIMATION_DURATION: 2000,
  VICTORY_ANIMATION_DURATION: 3000,
} as const;

export const COLORS = {
  SQUID_PINK: 0xff4581,
  GUARD_PINK: 0xf74f8e,
  TRACKSUIT_GREEN: 0x008c62,
  BACKGROUND_CREAM: 0xf5e6d3,
  CONCRETE_GRAY: 0x8c8c8c,
  DANGER_RED: 0xe63946,
  GEOMETRIC_BLACK: 0x1a1a1a,
  WHITE: 0xffffff,
} as const;

export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  SETTINGS: 'SettingsScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene',
} as const;
