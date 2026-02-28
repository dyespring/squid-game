/**
 * Detection System
 * Detects player movement during red light
 */

import Phaser from 'phaser';
import { COLORS } from '../config/constants';
import type { DifficultyConfig } from '@/types/game.types';
import type Player from '../entities/Player';

export default class DetectionSystem {
  private scene: Phaser.Scene;
  private threshold: number;

  constructor(scene: Phaser.Scene, config: DifficultyConfig) {
    this.scene = scene;
    this.threshold = config.detectionThreshold;

    console.log(`🔍 Detection System: threshold = ${this.threshold} px/frame`);
  }

  /**
   * Check if player is moving during red light
   * Returns true if caught
   */
  checkPlayer(player: Player, isRedLight: boolean): boolean {
    // Only check during red light
    if (!isRedLight || player.isEliminated) {
      return false;
    }

    // Get movement delta from player
    const movementDelta = player.getMovementDelta();

    // Check against threshold
    if (movementDelta > this.threshold) {
      console.log(`🚨 Player caught! Movement: ${movementDelta.toFixed(3)} > ${this.threshold}`);
      this.handleDetection(player);
      return true;
    }

    return false;
  }

  /**
   * Handle detection - visual and audio feedback
   */
  private handleDetection(player: Player): void {
    // Create spotlight on caught player
    this.createSpotlight(player.x, player.y);

    // Camera shake
    this.scene.cameras.main.shake(
      COLORS.DANGER_RED ? 500 : 500,
      0.01
    );

    // Emit detection event
    this.scene.events.emit('player-detected', { player });
  }

  /**
   * Create red spotlight effect on detected player
   */
  private createSpotlight(x: number, y: number): void {
    const spotlight = this.scene.add.circle(x, y, 60, COLORS.DANGER_RED, 0.5);

    // Pulse animation
    this.scene.tweens.add({
      targets: spotlight,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => spotlight.destroy(),
    });
  }
}
