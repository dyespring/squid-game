/**
 * Player Entity
 * The player character with movement physics
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, COLORS } from '../config/constants';

export default class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Ellipse;
  private glow: Phaser.GameObjects.Arc;
  private head: Phaser.GameObjects.Arc;
  private torso: Phaser.GameObjects.Rectangle;
  private leftArm: Phaser.GameObjects.Rectangle;
  private rightArm: Phaser.GameObjects.Rectangle;
  private leftLeg: Phaser.GameObjects.Rectangle;
  private rightLeg: Phaser.GameObjects.Rectangle;
  private velocity: number = 0;
  private targetVelocity: number = 0;
  private lastPosition: Phaser.Math.Vector2;
  private startY: number;
  private dustTimer: number = 0;

  public isMoving: boolean = false;
  public isEliminated: boolean = false;
  public distanceTraveled: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.startY = y;
    this.lastPosition = new Phaser.Math.Vector2(x, y);

    // Shadow
    this.shadow = scene.add.ellipse(0, 28, 30, 10, 0x000000, 0.3);
    this.add(this.shadow);

    // Glow effect (visible when moving)
    this.glow = scene.add.arc(0, 0, 40, 0, 360, false, COLORS.TRACKSUIT_GREEN, 0);
    this.add(this.glow);

    // Create simple person icon
    this.sprite = scene.add.container(0, 0);

    // Head
    this.head = scene.add.arc(0, -16, 8, 0, 360, false, COLORS.TRACKSUIT_GREEN);
    this.head.setStrokeStyle(2, 0x005a42);
    this.sprite.add(this.head);

    // Body
    this.torso = scene.add.rectangle(0, 0, 12, 20, COLORS.TRACKSUIT_GREEN);
    this.torso.setStrokeStyle(2, 0x005a42);
    this.sprite.add(this.torso);

    // Arms
    this.leftArm = scene.add.rectangle(-8, -4, 4, 16, COLORS.TRACKSUIT_GREEN);
    this.leftArm.setStrokeStyle(1, 0x005a42);
    this.leftArm.setOrigin(0.5, 0);
    this.sprite.add(this.leftArm);

    this.rightArm = scene.add.rectangle(8, -4, 4, 16, COLORS.TRACKSUIT_GREEN);
    this.rightArm.setStrokeStyle(1, 0x005a42);
    this.rightArm.setOrigin(0.5, 0);
    this.sprite.add(this.rightArm);

    // Legs
    this.leftLeg = scene.add.rectangle(-4, 10, 5, 18, COLORS.TRACKSUIT_GREEN);
    this.leftLeg.setStrokeStyle(1, 0x005a42);
    this.leftLeg.setOrigin(0.5, 0);
    this.sprite.add(this.leftLeg);

    this.rightLeg = scene.add.rectangle(4, 10, 5, 18, COLORS.TRACKSUIT_GREEN);
    this.rightLeg.setStrokeStyle(1, 0x005a42);
    this.rightLeg.setOrigin(0.5, 0);
    this.sprite.add(this.rightLeg);

    // Add player number on body
    const number = scene.add.text(0, 0, '456', {
      fontSize: '10px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    number.setOrigin(0.5);
    this.sprite.add(number);

    this.add(this.sprite);

    // Add to scene
    scene.add.existing(this);

    console.log('👤 Player created at', x, y);
  }

  /**
   * Start moving forward
   */
  startMoving(): void {
    if (this.isEliminated) return;

    this.isMoving = true;
    this.targetVelocity = GAME_CONSTANTS.PLAYER_BASE_SPEED;

    // Visual feedback - brighten colors
    this.updatePersonColor(COLORS.TRACKSUIT_GREEN, 1);

    // Glow when moving
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.3,
      duration: 200,
    });
  }

  /**
   * Stop moving
   */
  stopMoving(): void {
    this.isMoving = false;
    this.targetVelocity = 0;

    // Visual feedback
    this.updatePersonColor(COLORS.TRACKSUIT_GREEN, 0.9);

    // Remove glow
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0,
      duration: 200,
    });
  }

  /**
   * Update person icon color
   */
  private updatePersonColor(color: number, alpha: number = 1): void {
    this.head.setFillStyle(color, alpha);
    this.torso.setFillStyle(color, alpha);
    this.leftArm.setFillStyle(color, alpha);
    this.rightArm.setFillStyle(color, alpha);
    this.leftLeg.setFillStyle(color, alpha);
    this.rightLeg.setFillStyle(color, alpha);
  }

  /**
   * Update player each frame
   */
  update(_time: number, delta: number): void {
    if (this.isEliminated) return;

    // Store last position for detection
    this.lastPosition.set(this.x, this.y);

    // Smooth acceleration/deceleration
    const accelerationFactor = delta / GAME_CONSTANTS.PLAYER_ACCELERATION_TIME;
    this.velocity = Phaser.Math.Linear(
      this.velocity,
      this.targetVelocity,
      accelerationFactor
    );

    // Apply momentum overshoot when stopping
    if (!this.isMoving && this.velocity > 0) {
      const overshootFactor = delta / GAME_CONSTANTS.PLAYER_MOMENTUM_OVERSHOOT;
      this.velocity = Math.max(0, this.velocity - this.velocity * overshootFactor);
    }

    // Update position (move upward = negative Y)
    const movement = this.velocity * (delta / 1000);
    this.y -= movement;

    // Track distance traveled
    this.distanceTraveled = this.startY - this.y;

    // Keep within horizontal bounds
    const bounds = this.scene.cameras.main;
    this.x = Phaser.Math.Clamp(this.x, 32, bounds.width - 32);

    // Visual feedback when moving
    if (this.velocity > 0) {
      // Animate walking - swing arms and legs
      const walkCycle = Math.sin(Date.now() / 100);
      this.leftArm.angle = walkCycle * 20;
      this.rightArm.angle = -walkCycle * 20;
      this.leftLeg.angle = -walkCycle * 15;
      this.rightLeg.angle = walkCycle * 15;

      // Slight body bounce
      this.sprite.y = Math.sin(Date.now() / 50) * 2;

      // Pulsing glow
      this.glow.scale = 1 + Math.sin(Date.now() / 200) * 0.1;

      // Dust particles (emit periodically)
      this.dustTimer += delta;
      if (this.dustTimer >= 100) {
        this.scene.events.emit('player-emit-dust', { x: this.x, y: this.y });
        this.dustTimer = 0;
      }
    } else {
      // Reset to neutral pose
      this.leftArm.angle = 0;
      this.rightArm.angle = 0;
      this.leftLeg.angle = 0;
      this.rightLeg.angle = 0;
      this.sprite.y = 0;
      this.glow.scale = 1;
    }
  }

  /**
   * Get movement delta for detection system
   */
  getMovementDelta(): number {
    return Math.abs(this.y - this.lastPosition.y);
  }

  /**
   * Check if player reached finish line
   */
  hasReachedFinish(finishY: number): boolean {
    return this.y <= finishY;
  }

  /**
   * Eliminate player (game over)
   */
  eliminate(): void {
    console.log('💀 Player eliminated');
    this.isEliminated = true;
    this.stopMoving();

    // Visual feedback - turn red
    this.updatePersonColor(COLORS.DANGER_RED, 1);
    this.glow.setFillStyle(COLORS.DANGER_RED);
    this.glow.setAlpha(0.8);

    // Flash animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 3,
    });

    // Scale down animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 400,
      ease: 'Power2',
    });

    // Emit elimination particles
    this.scene.events.emit('player-eliminated', { x: this.x, y: this.y });
  }

  /**
   * Victory animation
   */
  playVictoryAnimation(): void {
    console.log('🎉 Player victory!');

    // Glow effect
    this.glow.setFillStyle(0xffd700); // Gold
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.8,
      scale: 1.5,
      duration: 500,
    });

    // Scale up animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 400,
      yoyo: true,
      ease: 'Back.easeOut',
      repeat: 1,
    });

    // Jump animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      duration: 300,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Emit victory confetti
    this.scene.events.emit('player-victory', { x: this.x, y: this.y });
  }

  /**
   * Reset player to starting position
   */
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.velocity = 0;
    this.targetVelocity = 0;
    this.isMoving = false;
    this.isEliminated = false;
    this.distanceTraveled = 0;
    this.lastPosition.set(x, y);
    this.updatePersonColor(COLORS.TRACKSUIT_GREEN, 1);
    this.sprite.setAlpha(1);
    this.leftArm.angle = 0;
    this.rightArm.angle = 0;
    this.leftLeg.angle = 0;
    this.rightLeg.angle = 0;
    this.sprite.y = 0;
  }
}
