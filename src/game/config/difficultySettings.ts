/**
 * Difficulty Settings
 * Configuration for each difficulty level
 */

import type { Difficulty, DifficultyConfig } from '@/types/game.types';
import { GAME_CONSTANTS } from './constants';

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    timeLimit: GAME_CONSTANTS.TIME_LIMIT_EASY,
    finishDistance: GAME_CONSTANTS.FINISH_DISTANCE_EASY,
    greenLightDuration: [5000, 6000],
    redLightDuration: [3000, 4000],
    detectionThreshold: GAME_CONSTANTS.DETECTION_THRESHOLD_EASY,
    npcCount: GAME_CONSTANTS.NPC_COUNT_EASY,
    fakeTurns: false,
  },
  NORMAL: {
    timeLimit: GAME_CONSTANTS.TIME_LIMIT_NORMAL,
    finishDistance: GAME_CONSTANTS.FINISH_DISTANCE_NORMAL,
    greenLightDuration: [4000, 5000],
    redLightDuration: [2500, 3500],
    detectionThreshold: GAME_CONSTANTS.DETECTION_THRESHOLD_NORMAL,
    npcCount: GAME_CONSTANTS.NPC_COUNT_NORMAL,
    fakeTurns: false,
  },
  HARD: {
    timeLimit: GAME_CONSTANTS.TIME_LIMIT_HARD,
    finishDistance: GAME_CONSTANTS.FINISH_DISTANCE_HARD,
    greenLightDuration: [3000, 4000],
    redLightDuration: [2000, 3000],
    detectionThreshold: GAME_CONSTANTS.DETECTION_THRESHOLD_HARD,
    npcCount: GAME_CONSTANTS.NPC_COUNT_HARD,
    fakeTurns: true,
  },
};

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_SETTINGS[difficulty];
}
