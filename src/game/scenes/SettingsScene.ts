/**
 * SettingsScene
 * Settings menu for game configuration
 */

import Phaser from 'phaser';
import { SCENES, COLORS } from '../config/constants';

export default class SettingsScene extends Phaser.Scene {
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private returnToScene: string = SCENES.MENU;

  constructor() {
    super({ key: SCENES.SETTINGS });
  }

  init(data: { from?: string }): void {
    // Remember where we came from
    this.returnToScene = data.from || SCENES.MENU;

    // Load settings from localStorage
    if (typeof localStorage !== 'undefined') {
      const musicSetting = localStorage.getItem('squidgame-music');
      const sfxSetting = localStorage.getItem('squidgame-sfx');

      this.musicEnabled = musicSetting !== null ? musicSetting === 'true' : true;
      this.sfxEnabled = sfxSetting !== null ? sfxSetting === 'true' : true;
    }

    // Update registry
    this.registry.set('musicEnabled', this.musicEnabled);
    this.registry.set('sfxEnabled', this.sfxEnabled);
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Fade in
    this.cameras.main.fadeIn(300);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND_CREAM);

    // Title
    const title = this.add.text(width / 2, 80, 'SETTINGS', {
      fontSize: '48px',
      color: '#FF4581',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Music toggle
    this.createToggle(
      width / 2,
      height / 2 - 60,
      'Music',
      this.musicEnabled,
      (enabled) => {
        this.musicEnabled = enabled;
        this.registry.set('musicEnabled', enabled);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('squidgame-music', enabled.toString());
        }

        // Emit event for other scenes
        this.game.events.emit('music-setting-changed', enabled);
      }
    );

    // SFX toggle
    this.createToggle(
      width / 2,
      height / 2 + 40,
      'Sound Effects',
      this.sfxEnabled,
      (enabled) => {
        this.sfxEnabled = enabled;
        this.registry.set('sfxEnabled', enabled);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('squidgame-sfx', enabled.toString());
        }
      }
    );

    // Back button
    this.createBackButton(width / 2, height - 100);

    // Instructions
    this.add.text(width / 2, height - 40, 'Settings are saved automatically', {
      fontSize: '12px',
      color: '#8C8C8C',
    }).setOrigin(0.5);
  }

  private createToggle(
    x: number,
    y: number,
    label: string,
    initialValue: boolean,
    onChange: (enabled: boolean) => void
  ): void {
    // Label
    const labelText = this.add.text(x - 120, y, label, {
      fontSize: '24px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    labelText.setOrigin(0, 0.5);

    // Toggle background
    const toggleBg = this.add.rectangle(x + 120, y, 80, 40, 0xCCCCCC);
    toggleBg.setStrokeStyle(2, 0x999999);
    toggleBg.setInteractive({ useHandCursor: true });

    // Toggle knob
    const knobX = initialValue ? x + 140 : x + 100;
    const toggleKnob = this.add.circle(knobX, y, 16, initialValue ? COLORS.TRACKSUIT_GREEN : 0x999999);
    toggleKnob.setStrokeStyle(2, 0x666666);

    // State text
    const stateText = this.add.text(x + 180, y, initialValue ? 'ON' : 'OFF', {
      fontSize: '18px',
      color: initialValue ? '#008c62' : '#999999',
      fontStyle: 'bold',
    });
    stateText.setOrigin(0, 0.5);

    let currentValue = initialValue;

    // Toggle interaction
    const toggle = () => {
      currentValue = !currentValue;

      // Animate knob
      this.tweens.add({
        targets: toggleKnob,
        x: currentValue ? x + 140 : x + 100,
        duration: 200,
        ease: 'Power2',
      });

      // Update colors
      toggleKnob.setFillStyle(currentValue ? COLORS.TRACKSUIT_GREEN : 0x999999);
      stateText.setText(currentValue ? 'ON' : 'OFF');
      stateText.setColor(currentValue ? '#008c62' : '#999999');

      // Callback
      onChange(currentValue);
    };

    toggleBg.on('pointerdown', toggle);

    // Hover effect
    toggleBg.on('pointerover', () => {
      toggleBg.setFillStyle(0xDDDDDD);
      this.tweens.add({
        targets: toggleBg,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    toggleBg.on('pointerout', () => {
      toggleBg.setFillStyle(0xCCCCCC);
      this.tweens.add({
        targets: toggleBg,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
  }

  private createBackButton(x: number, y: number): void {
    const button = this.add.rectangle(x, y, 200, 60, COLORS.CONCRETE_GRAY);
    button.setStrokeStyle(3, 0x666666);
    button.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, 'BACK', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    button.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(this.returnToScene);
      });
    });

    // Hover effects
    button.on('pointerover', () => {
      button.setFillStyle(0x666666);
      this.tweens.add({
        targets: [button, text],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    button.on('pointerout', () => {
      button.setFillStyle(COLORS.CONCRETE_GRAY);
      this.tweens.add({
        targets: [button, text],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
  }
}
