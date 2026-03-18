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
  private fakeTurnCooldown: number = 0;
  private isCycleStopped: boolean = false;

  public isFacingPlayers: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DifficultyConfig) {
    super(scene, x, y);
    this.config = config;

    this.bodySprite = scene.add.container(0, 0);

    const dressGfx = scene.add.graphics();

    // Layered dress body
    dressGfx.fillStyle(0xFF6B9D, 1);
    dressGfx.fillTriangle(-35, 15, 35, 15, 42, 68);
    dressGfx.fillTriangle(-35, 15, -42, 68, 42, 68);

    // Dress overlay pattern (darker stripe)
    dressGfx.fillStyle(0xF05888, 0.4);
    dressGfx.fillTriangle(-20, 30, 20, 30, 25, 68);
    dressGfx.fillTriangle(-20, 30, -25, 68, 25, 68);

    // Dress outline
    dressGfx.lineStyle(3, 0xFF4581, 1);
    dressGfx.strokeTriangle(-35, 15, 35, 15, 42, 68);
    dressGfx.strokeTriangle(-35, 15, -42, 68, 42, 68);

    // Scalloped hem — decorative arcs along the bottom
    dressGfx.lineStyle(2, 0xFFFFFF, 0.5);
    for (let i = 0; i < 6; i++) {
      const sx = -38 + i * 16;
      dressGfx.beginPath();
      dressGfx.arc(sx + 8, 68, 8, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
      dressGfx.strokePath();
    }

    // White collar with rounded shape
    dressGfx.fillStyle(0xFFFFFF, 1);
    dressGfx.fillRoundedRect(-28, 8, 56, 12, 4);
    dressGfx.lineStyle(2, 0xFFDDEE, 1);
    dressGfx.strokeRoundedRect(-28, 8, 56, 12, 4);
    // Collar ribbon
    dressGfx.fillStyle(0xFF4581, 1);
    dressGfx.fillTriangle(-4, 12, 4, 12, 0, 22);

    this.bodySprite.add(dressGfx);

    // Arms with hands
    const armsGfx = scene.add.graphics();
    // Left arm
    armsGfx.fillStyle(0xFFCCCC, 1);
    armsGfx.fillRoundedRect(-48, 20, 14, 36, 5);
    armsGfx.lineStyle(2, 0xFFAAAA, 1);
    armsGfx.strokeRoundedRect(-48, 20, 14, 36, 5);
    armsGfx.fillStyle(0xFFDDCC, 1);
    armsGfx.fillCircle(-41, 58, 6);
    // Right arm
    armsGfx.fillStyle(0xFFCCCC, 1);
    armsGfx.fillRoundedRect(34, 20, 14, 36, 5);
    armsGfx.lineStyle(2, 0xFFAAAA, 1);
    armsGfx.strokeRoundedRect(34, 20, 14, 36, 5);
    armsGfx.fillStyle(0xFFDDCC, 1);
    armsGfx.fillCircle(41, 58, 6);
    this.bodySprite.add(armsGfx);

    this.add(this.bodySprite);

    // Head
    this.head = scene.add.arc(0, -25, 36, 0, 360, false, 0xFFDDCC);
    this.head.setStrokeStyle(3, 0xFFCCBB);
    this.add(this.head);

    // Hair band
    const bandGfx = scene.add.graphics();
    bandGfx.fillStyle(0xFF4581, 1);
    bandGfx.fillRoundedRect(-20, -50, 40, 6, 3);
    this.add(bandGfx);

    // Pigtails — larger with gradient feel
    const leftPig = scene.add.graphics();
    leftPig.fillStyle(0x8B4513, 1);
    leftPig.fillCircle(-28, -30, 16);
    leftPig.fillStyle(0x7A3B10, 1);
    leftPig.fillCircle(-28, -26, 10);
    leftPig.lineStyle(2, 0x654321, 1);
    leftPig.strokeCircle(-28, -30, 16);
    this.add(leftPig);

    const rightPig = scene.add.graphics();
    rightPig.fillStyle(0x8B4513, 1);
    rightPig.fillCircle(28, -30, 16);
    rightPig.fillStyle(0x7A3B10, 1);
    rightPig.fillCircle(28, -26, 10);
    rightPig.lineStyle(2, 0x654321, 1);
    rightPig.strokeCircle(28, -30, 16);
    this.add(rightPig);

    // Hair top
    const hairTop = scene.add.arc(0, -45, 22, Phaser.Math.DegToRad(180), 0, true, 0x8B4513);
    hairTop.setStrokeStyle(2, 0x654321);
    this.add(hairTop);

    // Eye glow (hidden initially)
    this.eyeGlow = scene.add.arc(0, -28, 20, 0, 360, false, COLORS.DANGER_RED, 0);
    this.add(this.eyeGlow);

    // Eyes with iris detail
    this.eyes = scene.add.group();
    [-12, 12].forEach(ex => {
      const eyeWhite = scene.add.arc(ex, -28, 7, 0, 360, false, 0xFFFFFF);
      eyeWhite.setStrokeStyle(1.5, 0xcccccc);
      this.add(eyeWhite);

      const iris = scene.add.arc(ex, -28, 4, 0, 360, false, COLORS.GEOMETRIC_BLACK);
      iris.setStrokeStyle(1, 0x000000);
      this.add(iris);
      this.eyes.add(iris);

      const pupilHighlight = scene.add.arc(ex + 1.5, -29.5, 1.5, 0, 360, false, 0xFFFFFF, 0.8);
      this.add(pupilHighlight);
    });

    // Smile
    const smileGfx = scene.add.graphics();
    smileGfx.lineStyle(2.5, 0xFF6B9D, 1);
    smileGfx.beginPath();
    smileGfx.arc(0, -15, 12, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
    smileGfx.strokePath();
    this.add(smileGfx);

    // Rosy cheeks with gradient
    const cheekGfx = scene.add.graphics();
    cheekGfx.fillStyle(0xFFB6C1, 0.5);
    cheekGfx.fillCircle(-20, -19, 9);
    cheekGfx.fillCircle(20, -19, 9);
    cheekGfx.fillStyle(0xFFB6C1, 0.25);
    cheekGfx.fillCircle(-20, -19, 12);
    cheekGfx.fillCircle(20, -19, 12);
    this.add(cheekGfx);

    scene.add.existing(this);
    this.angle = 180;
  }

  update(_time: number, delta: number): void {
    this.stateTimer -= delta;

    switch (this.currentState) {
      case DollState.FACING_AWAY:
        if (this.stateTimer <= 0) {
          this.startTurningToFace();
        } else if (this.config.fakeTurns) {
          this.fakeTurnCooldown -= delta;
          if (this.fakeTurnCooldown <= 0 && this.stateTimer > 1500) {
            this.attemptFakeTurn();
          }
        }
        break;
      case DollState.TURNING_TO_FACE:
      case DollState.TURNING_AWAY:
        break;
      case DollState.FACING_PLAYERS:
        if (this.stateTimer <= 0) {
          this.startTurningAway();
        }
        break;
    }
  }

  startFacingAway(): void {
    this.currentState = DollState.FACING_AWAY;
    this.isFacingPlayers = false;

    const [min, max] = this.config.greenLightDuration;
    this.stateTimer = Phaser.Math.Between(min, max);

    this.eyes.getChildren().forEach((eye) => {
      (eye as Phaser.GameObjects.Arc).setFillStyle(COLORS.GEOMETRIC_BLACK);
    });

    this.scene.tweens.add({
      targets: this.eyeGlow,
      alpha: 0,
      duration: 200,
    });

    if (this.scanLaser) {
      this.scanLaser.destroy();
      this.scanLaser = null;
    }

    this.fakeTurnCooldown = Phaser.Math.Between(1500, 3000);
    this.scene.events.emit('doll-green-light', { duration: this.stateTimer });
  }

  private attemptFakeTurn(): void {
    if (Math.random() > 0.35) {
      this.fakeTurnCooldown = Phaser.Math.Between(2000, 4000);
      return;
    }

    this.fakeTurnCooldown = Phaser.Math.Between(3000, 5000);
    this.scene.events.emit('doll-turning-to-face');

    const partialAngle = 180 - Phaser.Math.Between(30, 70);
    this.scene.tweens.add({
      targets: this,
      angle: partialAngle,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.isCycleStopped) return;
        this.scene.tweens.add({
          targets: this,
          angle: 180,
          duration: 200,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (this.isCycleStopped) return;
            this.scene.events.emit('doll-turning-away');
          },
        });
      },
    });
  }

  private startTurningToFace(): void {
    this.currentState = DollState.TURNING_TO_FACE;

    this.scene.tweens.add({
      targets: this.bodySprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: GAME_CONSTANTS.DOLL_TURN_DURATION / 2,
      yoyo: true,
    });

    this.scene.events.emit('doll-turning-to-face');

    this.scene.tweens.add({
      targets: this,
      angle: 0,
      duration: GAME_CONSTANTS.DOLL_TURN_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startFacingPlayers();
      },
    });
  }

  private startFacingPlayers(): void {
    this.currentState = DollState.FACING_PLAYERS;
    this.isFacingPlayers = true;

    const [min, max] = this.config.redLightDuration;
    this.stateTimer = Phaser.Math.Between(min, max);

    this.eyes.getChildren().forEach((eye) => {
      (eye as Phaser.GameObjects.Arc).setFillStyle(COLORS.DANGER_RED);
    });

    this.scene.tweens.add({
      targets: this.eyeGlow,
      alpha: 0.6,
      duration: 300,
    });

    this.scene.tweens.add({
      targets: this.eyeGlow,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

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

    this.scene.tweens.add({
      targets: this.scanLaser,
      y: 100,
      duration: this.stateTimer / 2,
      yoyo: true,
      ease: 'Linear',
    });

    this.scene.events.emit('doll-red-light', { duration: this.stateTimer });
  }

  private startTurningAway(): void {
    this.currentState = DollState.TURNING_AWAY;
    this.scene.events.emit('doll-turning-away');

    this.scene.tweens.add({
      targets: this,
      angle: 180,
      duration: GAME_CONSTANTS.DOLL_TURN_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.startFacingAway();
      },
    });
  }

  startCycle(): void {
    this.isCycleStopped = false;
    this.startFacingAway();
  }

  stopCycle(): void {
    this.isCycleStopped = true;
    this.stateTimer = 0;
  }

  isFacing(): boolean {
    return this.isFacingPlayers && this.currentState === DollState.FACING_PLAYERS;
  }
}
