/**
 * Game State Manager
 * Manages game state transitions and flow
 */

import { GameState } from '@/types/game.types';

export default class GameStateManager {
  private currentState: GameState;
  private listeners: Map<GameState, Array<(newState: GameState, oldState: GameState) => void>>;

  constructor(initialState: GameState = GameState.READY) {
    this.currentState = initialState;
    this.listeners = new Map();

    console.log(`🎮 GameStateManager: Initial state = ${initialState}`);
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return this.currentState;
  }

  /**
   * Set new game state
   */
  setState(newState: GameState): void {
    const oldState = this.currentState;

    if (oldState === newState) {
      return; // No change
    }

    this.currentState = newState;

    console.log(`🎮 State: ${oldState} → ${newState}`);

    // Call registered listeners
    const callbacks = this.listeners.get(newState) || [];
    callbacks.forEach((callback) => callback(newState, oldState));
  }

  /**
   * Register listener for state change
   */
  onStateEnter(state: GameState, callback: (newState: GameState, oldState: GameState) => void): void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    this.listeners.get(state)!.push(callback);
  }

  /**
   * Check if currently in specific state
   */
  isState(state: GameState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if in green light state
   */
  isGreenLight(): boolean {
    return this.currentState === GameState.GREEN_LIGHT;
  }

  /**
   * Check if in red light state
   */
  isRedLight(): boolean {
    return this.currentState === GameState.RED_LIGHT;
  }

  /**
   * Check if game is active (playing)
   */
  isPlaying(): boolean {
    return (
      this.currentState === GameState.GREEN_LIGHT ||
      this.currentState === GameState.TRANSITION ||
      this.currentState === GameState.RED_LIGHT
    );
  }

  /**
   * Check if game has ended
   */
  isGameOver(): boolean {
    return (
      this.currentState === GameState.GAME_OVER ||
      this.currentState === GameState.VICTORY
    );
  }
}
