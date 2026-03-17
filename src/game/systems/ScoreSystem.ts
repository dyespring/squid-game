/**
 * ScoreSystem - Handles score calculation and tracking
 *
 * Scoring Formula:
 * - Base Score: 1000 points
 * - Time Bonus: (remaining seconds) × 10
 * - Difficulty Multiplier: Easy (1.0x), Normal (1.5x), Hard (2.0x)
 * - Perfect Run Bonus: +500 (no detection warnings)
 *
 * Example: 1000 + (30s × 10) + 500 = 1800 × 1.5 = 2700 points
 */

import { Difficulty } from '../../types/game.types';

interface ScoreCalculation {
  baseScore: number;
  timeBonus: number;
  perfectBonus: number;
  subtotal: number;
  difficultyMultiplier: number;
  finalScore: number;
}

export class ScoreSystem {
  private static readonly BASE_SCORE = 1000;
  private static readonly TIME_BONUS_MULTIPLIER = 10;
  private static readonly PERFECT_RUN_BONUS = 500;

  private static readonly DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
    EASY: 1.0,
    NORMAL: 1.5,
    HARD: 2.0,
  };

  private currentScore: number = 0;
  private detectionCount: number = 0;
  private startTime: number = 0;
  private endTime: number = 0;

  /**
   * Initialize score tracking for a new game
   */
  public start(): void {
    this.currentScore = 0;
    this.detectionCount = 0;
    this.startTime = Date.now();
    this.endTime = 0;
  }

  /**
   * Record a detection warning (affects perfect run bonus)
   */
  public recordDetection(): void {
    this.detectionCount++;
  }

  /**
   * Calculate final score when game ends
   * @param remainingTime - Time remaining in seconds
   * @param difficulty - Current difficulty level
   * @returns Detailed score breakdown
   */
  public calculateFinalScore(
    remainingTime: number,
    difficulty: Difficulty
  ): ScoreCalculation {
    this.endTime = Date.now();

    const baseScore = ScoreSystem.BASE_SCORE;
    const timeBonus = Math.floor(remainingTime * ScoreSystem.TIME_BONUS_MULTIPLIER);
    const perfectBonus = this.detectionCount === 0 ? ScoreSystem.PERFECT_RUN_BONUS : 0;
    const subtotal = baseScore + timeBonus + perfectBonus;
    const difficultyMultiplier = ScoreSystem.DIFFICULTY_MULTIPLIERS[difficulty];
    const finalScore = Math.floor(subtotal * difficultyMultiplier);

    this.currentScore = finalScore;

    return {
      baseScore,
      timeBonus,
      perfectBonus,
      subtotal,
      difficultyMultiplier,
      finalScore,
    };
  }

  /**
   * Get the current score
   */
  public getCurrentScore(): number {
    return this.currentScore;
  }

  /**
   * Get detection count
   */
  public getDetectionCount(): number {
    return this.detectionCount;
  }

  /**
   * Check if this was a perfect run
   */
  public isPerfectRun(): boolean {
    return this.detectionCount === 0;
  }

  /**
   * Get play duration in seconds
   */
  public getPlayDuration(): number {
    const duration = this.endTime > 0 ? this.endTime - this.startTime : Date.now() - this.startTime;
    return Math.floor(duration / 1000);
  }

  /**
   * Reset the score system
   */
  public reset(): void {
    this.currentScore = 0;
    this.detectionCount = 0;
    this.startTime = 0;
    this.endTime = 0;
  }
}
