/**
 * InputManager
 * Unified input handling for touch and keyboard
 */

import Phaser from 'phaser';

export default class InputManager {
  private scene: Phaser.Scene;
  private isTouchDevice: boolean;
  private isPointerDown: boolean = false;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isTouchDevice = this.detectTouchDevice();

    console.log(
      `🎮 InputManager: ${this.isTouchDevice ? 'Touch' : 'Keyboard'} mode`
    );

    this.setupInputHandlers();
  }

  /**
   * Detect if device supports touch
   */
  private detectTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - legacy property
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Set up input handlers based on device type
   */
  private setupInputHandlers(): void {
    if (this.isTouchDevice) {
      this.setupTouchControls();
    } else {
      this.setupKeyboardControls();
    }

    // Always set up both for hybrid devices
    this.setupKeyboardControls();
    this.setupTouchControls();
  }

  /**
   * Set up touch/pointer controls
   */
  private setupTouchControls(): void {
    this.scene.input.on('pointerdown', () => {
      this.isPointerDown = true;
    });

    this.scene.input.on('pointerup', () => {
      this.isPointerDown = false;
    });

    // Stop movement if pointer leaves game area
    this.scene.input.on('pointerout', () => {
      this.isPointerDown = false;
    });

    // Prevent context menu on long press (mobile)
    if (typeof window !== 'undefined') {
      window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    }
  }

  /**
   * Set up keyboard controls
   */
  private setupKeyboardControls(): void {
    if (!this.scene.input.keyboard) return;

    // SPACE key
    this.spaceKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Alternative: Mouse button (left click and hold)
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isPointerDown = true;
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) {
        this.isPointerDown = false;
      }
    });
  }

  /**
   * Check if movement input is active (touch or keyboard)
   */
  isMovementInputActive(): boolean {
    const spaceDown = this.spaceKey?.isDown ?? false;
    return this.isPointerDown || spaceDown;
  }

  /**
   * Reset input state (useful for scene transitions)
   */
  reset(): void {
    this.isPointerDown = false;
  }

  /**
   * Get pointer position
   */
  getPointerPosition(): { x: number; y: number } | null {
    const pointer = this.scene.input.activePointer;

    if (pointer.isDown) {
      return {
        x: pointer.x,
        y: pointer.y,
      };
    }

    return null;
  }

  /**
   * Check if device is touch-enabled
   */
  isTouchEnabled(): boolean {
    return this.isTouchDevice;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointerout');
    this.reset();
  }
}
