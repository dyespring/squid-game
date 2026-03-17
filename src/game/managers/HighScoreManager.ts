/**
 * HighScoreManager - Manages high scores with localStorage persistence
 *
 * Features:
 * - Per-difficulty leaderboards
 * - Persistent storage using localStorage
 * - Timestamp tracking
 * - Top 10 scores per difficulty
 */

import { Difficulty } from '../../types/game.types';

export interface HighScoreEntry {
  score: number;
  difficulty: Difficulty;
  timestamp: number;
  isPerfect: boolean;
  playDuration: number; // in seconds
}

interface HighScoreData {
  EASY: HighScoreEntry[];
  NORMAL: HighScoreEntry[];
  HARD: HighScoreEntry[];
}

export class HighScoreManager {
  private static readonly STORAGE_KEY = 'squid_game_high_scores';
  private static readonly MAX_SCORES_PER_DIFFICULTY = 10;

  private highScores: HighScoreData;

  constructor() {
    this.highScores = this.loadFromStorage();
  }

  /**
   * Add a new score and return whether it's a new high score
   * @returns Position in leaderboard (1-10) or null if not in top 10
   */
  public addScore(entry: HighScoreEntry): number | null {
    const difficulty = entry.difficulty;
    const scores = this.highScores[difficulty];

    // Add the new score
    scores.push(entry);

    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);

    // Find the position of the new entry
    const position = scores.findIndex((s) => s.timestamp === entry.timestamp);

    // Keep only top 10
    if (scores.length > HighScoreManager.MAX_SCORES_PER_DIFFICULTY) {
      this.highScores[difficulty] = scores.slice(0, HighScoreManager.MAX_SCORES_PER_DIFFICULTY);
    }

    // Save to storage
    this.saveToStorage();

    // Return position (1-indexed) if in top 10, otherwise null
    return position < HighScoreManager.MAX_SCORES_PER_DIFFICULTY ? position + 1 : null;
  }

  /**
   * Get high scores for a specific difficulty
   */
  public getHighScores(difficulty: Difficulty): HighScoreEntry[] {
    return [...this.highScores[difficulty]];
  }

  /**
   * Get all high scores
   */
  public getAllHighScores(): HighScoreData {
    return {
      EASY: [...this.highScores.EASY],
      NORMAL: [...this.highScores.NORMAL],
      HARD: [...this.highScores.HARD],
    };
  }

  /**
   * Get the highest score for a difficulty
   */
  public getTopScore(difficulty: Difficulty): HighScoreEntry | null {
    const scores = this.highScores[difficulty];
    return scores.length > 0 ? scores[0] : null;
  }

  /**
   * Check if a score would be a new high score
   */
  public isHighScore(score: number, difficulty: Difficulty): boolean {
    const scores = this.highScores[difficulty];
    if (scores.length < HighScoreManager.MAX_SCORES_PER_DIFFICULTY) {
      return true;
    }
    const lowestHighScore = scores[scores.length - 1].score;
    return score > lowestHighScore;
  }

  /**
   * Clear all high scores
   */
  public clearAllScores(): void {
    this.highScores = {
      EASY: [],
      NORMAL: [],
      HARD: [],
    };
    this.saveToStorage();
  }

  /**
   * Clear high scores for a specific difficulty
   */
  public clearDifficultyScores(difficulty: Difficulty): void {
    this.highScores[difficulty] = [];
    this.saveToStorage();
  }

  /**
   * Get total number of games played
   */
  public getTotalGamesPlayed(): number {
    return (
      this.highScores.EASY.length +
      this.highScores.NORMAL.length +
      this.highScores.HARD.length
    );
  }

  /**
   * Get statistics for a difficulty
   */
  public getDifficultyStats(difficulty: Difficulty): {
    gamesPlayed: number;
    highestScore: number;
    averageScore: number;
    perfectRuns: number;
  } {
    const scores = this.highScores[difficulty];
    const gamesPlayed = scores.length;
    const highestScore = gamesPlayed > 0 ? scores[0].score : 0;
    const averageScore = gamesPlayed > 0
      ? Math.floor(scores.reduce((sum, entry) => sum + entry.score, 0) / gamesPlayed)
      : 0;
    const perfectRuns = scores.filter((entry) => entry.isPerfect).length;

    return {
      gamesPlayed,
      highestScore,
      averageScore,
      perfectRuns,
    };
  }

  /**
   * Load high scores from localStorage
   */
  private loadFromStorage(): HighScoreData {
    try {
      const stored = localStorage.getItem(HighScoreManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate structure
        if (parsed.EASY && parsed.NORMAL && parsed.HARD) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load high scores:', error);
    }

    // Return empty structure if loading fails
    return {
      EASY: [],
      NORMAL: [],
      HARD: [],
    };
  }

  /**
   * Save high scores to localStorage
   */
  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(this.highScores);
      localStorage.setItem(HighScoreManager.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save high scores:', error);
    }
  }

  /**
   * Export high scores as JSON
   */
  public exportScores(): string {
    return JSON.stringify(this.highScores, null, 2);
  }

  /**
   * Import high scores from JSON
   */
  public importScores(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.EASY && parsed.NORMAL && parsed.HARD) {
        this.highScores = parsed;
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('Failed to import high scores:', error);
    }
    return false;
  }
}
