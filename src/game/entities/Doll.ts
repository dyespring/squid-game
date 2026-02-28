/**
 * Doll Entity
 * The giant doll that turns around and detects movement
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, COLORS } from '../config/constants';
import type { DifficultyConfig } from '@/types/game.types';

enum DollState {
  FACING_AWAY = 'FACING_AWAY',
  TURNING_TO_FACE = 'TURNING_TO_FACE',
  FACING_PLAYERS = 'FACING_PLAYERS',
  TURNING_AWAY = 'TURNING_AWAY',
}

export default class Doll extends Phaser.GameObjects.Container {
  private head: Phaser.GameObjects.Arc;
  private bodySprite: Phaser.GameObjects.Container;
  private eyes: Phaser.GameObjects.Group;
  private eyeGlow: Phaser.GameObjects.Arc;
  private scanLaser: Phaser.GameObjects.Rectangle | null = null;
  private currentState: DollState = DollState.FACING_AWAY;
  private stateTimer: number = 0;
  private config: DifficultyConfig;
  private leftPigtail: Phaser.GameObjects.Arc;
  private rightPigtail: Phaser.GameObjects.Arc;
  private dress: Phaser.GameObjects.Graphics;
  private arms: Phaser.GameObjects.Graphics;

  public isFacingPlayers: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DifficultyConfig) {
    super(scene, x, y);

    this.config = config;

    // Create visual representation - improved doll
    this.bodySprite = scene.add.container(0, 0);

    // Dress (trapezoid shape)
    this.dress = scene.add.graphics();
    this.dress.fillStyle(0xFF6B9D, 1); // Pink dress
    this.dress.fillTriangle(-35, 15, 35, 15, 40, 65);
    this.dress.fillTriangle(-35, 15, -40, 65, 40, 65);
    this.dress.lineStyle(3, 0xFF4581, 1);
    this.dress.strokeTriangle(-35, 15, 35, 15, 40, 65);
    this.dress.strokeTriangle(-35, 15, -40, 65, 40, 65);
    // Add white collar
    this.dress.fillStyle(0xFFFFFF, 1);
    this.dress.fillRect(-25, 10, 50, 8);
    this.dress.lineStyle(2, 0xFFCCDD, 1);
    this.dress.strokeRect(-25, 10, 50, 8);
    this.bodySprite.add(this.dress);

    // Arms
    this.arms = scene.add.graphics();
    this.arms.fillStyle(0xFFCCCC, 1); // Skin color
    // Left arm
    this.arms.fillRect(-45, 20, 12, 35);
    this.arms.lineStyle(2, 0xFFAAAA, 1);
    this.arms.strokeRect(-45, 20, 12, 35);
    // Right arm
    this.arms.fillStyle(0xFFCCCC, 1);
    this.arms.fillRect(33, 20, 12, 35);
    this.arms.lineStyle(2, 0xFFAAAA, 1);
    this.arms.strokeRect(33, 20, 12, 35);
    this.bodySprite.add(this.arms);

    this.add(this.bodySprite);

    // Head - larger
    this.head = scene.add.arc(0, -25, 35, 0, 360, false, 0xFFDDCC);
    this.head.setStrokeStyle(3, 0xFFCCBB);
    this.add(this.head);

    // Pigtails
    this.leftPigtail = scene.add.arc(-25, -30, 15, 0, 360, false, 0x8B4513);
    this.leftPigtail.setStrokeStyle(2, 0x654321);
    this.add(this.leftPigtail);

    this.rightPigtail = scene.add.arc(25, -30, 15, 0, 360, false, 0x8B4513);
    this.rightPigtail.setStrokeStyle(2, 0x654321);
    this.add(this.rightPigtail);

    // Hair top
    const hairTop = scene.add.arc(0, -45, 20, 180 * Math.PI / 180, 0, true, 0x8B4513);
    hairTop.setStrokeStyle(2, 0x654321);
    this.add(hairTop);

    // Eye glow (hidden initially)
    this.eyeGlow = scene.add.arc(0, -28, 18, 0, 360, false, COLORS.DANGER_RED, 0);
    this.add(this.eyeGlow);

    // Eyes (will be red when facing players)
    this.eyes = scene.add.group();
    const leftEye = scene.add.arc(-12, -28, 6, 0, 360, false, COLORS.GEOMETRIC_BLACK);
    leftEye.setStrokeStyle(1, 0x000000);
    const rightEye = scene.add.arc(12, -28, 6, 0, 360, false, COLORS.GEOMETRIC_BLACK);
    rightEye.setStrokeStyle(1, 0x000000);
    this.add(leftEye);
    this.add(rightEye);
    this.eyes.add(leftEye);
    this.eyes.add(rightEye);

    // Smile (simple arc)
    const smile = scene.add.arc(0, -15, 10, 0, Math.PI, false);
    smile.setStrokeStyle(2, 0xFF6B9D, 1);
    smile.isFilled = false;
    this.add(smile);

    // Rosy cheeks
    const leftCheek = scene.add.arc(-18, -20, 8, 0, 360, false, 0xFFB6C1, 0.4);
    const rightCheek = scene.add.arc(18, -20, 8, 0, 360, false, 0xFFB6C1, 0.4);
    this.add(leftCheek);
    this.add(rightCheek);

    // Add to scene
    scene.add.existing(this);

    // Start in facing away state
    this.angle = 180; // Face away initially

    console.log('🎎 Doll created');
  }

  /**
   * Update doll state machine
   */
  update(_time: number, delta: number): void {
    this.stateTimer -= delta;

    switch (this.currentState) {
      case DollState.FACING_AWAY:
        if (this.stateTimer <= 0) {
          this.startTurningToFace();
        }
        break;

      case DollState.TURNING_TO_FACE:
        // Animation handled by tween
        break;

      case DollState.FACING_PLAYERS:
        if (this.stateTimer <= 0) {
          this.startTurningAway();
        }
        break;

      case DollState.TURNING_AWAY:
        // Animation handled by tween
        break;
    }
  }

  /**
   * Start a new cycle - doll faces away (green light)
   */
  startFacingAway(): void {
    this.currentState = DollState.FACING_AWAY;
    this.isFacingPlayers = false;

    // Random duration for green light
    const [min, max] = this.config.greenLightDuration;
    this.stateTimer = Phaser.Math.Between(min, max);

    // Visual feedback
    this.eyes.getChildren().forEach((eye) => {
      (eye as Phaser.GameObjects.Arc).setFillStyle(COLORS.GEOMETRIC_BLACK);
    });

    // Remove eye glow
    this.scene.tweens.add({
      targets: this.eyeGlow,
      alpha: 0,
      duration: 200,
    });

    // Remove scan laser if it exists
    if (this.scanLaser) {
      this.scanLaser.destroy();
      this.scanLaser = null;
    }

    console.log(`🟢 GREEN LIGHT for ${(this.stateTimer / 1000).toFixed(1)}s`);

    // Emit event
    this.scene.events.emit('doll-green-light', { duration: this.stateTimer });
  }

  /**
   * Start turning to face players (transition to red light)
   */
  private startTurningToFace(): void {
    this.currentState = DollState.TURNING_TO_FACE;

    console.log('🔄 Doll turning to face...');

    // Pulse body during turn
    this.scene.tweens.add({
      targets: this.bodySprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: GAME_CONSTANTS.DOLL_TURN_DURATION / 2,
      yoyo: true,
    });

    // Emit warning event
    this.scene.events.emit('doll-turning-to-face');

    // Rotation animation with ease
    this.scene.tweens.add({
      targets: this,
      angle: 0, // Face players
      duration: GAME_CONSTANTS.DOLL_TURN_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startFacingPlayers();
      },
    });
  }

  /**
   * Doll is now facing players (red light)
   */
  private startFacingPlayers(): void {
    this.currentState = DollState.FACING_PLAYERS;
    this.isFacingPlayers = true;

    // Random duration for red light
    const [min, max] = this.config.redLightDuration;
    this.stateTimer = Phaser.Math.Between(min, max);

    // Visual feedback - red eyes
    this.eyes.getChildren().forEach((eye) => {
      (eye as Phaser.GameObjects.Arc).setFillStyle(COLORS.DANGER_RED);
    });

    // Eye glow effect
    this.scene.tweens.add({
      targets: this.eyeGlow,
      alpha: 0.6,
      duration: 300,
    });

    // Pulsing eye glow
    this.scene.tweens.add({
      targets: this.eyeGlow,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Create scanning laser effect
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    this.scanLaser = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight - 100,
      screenWidth,
      3,
      COLORS.DANGER_RED,
      0.8
    );
    this.scanLaser.setDepth(75);

    // Animate laser scanning up and down
    this.scene.tweens.add({
      targets: this.scanLaser,
      y: 100,
      duration: this.stateTimer / 2,
      yoyo: true,
      ease: 'Linear',
    });

    console.log(`🔴 RED LIGHT for ${(this.stateTimer / 1000).toFixed(1)}s`);

    // Emit event
    this.scene.events.emit('doll-red-light', { duration: this.stateTimer });
  }

  /**
   * Start turning away (back to green light)
   */
  private startTurningAway(): void {
    this.currentState = DollState.TURNING_AWAY;

    console.log('🔄 Doll turning away...');

    // Emit event
    this.scene.events.emit('doll-turning-away');

    // Rotation animation
    this.scene.tweens.add({
      targets: this,
      angle: 180, // Face away
      duration: GAME_CONSTANTS.DOLL_TURN_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.startFacingAway();
      },
    });
  }

  /**
   * Start the doll's cycle
   */
  startCycle(): void {
    console.log('🎎 Starting doll cycle');
    this.startFacingAway();
  }

  /**
   * Stop the doll's cycle
   */
  stopCycle(): void {
    console.log('🎎 Stopping doll cycle');
    this.stateTimer = 0;
  }

  /**
   * Check if doll is currently facing players (red light)
   */
  isFacing(): boolean {
    return this.isFacingPlayers && this.currentState === DollState.FACING_PLAYERS;
  }
}
