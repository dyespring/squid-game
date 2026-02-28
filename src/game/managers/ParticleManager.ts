/**
 * Particle Manager
 * Manages all particle effects in the game
 */

import Phaser from 'phaser';
import { COLORS } from '../config/constants';

export default class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Emit dust particles when player is moving
   */
  emitDust(x: number, y: number): void {
    const particleCount = 3;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + 20,
        Phaser.Math.Between(2, 4),
        COLORS.CONCRETE_GRAY,
        0.6
      );

      // Animate particle
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-20, 20),
        y: particle.y + Phaser.Math.Between(10, 20),
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Create explosion effect on elimination
   */
  createElimination(x: number, y: number): void {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Phaser.Math.Between(100, 200);
      const particle = this.scene.add.circle(x, y, 4, COLORS.DANGER_RED, 0.8);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // Flash effect
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      COLORS.DANGER_RED,
      0
    );
    flash.setDepth(200);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Create confetti effect on victory
   */
  createConfetti(centerX: number, centerY: number): void {
    const colors = [
      COLORS.SQUID_PINK,
      COLORS.TRACKSUIT_GREEN,
      0xffd700, // Gold
      0xff9800, // Orange
      0x4caf50, // Green
    ];

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.scene.add.rectangle(
        centerX + Phaser.Math.Between(-50, 50),
        centerY - 100,
        Phaser.Math.Between(6, 12),
        Phaser.Math.Between(6, 12),
        color,
        1
      );

      const targetX = centerX + Phaser.Math.Between(-200, 200);
      const targetY = centerY + Phaser.Math.Between(100, 300);

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(1000, 2000),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Create spotlight effect
   */
  createSpotlight(x: number, y: number, color: number = COLORS.DANGER_RED): Phaser.GameObjects.Arc {
    const spotlight = this.scene.add.arc(x, y, 0, 0, 360, false, color, 0.5);
    spotlight.setDepth(50);

    this.scene.tweens.add({
      targets: spotlight,
      radius: 80,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => spotlight.destroy(),
    });

    return spotlight;
  }

  /**
   * Create warning indicators
   */
  createWarningFlash(): void {
    const overlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      COLORS.DANGER_RED,
      0
    );
    overlay.setDepth(150);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => overlay.destroy(),
    });
  }

  /**
   * Create speed lines when moving fast
   */
  createSpeedLines(x: number, y: number): void {
    const lineCount = 5;

    for (let i = 0; i < lineCount; i++) {
      const line = this.scene.add.rectangle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(10, 20),
        2,
        COLORS.TRACKSUIT_GREEN,
        0.6
      );

      this.scene.tweens.add({
        targets: line,
        y: line.y + 30,
        alpha: 0,
        duration: 300,
        onComplete: () => line.destroy(),
      });
    }
  }

  /**
   * Create pulse effect
   */
  createPulse(target: Phaser.GameObjects.GameObject, scale: number = 1.2, duration: number = 200): void {
    this.scene.tweens.add({
      targets: target,
      scale: scale,
      duration: duration,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Create floating text
   */
  createFloatingText(x: number, y: number, text: string, color: string = '#FFFFFF'): void {
    const floatText = this.scene.add.text(x, y, text, {
      fontSize: '24px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    floatText.setOrigin(0.5);
    floatText.setDepth(100);

    this.scene.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });
  }
}
