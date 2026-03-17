/**
 * HighScoreManager Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HighScoreManager } from '../game/managers/HighScoreManager';
import type { HighScoreEntry } from '../game/managers/HighScoreManager';

describe('HighScoreManager', () => {
  let manager: HighScoreManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new HighScoreManager();
  });

  describe('Initialization', () => {
    it('should initialize with empty high scores', () => {
      const allScores = manager.getAllHighScores();
      expect(allScores.EASY).toHaveLength(0);
      expect(allScores.NORMAL).toHaveLength(0);
      expect(allScores.HARD).toHaveLength(0);
    });

    it('should return null for top score when empty', () => {
      expect(manager.getTopScore('EASY')).toBeNull();
      expect(manager.getTopScore('NORMAL')).toBeNull();
      expect(manager.getTopScore('HARD')).toBeNull();
    });
  });

  describe('Adding Scores', () => {
    it('should add a score to the correct difficulty', () => {
      const entry: HighScoreEntry = {
        score: 1500,
        difficulty: 'NORMAL',
        timestamp: Date.now(),
        isPerfect: true,
        playDuration: 45,
      };

      const position = manager.addScore(entry);
      expect(position).toBe(1);

      const scores = manager.getHighScores('NORMAL');
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(1500);
    });

    it('should sort scores in descending order', () => {
      manager.addScore({
        score: 1000,
        difficulty: 'EASY',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 60,
      });

      manager.addScore({
        score: 2000,
        difficulty: 'EASY',
        timestamp: Date.now() + 1,
        isPerfect: true,
        playDuration: 45,
      });

      manager.addScore({
        score: 1500,
        difficulty: 'EASY',
        timestamp: Date.now() + 2,
        isPerfect: false,
        playDuration: 50,
      });

      const scores = manager.getHighScores('EASY');
      expect(scores[0].score).toBe(2000);
      expect(scores[1].score).toBe(1500);
      expect(scores[2].score).toBe(1000);
    });

    it('should limit to top 10 scores per difficulty', () => {
      // Add 12 scores
      for (let i = 0; i < 12; i++) {
        manager.addScore({
          score: (i + 1) * 100,
          difficulty: 'NORMAL',
          timestamp: Date.now() + i,
          isPerfect: false,
          playDuration: 60,
        });
      }

      const scores = manager.getHighScores('NORMAL');
      expect(scores).toHaveLength(10);
      expect(scores[0].score).toBe(1200); // Highest
      expect(scores[9].score).toBe(300); // 10th place
    });

    it('should return correct leaderboard position', () => {
      manager.addScore({
        score: 1000,
        difficulty: 'HARD',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 60,
      });

      const position = manager.addScore({
        score: 1500,
        difficulty: 'HARD',
        timestamp: Date.now() + 1,
        isPerfect: true,
        playDuration: 45,
      });

      expect(position).toBe(1); // New high score
    });

    it('should return null for scores below top 10', () => {
      // Fill with 10 high scores
      for (let i = 0; i < 10; i++) {
        manager.addScore({
          score: (10 - i) * 1000,
          difficulty: 'EASY',
          timestamp: Date.now() + i,
          isPerfect: false,
          playDuration: 60,
        });
      }

      // Add a lower score
      const position = manager.addScore({
        score: 500,
        difficulty: 'EASY',
        timestamp: Date.now() + 100,
        isPerfect: false,
        playDuration: 70,
      });

      expect(position).toBeNull();
    });
  });

  describe('High Score Queries', () => {
    beforeEach(() => {
      // Add some test data
      manager.addScore({
        score: 3000,
        difficulty: 'HARD',
        timestamp: Date.now(),
        isPerfect: true,
        playDuration: 30,
      });

      manager.addScore({
        score: 2000,
        difficulty: 'NORMAL',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 45,
      });

      manager.addScore({
        score: 1000,
        difficulty: 'EASY',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 60,
      });
    });

    it('should return top score for a difficulty', () => {
      const topHard = manager.getTopScore('HARD');
      expect(topHard?.score).toBe(3000);

      const topNormal = manager.getTopScore('NORMAL');
      expect(topNormal?.score).toBe(2000);
    });

    it('should correctly identify high scores', () => {
      expect(manager.isHighScore(3500, 'HARD')).toBe(true);
      expect(manager.isHighScore(2500, 'HARD')).toBe(true);
      expect(manager.isHighScore(500, 'EASY')).toBe(true); // Only 1 score, so any new is high
    });

    it('should return difficulty statistics', () => {
      // Add more scores for better stats
      manager.addScore({
        score: 2500,
        difficulty: 'HARD',
        timestamp: Date.now() + 1,
        isPerfect: false,
        playDuration: 40,
      });

      const stats = manager.getDifficultyStats('HARD');
      expect(stats.gamesPlayed).toBe(2);
      expect(stats.highestScore).toBe(3000);
      expect(stats.averageScore).toBe(2750);
      expect(stats.perfectRuns).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should save scores to localStorage', () => {
      manager.addScore({
        score: 1500,
        difficulty: 'NORMAL',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 50,
      });

      const stored = localStorage.getItem('squid_game_high_scores');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.NORMAL).toHaveLength(1);
      expect(parsed.NORMAL[0].score).toBe(1500);
    });

    it('should load scores from localStorage', () => {
      // Manually set localStorage
      const testData = {
        EASY: [
          {
            score: 1000,
            difficulty: 'EASY',
            timestamp: Date.now(),
            isPerfect: true,
            playDuration: 60,
          },
        ],
        NORMAL: [],
        HARD: [],
      };

      localStorage.setItem('squid_game_high_scores', JSON.stringify(testData));

      // Create new manager instance (should load from storage)
      const newManager = new HighScoreManager();
      const scores = newManager.getHighScores('EASY');
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(1000);
    });
  });

  describe('Clear Operations', () => {
    beforeEach(() => {
      manager.addScore({
        score: 1000,
        difficulty: 'EASY',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 60,
      });

      manager.addScore({
        score: 2000,
        difficulty: 'NORMAL',
        timestamp: Date.now(),
        isPerfect: false,
        playDuration: 50,
      });
    });

    it('should clear all scores', () => {
      manager.clearAllScores();

      expect(manager.getAllHighScores().EASY).toHaveLength(0);
      expect(manager.getAllHighScores().NORMAL).toHaveLength(0);
      expect(manager.getAllHighScores().HARD).toHaveLength(0);
    });

    it('should clear specific difficulty scores', () => {
      manager.clearDifficultyScores('EASY');

      expect(manager.getHighScores('EASY')).toHaveLength(0);
      expect(manager.getHighScores('NORMAL')).toHaveLength(1);
    });
  });

  describe('Import/Export', () => {
    it('should export scores as JSON', () => {
      manager.addScore({
        score: 1500,
        difficulty: 'NORMAL',
        timestamp: Date.now(),
        isPerfect: true,
        playDuration: 45,
      });

      const exported = manager.exportScores();
      expect(exported).toBeTruthy();

      const parsed = JSON.parse(exported);
      expect(parsed.NORMAL).toHaveLength(1);
      expect(parsed.NORMAL[0].score).toBe(1500);
    });

    it('should import scores from JSON', () => {
      const testData = {
        EASY: [
          {
            score: 2000,
            difficulty: 'EASY',
            timestamp: Date.now(),
            isPerfect: true,
            playDuration: 40,
          },
        ],
        NORMAL: [],
        HARD: [],
      };

      const success = manager.importScores(JSON.stringify(testData));
      expect(success).toBe(true);

      const scores = manager.getHighScores('EASY');
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(2000);
    });

    it('should reject invalid JSON import', () => {
      const success = manager.importScores('invalid json');
      expect(success).toBe(false);
    });
  });
});
