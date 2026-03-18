/**
 * NPC Entity
 * Non-player character with AI behavior
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, COLORS } from '../config/constants';

const TRACKSUIT = COLORS.TRACKSUIT_GREEN;
const TRACKSUIT_DARK = 0x005a42;
const SKIN = 0xffccaa;
const SKIN_DARK = 0xe6b090;
const SHOE_COLOR = 0x333333;

export default class NPC extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Ellipse;
  private bodyGfx: Phaser.GameObjects.Graphics;
  private leftArm: Phaser.GameObjects.Graphics;
  private rightArm: Phaser.GameObjects.Graphics;
  private leftLeg: Phaser.GameObjects.Graphics;
  private rightLeg: Phaser.GameObjects.Graphics;
  private velocity: number = 0;
  private targetVelocity: number = 0;
  private lastPosition: Phaser.Math.Vector2;
  private startY: number;
  private movementTimer: number = 0;
  private movementDuration: number = 0;
  private isAIMoving: boolean = false;
  private reactionTime: number = 0;

  public isMoving: boolean = false;
  public isEliminated: boolean = false;
  public distanceTraveled: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, _playerNumber: number) {
    super(scene, x, y);

    this.startY = y;
    this.lastPosition = new Phaser.Math.Vector2(x, y);
    this.reactionTime = 100 + Math.random() * 300;

    this.shadow = scene.add.ellipse(0, 30, 34, 10, 0x000000, 0.2);
    this.add(this.shadow);

    this.sprite = scene.add.container(0, 0);

    this.leftLeg = scene.add.graphics();
    this.rightLeg = scene.add.graphics();
    this.drawLeg(this.leftLeg, -5);
    this.drawLeg(this.rightLeg, 5);
    this.sprite.add(this.leftLeg);
    this.sprite.add(this.rightLeg);

    this.bodyGfx = scene.add.graphics();
    this.drawBody(this.bodyGfx);
    this.sprite.add(this.bodyGfx);

    this.leftArm = scene.add.graphics();
    this.rightArm = scene.add.graphics();
    this.drawArm(this.leftArm, -1);
    this.drawArm(this.rightArm, 1);
    this.sprite.add(this.leftArm);
    this.sprite.add(this.rightArm);

    this.add(this.sprite);
    scene.add.existing(this);

    const sizeVariation = 0.9 + Math.random() * 0.2;
    this.setScale(sizeVariation);
  }

  private drawBody(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(TRACKSUIT, 1);
    g.fillRoundedRect(-9, -8, 18, 24, 4);
    g.lineStyle(1.5, TRACKSUIT_DARK, 1);
    g.strokeRoundedRect(-9, -8, 18, 24, 4);

    g.fillStyle(0xffffff, 1);
    g.fillTriangle(-5, -8, 5, -8, 0, -2);

    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(0, 4, 7);
    g.lineStyle(1, TRACKSUIT_DARK, 0.5);
    g.strokeCircle(0, 4, 7);

    g.fillStyle(SKIN, 1);
    g.fillCircle(0, -20, 10);
    g.lineStyle(1.5, SKIN_DARK, 1);
    g.strokeCircle(0, -20, 10);

    g.fillStyle(0x2a1a0a, 1);
    g.fillEllipse(0, -25, 18, 10);

    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(-3, -21, 1.5);
    g.fillCircle(3, -21, 1.5);
  }

  private drawArm(g: Phaser.GameObjects.Graphics, side: number): void {
    const x = side * 11;
    g.fillStyle(TRACKSUIT, 1);
    g.fillRoundedRect(x - 3, -6, 6, 18, 3);
    g.lineStyle(1, TRACKSUIT_DARK, 1);
    g.strokeRoundedRect(x - 3, -6, 6, 18, 3);
    g.fillStyle(SKIN, 1);
    g.fillCircle(x, 14, 3);
  }

  private drawLeg(g: Phaser.GameObjects.Graphics, xOffset: number): void {
    g.fillStyle(TRACKSUIT, 1);
    g.fillRoundedRect(xOffset - 3.5, 14, 7, 18, 3);
    g.lineStyle(1, TRACKSUIT_DARK, 1);
    g.strokeRoundedRect(xOffset - 3.5, 14, 7, 18, 3);
    g.fillStyle(SHOE_COLOR, 1);
    g.fillRoundedRect(xOffset - 4, 30, 8, 5, 2);
  }

  updateAI(isGreenLight: boolean, delta: number): void {
    if (this.isEliminated) return;

    if (isGreenLight) {
      this.movementTimer += delta;

      if (!this.isAIMoving && this.movementTimer >= this.reactionTime) {
        if (Math.random() < 0.7) {
          this.isAIMoving = true;
          this.movementDuration = 300 + Math.random() * 1500;
          this.movementTimer = 0;
          this.startMoving();
        } else {
          this.movementTimer = 0;
          this.reactionTime = 200 + Math.random() * 600;
        }
      } else if (this.isAIMoving && this.movementTimer >= this.movementDuration) {
        this.isAIMoving = false;
        this.movementTimer = 0;
        this.reactionTime = 100 + Math.random() * 400;
        this.stopMoving();
      }
    } else {
      const reactionDelay = Math.random() * this.reactionTime;
      if (reactionDelay < 50) {
        this.isAIMoving = false;
        this.stopMoving();
      } else {
        this.scene.time.delayedCall(reactionDelay, () => {
          this.isAIMoving = false;
          this.stopMoving();
        });
      }
    }
  }

  startMoving(): void {
    if (this.isEliminated) return;
    this.isMoving = true;
    const speedVariation = 0.7 + Math.random() * 0.2;
    this.targetVelocity = GAME_CONSTANTS.PLAYER_BASE_SPEED * speedVariation;
  }

  stopMoving(): void {
    this.isMoving = false;
    this.targetVelocity = 0;
  }

  update(_time: number, delta: number): void {
    if (this.isEliminated) return;

    this.lastPosition.set(this.x, this.y);

    const accelerationFactor = delta / GAME_CONSTANTS.PLAYER_ACCELERATION_TIME;
    this.velocity = Phaser.Math.Linear(
      this.velocity,
      this.targetVelocity,
      accelerationFactor
    );

    if (!this.isMoving && this.velocity > 0) {
      const overshootFactor = delta / GAME_CONSTANTS.PLAYER_MOMENTUM_OVERSHOOT;
      this.velocity = Math.max(0, this.velocity - this.velocity * overshootFactor);
    }

    const movement = this.velocity * (delta / 1000);
    this.y -= movement;
    this.distanceTraveled = this.startY - this.y;

    const bounds = this.scene.cameras.main;
    this.x = Phaser.Math.Clamp(this.x, 32, bounds.width - 32);

    if (this.velocity > 0) {
      const walkCycle = Math.sin(Date.now() / 100);
      this.leftArm.setRotation(walkCycle * 0.4);
      this.rightArm.setRotation(-walkCycle * 0.4);
      this.leftLeg.setRotation(-walkCycle * 0.3);
      this.rightLeg.setRotation(walkCycle * 0.3);
      this.sprite.y = Math.sin(Date.now() / 50) * 1.5;
    } else {
      this.leftArm.setRotation(0);
      this.rightArm.setRotation(0);
      this.leftLeg.setRotation(0);
      this.rightLeg.setRotation(0);
      this.sprite.y = 0;
    }
  }

  getMovementDelta(): number {
    return Math.abs(this.y - this.lastPosition.y);
  }

  hasReachedFinish(finishY: number): boolean {
    return this.y <= finishY;
  }

  eliminate(): void {
    if (this.isEliminated) return;

    this.isEliminated = true;
    this.stopMoving();

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 3,
    });

    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 0.8,
      scaleY: this.scaleY * 0.8,
      duration: 400,
      ease: 'Power2',
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: 1000,
      duration: 500,
      onComplete: () => {
        this.destroy();
      },
    });

    this.scene.events.emit('npc-eliminated', { x: this.x, y: this.y });
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.velocity = 0;
    this.targetVelocity = 0;
    this.isMoving = false;
    this.isAIMoving = false;
    this.isEliminated = false;
    this.distanceTraveled = 0;
    this.lastPosition.set(x, y);
    this.movementTimer = 0;
    this.reactionTime = 100 + Math.random() * 300;
    this.sprite.setAlpha(1);
    this.setAlpha(1);
    this.leftArm.setRotation(0);
    this.rightArm.setRotation(0);
    this.leftLeg.setRotation(0);
    this.rightLeg.setRotation(0);
    this.sprite.y = 0;
  }
}
