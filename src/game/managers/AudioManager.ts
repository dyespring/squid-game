/**
 * AudioManager
 * Manages all game audio using Howler.js
 * Handles mobile audio unlock and cross-browser compatibility
 */

import { Howl, Howler } from 'howler';

interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>;
}

export default class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private music: Howl | null = null;
  private isUnlocked: boolean = false;
  private masterVolume: number = 0.7;
  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.8;

  constructor() {
    console.log('🔊 AudioManager: Initializing...');
    this.setupMobileAudioUnlock();
  }

  /**
   * iOS requires user interaction before audio can play
   * This sets up a listener to unlock audio on first touch/click
   */
  private setupMobileAudioUnlock(): void {
    const unlockAudio = () => {
      if (this.isUnlocked) return;

      console.log('🔓 Unlocking mobile audio...');

      // Play a silent sound to unlock audio context
      const silent = new Howl({
        src: [
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==',
        ],
        volume: 0,
      });

      silent.play();

      silent.once('play', () => {
        console.log('✅ Mobile audio unlocked');
        this.isUnlocked = true;
        silent.unload();
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      });
    };

    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('click', unlockAudio);
  }

  /**
   * Load a sound effect or music track
   */
  loadSound(key: string, config: SoundConfig): void {
    const sound = new Howl({
      src: config.src,
      volume: (config.volume ?? 1) * this.sfxVolume * this.masterVolume,
      loop: config.loop ?? false,
      sprite: config.sprite,
    });

    this.sounds.set(key, sound);
    console.log(`📥 Loaded sound: ${key}`);
  }

  /**
   * Load music track
   */
  loadMusic(key: string, src: string[]): void {
    this.music = new Howl({
      src,
      volume: this.musicVolume * this.masterVolume,
      loop: true,
    });

    console.log(`🎵 Loaded music: ${key}`);
  }

  /**
   * Play a sound effect
   */
  play(key: string, options?: { loop?: boolean; volume?: number }): number | void {
    const sound = this.sounds.get(key);

    if (!sound) {
      console.warn(`⚠️ Sound not found: ${key}`);
      return;
    }

    if (options?.volume !== undefined) {
      sound.volume(options.volume * this.sfxVolume * this.masterVolume);
    }

    if (options?.loop !== undefined) {
      sound.loop(options.loop);
    }

    return sound.play();
  }

  /**
   * Stop a sound
   */
  stop(key: string, id?: number): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.stop(id);
    }
  }

  /**
   * Play background music
   */
  playMusic(): void {
    if (this.music && !this.music.playing()) {
      this.music.play();
      console.log('🎵 Playing music');
    }
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.music) {
      this.music.stop();
      console.log('🎵 Stopped music');
    }
  }

  /**
   * Fade music in
   */
  fadeMusicIn(duration: number = 1000): void {
    if (this.music) {
      this.music.fade(0, this.musicVolume * this.masterVolume, duration);
    }
  }

  /**
   * Fade music out
   */
  fadeMusicOut(duration: number = 1000): void {
    if (this.music) {
      this.music.fade(this.music.volume(), 0, duration);
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
    console.log(`🔊 Master volume: ${Math.round(this.masterVolume * 100)}%`);
  }

  /**
   * Set music volume (0.0 to 1.0)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume(this.musicVolume * this.masterVolume);
    }
  }

  /**
   * Set SFX volume (0.0 to 1.0)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update all loaded sounds
    this.sounds.forEach((sound) => {
      sound.volume(this.sfxVolume * this.masterVolume);
    });
  }

  /**
   * Mute all audio
   */
  mute(): void {
    Howler.mute(true);
    console.log('🔇 Audio muted');
  }

  /**
   * Unmute all audio
   */
  unmute(): void {
    Howler.mute(false);
    console.log('🔊 Audio unmuted');
  }

  /**
   * Check if a sound is currently playing
   */
  isPlaying(key: string, id?: number): boolean {
    const sound = this.sounds.get(key);
    return sound ? sound.playing(id) : false;
  }

  /**
   * Cleanup - stop all sounds and unload
   */
  destroy(): void {
    console.log('🔊 AudioManager: Cleaning up...');
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
    if (this.music) {
      this.music.unload();
      this.music = null;
    }
  }
}
