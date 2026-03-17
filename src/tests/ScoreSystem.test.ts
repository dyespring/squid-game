/**
 * ScoreSystem Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreSystem } from '../game/systems/ScoreSystem';

describe('ScoreSystem', () => {
  let scoreSystem: ScoreSystem;

  beforeEach(() => {
    scoreSystem = new ScoreSystem();
  });

  describe('Initialization', () => {
    it('should start with zero score', () => {
      expect(scoreSystem.getCurrentScore()).toBe(0);
    });

    it('should start with zero detections', () => {
      expect(scoreSystem.getDetectionCount()).toBe(0);
    });
  });

  describe('Detection Tracking', () => {
    it('should record detections', () => {
      scoreSystem.start();
      scoreSystem.recordDetection();
      expect(scoreSystem.getDetectionCount()).toBe(1);

      scoreSystem.recordDetection();
      expect(scoreSystem.getDetectionCount()).toBe(2);
    });

    it('should identify perfect run (no detections)', () => {
      scoreSystem.start();
      expect(scoreSystem.isPerfectRun()).toBe(true);

      scoreSystem.recordDetection();
      expect(scoreSystem.isPerfectRun()).toBe(false);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate correct base score', () => {
      scoreSystem.start();
      const result = scoreSystem.calculateFinalScore(0, 'EASY');
      expect(result.baseScore).toBe(1000);
    });

    it('should calculate time bonus correctly', () => {
      scoreSystem.start();
      const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
      expect(result.timeBonus).toBe(300); // 30 * 10
    });

    it('should apply perfect run bonus', () => {
      scoreSystem.start();
      // No detections = perfect run
      const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
      expect(result.perfectBonus).toBe(500);
    });

    it('should not apply perfect bonus with detections', () => {
      scoreSystem.start();
      scoreSystem.recordDetection();
      const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
      expect(result.perfectBonus).toBe(0);
    });

    it('should apply difficulty multipliers correctly', () => {
      scoreSystem.start();
      scoreSystem.recordDetection(); // Add detection to avoid perfect bonus

      // EASY: 1.0x (base 1000, no bonuses)
      const easyResult = scoreSystem.calculateFinalScore(0, 'EASY');
      expect(easyResult.difficultyMultiplier).toBe(1.0);
      expect(easyResult.finalScore).toBe(1000); // 1000 * 1.0

      // Reset for next test
      scoreSystem.reset();
      scoreSystem.start();
      scoreSystem.recordDetection(); // Add detection to avoid perfect bonus

      // NORMAL: 1.5x
      const normalResult = scoreSystem.calculateFinalScore(0, 'NORMAL');
      expect(normalResult.difficultyMultiplier).toBe(1.5);
      expect(normalResult.finalScore).toBe(1500); // 1000 * 1.5

      // Reset for next test
      scoreSystem.reset();
      scoreSystem.start();
      scoreSystem.recordDetection(); // Add detection to avoid perfect bonus

      // HARD: 2.0x
      const hardResult = scoreSystem.calculateFinalScore(0, 'HARD');
      expect(hardResult.difficultyMultiplier).toBe(2.0);
      expect(hardResult.finalScore).toBe(2000); // 1000 * 2.0
    });

    it('should calculate complete score correctly', () => {
      scoreSystem.start();
      // Perfect run on HARD with 45 seconds remaining
      // Base: 1000, Time: 45*10 = 450, Perfect: 500
      // Subtotal: 1950, Multiplier: 2.0
      // Final: 3900
      const result = scoreSystem.calculateFinalScore(45, 'HARD');

      expect(result.baseScore).toBe(1000);
      expect(result.timeBonus).toBe(450);
      expect(result.perfectBonus).toBe(500);
      expect(result.subtotal).toBe(1950);
      expect(result.difficultyMultiplier).toBe(2.0);
      expect(result.finalScore).toBe(3900);
    });

    it('should calculate score with detections correctly', () => {
      scoreSystem.start();
      scoreSystem.recordDetection();
      scoreSystem.recordDetection();

      // NORMAL with 20 seconds, no perfect bonus
      // Base: 1000, Time: 200, Perfect: 0
      // Subtotal: 1200, Multiplier: 1.5
      // Final: 1800
      const result = scoreSystem.calculateFinalScore(20, 'NORMAL');

      expect(result.perfectBonus).toBe(0);
      expect(result.finalScore).toBe(1800);
    });
  });

  describe('Reset', () => {
    it('should reset all values', () => {
      scoreSystem.start();
      scoreSystem.recordDetection();
      scoreSystem.calculateFinalScore(30, 'HARD');

      scoreSystem.reset();

      expect(scoreSystem.getCurrentScore()).toBe(0);
      expect(scoreSystem.getDetectionCount()).toBe(0);
      expect(scoreSystem.isPerfectRun()).toBe(true);
    });
  });
});
