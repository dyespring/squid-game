/**
 * Movement System
 * Handles player movement and input
 */

import Phaser from 'phaser';
import type Player from '../entities/Player';
import type InputManager from '../managers/InputManager';

export default class MovementSystem {
  private player: Player;
  private inputManager: InputManager;

  constructor(_scene: Phaser.Scene, player: Player, inputManager: InputManager) {
    this.player = player;
    this.inputManager = inputManager;
  }

  /**
   * Update player movement based on input
   */
  update(time: number, delta: number): void {
    const isInputActive = this.inputManager.isMovementInputActive();

    if (isInputActive && !this.player.isEliminated) {
      this.player.startMoving();
    } else {
      this.player.stopMoving();
    }

    // Update player
    this.player.update(time, delta);
  }

  /**
   * Check if player reached finish line
   */
  checkFinishLine(finishY: number): boolean {
    return this.player.hasReachedFinish(finishY);
  }
}
