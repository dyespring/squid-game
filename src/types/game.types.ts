/**
 * Game Type Definitions
 * Central type definitions for the game
 */

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export enum GameState {
  READY = 'READY',
  GREEN_LIGHT = 'GREEN_LIGHT',
  TRANSITION = 'TRANSITION',
  RED_LIGHT = 'RED_LIGHT',
  CHECKING = 'CHECKING',
  ELIMINATION = 'ELIMINATION',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export interface DifficultyConfig {
  timeLimit: number;
  finishDistance: number;
  greenLightDuration: [number, number]; // [min, max]
  redLightDuration: [number, number]; // [min, max]
  detectionThreshold: number;
  npcCount: number;
  fakeTurns: boolean;
}

export interface ScoreData {
  baseScore: number;
  timeBonus: number;
  difficultyMultiplier: number;
  perfectRunBonus: number;
  finalScore: number;
}

export interface PlayerData {
  position: { x: number; y: number };
  velocity: number;
  isMoving: boolean;
  isEliminated: boolean;
  distanceTraveled: number;
}

export interface GameStats {
  startTime: number;
  endTime: number;
  duration: number;
  difficulty: Difficulty;
  score: number;
  completed: boolean;
}
