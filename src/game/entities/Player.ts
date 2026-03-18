/**
 * Player Entity
 * The player character with movement physics
 */

import Phaser from 'phaser';
import { GAME_CONSTANTS, COLORS } from '../config/constants';

const TRACKSUIT = COLORS.TRACKSUIT_GREEN;
const TRACKSUIT_DARK = 0x005a42;
const SKIN = 0xffccaa;
const SKIN_DARK = 0xe6b090;
const SHOE_COLOR = 0x333333;

export default class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Ellipse;
  private glow: Phaser.GameObjects.Arc;
  private bodyGfx: Phaser.GameObjects.Graphics;
  private leftArm: Phaser.GameObjects.Graphics;
  private rightArm: Phaser.GameObjects.Graphics;
  private leftLeg: Phaser.GameObjects.Graphics;
  private rightLeg: Phaser.GameObjects.Graphics;
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

    this.shadow = scene.add.ellipse(0, 30, 34, 10, 0x000000, 0.25);
    this.add(this.shadow);

    this.glow = scene.add.arc(0, 0, 42, 0, 360, false, TRACKSUIT, 0);
    this.add(this.glow);

    this.sprite = scene.add.container(0, 0);

    // Legs (drawn first, behind torso)
    this.leftLeg = scene.add.graphics();
    this.rightLeg = scene.add.graphics();
    this.drawLeg(this.leftLeg, -5);
    this.drawLeg(this.rightLeg, 5);
    this.sprite.add(this.leftLeg);
    this.sprite.add(this.rightLeg);

    // Body (torso + head drawn as single graphics)
    this.bodyGfx = scene.add.graphics();
    this.drawBody(this.bodyGfx);
    this.sprite.add(this.bodyGfx);

    // Arms
    this.leftArm = scene.add.graphics();
    this.rightArm = scene.add.graphics();
    this.drawArm(this.leftArm, -1);
    this.drawArm(this.rightArm, 1);
    this.sprite.add(this.leftArm);
    this.sprite.add(this.rightArm);

    this.add(this.sprite);
    scene.add.existing(this);
  }

  private drawBody(g: Phaser.GameObjects.Graphics): void {
    // Torso — rounded rectangle
    g.fillStyle(TRACKSUIT, 1);
    g.fillRoundedRect(-9, -8, 18, 24, 4);
    g.lineStyle(2, TRACKSUIT_DARK, 1);
    g.strokeRoundedRect(-9, -8, 18, 24, 4);

    // Collar — white V-shape
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(-5, -8, 5, -8, 0, -2);

    // Number circle on chest
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(0, 4, 7);
    g.lineStyle(1, TRACKSUIT_DARK, 0.5);
    g.strokeCircle(0, 4, 7);

    // Head — skin tone with hair
    g.fillStyle(SKIN, 1);
    g.fillCircle(0, -20, 10);
    g.lineStyle(1.5, SKIN_DARK, 1);
    g.strokeCircle(0, -20, 10);

    // Hair cap
    g.fillStyle(0x2a1a0a, 1);
    g.fillEllipse(0, -25, 18, 10);

    // Eyes (simple dots)
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
    // Hand
    g.fillStyle(SKIN, 1);
    g.fillCircle(x, 14, 3);
  }

  private drawLeg(g: Phaser.GameObjects.Graphics, xOffset: number): void {
    g.fillStyle(TRACKSUIT, 1);
    g.fillRoundedRect(xOffset - 3.5, 14, 7, 18, 3);
    g.lineStyle(1, TRACKSUIT_DARK, 1);
    g.strokeRoundedRect(xOffset - 3.5, 14, 7, 18, 3);
    // Shoe
    g.fillStyle(SHOE_COLOR, 1);
    g.fillRoundedRect(xOffset - 4, 30, 8, 5, 2);
  }

  startMoving(): void {
    if (this.isEliminated) return;

    this.isMoving = true;
    this.targetVelocity = GAME_CONSTANTS.PLAYER_BASE_SPEED;

    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.25,
      duration: 200,
    });
  }

  stopMoving(): void {
    this.isMoving = false;
    this.targetVelocity = 0;

    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0,
      duration: 200,
    });
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
      const cycle = Math.sin(Date.now() / 100);
      this.leftArm.setRotation(cycle * 0.4);
      this.rightArm.setRotation(-cycle * 0.4);
      this.leftLeg.setRotation(-cycle * 0.3);
      this.rightLeg.setRotation(cycle * 0.3);

      this.sprite.y = Math.sin(Date.now() / 50) * 1.5;
      this.glow.scale = 1 + Math.sin(Date.now() / 200) * 0.1;

      this.dustTimer += delta;
      if (this.dustTimer >= 100) {
        this.scene.events.emit('player-emit-dust', { x: this.x, y: this.y });
        this.dustTimer = 0;
      }
    } else {
      this.leftArm.setRotation(0);
      this.rightArm.setRotation(0);
      this.leftLeg.setRotation(0);
      this.rightLeg.setRotation(0);
      this.sprite.y = 0;
      this.glow.scale = 1;
    }
  }

  getMovementDelta(): number {
    return Math.abs(this.y - this.lastPosition.y);
  }

  hasReachedFinish(finishY: number): boolean {
    return this.y <= finishY;
  }

  eliminate(): void {
    this.isEliminated = true;
    this.stopMoving();

    this.glow.setFillStyle(COLORS.DANGER_RED);
    this.glow.setAlpha(0.8);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 3,
    });

    this.scene.tweens.add({
      targets: this,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 400,
      ease: 'Power2',
    });

    this.scene.events.emit('player-eliminated', { x: this.x, y: this.y });
  }

  playVictoryAnimation(): void {
    this.glow.setFillStyle(0xffd700);
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.8,
      scale: 1.5,
      duration: 500,
    });

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 400,
      yoyo: true,
      ease: 'Back.easeOut',
      repeat: 1,
    });

    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      duration: 300,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.scene.events.emit('player-victory', { x: this.x, y: this.y });
  }

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
    this.sprite.setAlpha(1);
    this.leftArm.setRotation(0);
    this.rightArm.setRotation(0);
    this.leftLeg.setRotation(0);
    this.rightLeg.setRotation(0);
    this.sprite.y = 0;
  }
}
