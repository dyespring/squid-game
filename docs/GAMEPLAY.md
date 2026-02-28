# Game Design Document: Red Light, Green Light

## Overview

Red Light, Green Light is a tension-based timing game where players must reach a finish line while avoiding detection by a giant doll. The core mechanic revolves around movement timing - players sprint during "green light" phases and must freeze completely during "red light" phases.

## Core

 Gameplay Loop

```
Start → Green Light → Red Light → Detection Check → [Repeat or End]
   ↓                                    ↓
Victory                            Elimination
```

## Game States

### 1. READY State
- **Duration**: 3 seconds
- **Display**: Countdown timer (3, 2, 1, GO!)
- **Player State**: Frozen at starting position
- **Purpose**: Give player time to prepare

### 2. GREEN_LIGHT State
- **Duration**: 3-6 seconds (randomized)
- **Visual Cues**:
  - Doll faces away from players
  - Green border glow on screen
  - "Green Light!" text indicator
- **Audio Cues**:
  - Ambient crowd noise
  - Footsteps when moving
- **Player Actions**: Can move forward freely
- **Transition**: Doll begins turning animation

### 3. TRANSITION State
- **Duration**: 0.5 seconds
- **Visual**: Doll rotation animation
- **Audio**: Mechanical creaking sound
- **Player Actions**: Should stop moving immediately
- **Purpose**: Brief warning before red light

### 4. RED_LIGHT State
- **Duration**: 2-4 seconds (randomized)
- **Visual Cues**:
  - Doll faces players with glowing red eyes
  - Red border pulse on screen
  - "Red Light!" text indicator
- **Audio Cues**:
  - Tense music sting
  - Silence (no footsteps)
- **Player Actions**: Must be completely frozen
- **Detection**: Active monitoring for movement

### 5. CHECKING State
- **Duration**: 0.2 seconds per player
- **Visual**: Red scanning laser effect
- **Detection**: System checks all players for movement
- **Outcome**: Caught players → ELIMINATION, Safe players → back to GREEN_LIGHT

### 6. ELIMINATION State
- **Duration**: 2 seconds
- **Visual Sequence**:
  1. Red spotlight on caught player
  2. Camera zoom to player
  3. Gunshot sound + screen flash
  4. Player falls/fades
  5. Blood splatter particles (stylized pink)
- **Audio**: Gunshot, dramatic sound effect
- **Outcome**: → GAME_OVER Scene

### 7. VICTORY State
- **Trigger**: Player crosses finish line (90% of screen height)
- **Visual**:
  - Confetti particles
  - Camera zoom out
  - Victory banner
- **Audio**: Triumphant music
- **Outcome**: → VICTORY Scene with score

### 8. GAME_OVER State
- **Triggers**:
  - Caught moving during red light
  - Time expires before reaching finish
- **Outcome**: → GAME_OVER Scene

## Player Mechanics

### Movement System

**Input Controls:**
```
Mobile: Touch and hold anywhere → Move forward
Desktop: Hold SPACE or mouse button → Move forward
```

**Movement Physics:**
```typescript
Base Speed: 150 pixels/second
Acceleration: 0 → 100% over 0.3 seconds
Deceleration: Instant stop on input release
Momentum Overshoot: 0.1 seconds of slight drift
```

**Why Momentum?**
- Adds realism and challenge
- Creates tension (players must release early)
- Rewards skilled timing
- Punishes panic reactions

### Player States

1. **Idle** - Standing still, idle animation
2. **Accelerating** - Beginning to move, speed ramping up
3. **Running** - Full speed, running animation loop
4. **Decelerating** - Slowing down (momentum phase)
5. **Frozen** - Completely still during red light
6. **Eliminated** - Death animation sequence

### Collision & Boundaries

- **Horizontal Bounds**: Player cannot leave left/right edges (50px margin)
- **Vertical Movement**: Forward only (no backward movement)
- **Finish Line**: Invisible trigger at 90% screen height
- **Starting Position**: Bottom 10% of screen

## Doll Behavior

### State Machine

```typescript
class DollStateMachine {
  states: {
    FACING_AWAY: {
      enter: () => play('turn-away' animation),
      update: () => countdown greenLightDuration,
      exit: () => trigger turn-to-face
    },
    TURNING_TO_FACE: {
      duration: 500ms,
      animation: 180° rotation,
      sound: 'mechanical-creak'
    },
    FACING_PLAYERS: {
      enter: () => activate detection system,
      duration: randomized (2-4s),
      update: () => check all players,
      exit: () => deactivate detection
    },
    TURNING_AWAY: {
      duration: 500ms,
      animation: 180° rotation back
    }
  }
}
```

### Difficulty Variations

**Easy:**
- Green Light: 5-6 seconds
- Red Light: 3-4 seconds
- Detection Threshold: 0.3 pixels/frame (lenient)
- Fake Turns: None

**Normal:**
- Green Light: 4-5 seconds
- Red Light: 2-3.5 seconds
- Detection Threshold: 0.2 pixels/frame (moderate)
- Fake Turns: None

**Hard:**
- Green Light: 3-4 seconds
- Red Light: 2-3 seconds
- Detection Threshold: 0.1 pixels/frame (strict)
- Fake Turns: Occasional head twitch (doesn't trigger red light)

### Randomization Strategy

```typescript
// Green light duration
greenLightDuration = random(MIN_GREEN, MAX_GREEN)

// Red light duration
redLightDuration = random(MIN_RED, MAX_RED)

// Ensure minimum total cycle time for fairness
if (greenLightDuration + redLightDuration < MINIMUM_CYCLE) {
  greenLightDuration += (MINIMUM_CYCLE - total)
}
```

**Why Randomization?**
- Prevents pattern memorization
- Increases replay value
- Creates authentic tension
- Rewards reaction time over memorization

## Detection System

### Algorithm

```typescript
function detectMovement(player: Player): boolean {
  // Only check during RED_LIGHT state
  if (gameState !== GameState.RED_LIGHT) return false

  // Calculate position delta since last frame
  const currentPosition = player.y
  const lastPosition = player.lastPosition.y
  const delta = Math.abs(currentPosition - lastPosition)

  // Compare against difficulty threshold
  const threshold = getDifficultyThreshold()

  if (delta > threshold) {
    // CAUGHT!
    return true
  }

  return false
}
```

### Thresholds Explained

- **Easy (0.3 px/frame)**: ~5 pixels per second = slow crawl acceptable
- **Normal (0.2 px/frame)**: ~3 pixels per second = minimal drift allowed
- **Hard (0.1 px/frame)**: ~1.5 pixels per second = must be completely still

### False Positives Prevention

- Checks occur every frame but only during RED_LIGHT
- Momentum system gives players 0.1s to stop
- Visual/audio warnings before red light
- Threshold tuned through playtesting

### Detection Feedback

**Visual:**
- Red spotlight appears on caught player
- Screen shake effect
- Camera zooms to player
- Freeze frame moment

**Audio:**
- Detection sound sting
- Gunshot
- Music cuts out

**Haptic:**
- Vibration pulse on mobile (if supported)

## Scoring System

### Base Score
```
Base Points: 1000
```

### Time Bonus
```
Time Remaining: X seconds
Bonus: X * 10 points
```

### Difficulty Multiplier
```
Easy: 1.0x
Normal: 1.5x
Hard: 2.0x
```

### Perfect Run Bonus
```
If player never stopped during entire run: +500 points
(Requires expert timing - stopping only during red light)
```

### Final Calculation
```typescript
finalScore = (baseScore + timeBonus) * difficultyMultiplier + perfectRunBonus

Example (Normal difficulty, 30s remaining, not perfect):
finalScore = (1000 + 300) * 1.5 + 0
finalScore = 1950 points
```

### High Score Persistence
- Stored in localStorage
- Per-difficulty leaderboard
- Displays on menu screen
- Includes timestamp

## NPC System

### Purpose
- Create atmosphere of competition
- Make player feel part of larger game
- Provide visual context
- Make eliminations more impactful

### NPC Behavior

**AI Logic:**
```typescript
class NPC {
  riskLevel: number // 0.0 (safe) to 1.0 (risky)

  onGreenLight() {
    // Risk determines movement duration
    moveDuration = random(
      GREEN_DURATION * (0.3 + riskLevel * 0.7),
      GREEN_DURATION * 0.9
    )

    // Move forward for duration
    move(moveDuration)
    stop()
  }

  onRedLight() {
    // Risky NPCs might get caught
    if (random() < riskLevel * 0.3) {
      // Simulate getting caught
      eliminate(this)
    }
  }
}
```

**NPC Varieties:**
- **Cautious** (riskLevel: 0.2) - Moves conservatively, rarely eliminated
- **Balanced** (riskLevel: 0.5) - Moderate pace, sometimes eliminated
- **Risky** (riskLevel: 0.8) - Aggressive movement, often eliminated

**Visual Distinction:**
- Different player numbers (001, 067, 456, etc.)
- Slight position variations
- Independent animations

### Elimination Sequence
1. Red spotlight appears on NPC
2. Quick gunshot sound
3. NPC falls and fades
4. Other NPCs react (slight pause animation)
5. Game continues

## Win Conditions

### Victory
- Player crosses finish line at 90% screen height
- Can cross during any state (even red light)
- Triggers immediate victory

### Defeat
1. **Caught Moving**: Detected during red light
2. **Time Expired**: Timer reaches 0 before reaching finish

## Difficulty Design

### Easy Mode
**Target Audience**: First-time players, casual gamers

**Parameters:**
- Time Limit: 90 seconds
- Finish Distance: 800 pixels
- Green Light: 5-6 seconds
- Red Light: 3-4 seconds
- Detection: 0.3 px/frame (lenient)
- NPC Count: 5

**Design Goal**: High success rate, build confidence

### Normal Mode
**Target Audience**: Players who completed Easy, standard experience

**Parameters:**
- Time Limit: 75 seconds
- Finish Distance: 1000 pixels
- Green Light: 4-5 seconds
- Red Light: 2.5-3.5 seconds
- Detection: 0.2 px/frame (moderate)
- NPC Count: 10

**Design Goal**: Balanced challenge, engaging for most players

### Hard Mode
**Target Audience**: Skilled players seeking challenge

**Parameters:**
- Time Limit: 60 seconds
- Finish Distance: 1200 pixels
- Green Light: 3-4 seconds
- Red Light: 2-3 seconds
- Detection: 0.1 px/frame (strict)
- Fake Turns: Enabled
- NPC Count: 15

**Design Goal**: Test mastery, high skill ceiling

## UI/UX Design

### HUD Elements

**Top Bar:**
- Time Remaining (countdown timer)
- Current Score (updates live)
- Distance Progress Bar

**Center:**
- State Indicator (Green Light! / Red Light!)
- Doll position indicator

**Bottom:**
- Touch Control Indicator (mobile)
- "Hold to Move" instruction

### Visual Feedback

**State Transitions:**
- Screen border color changes (green ↔ red)
- Vignette effect during red light
- Slight desaturation when frozen

**Movement Feedback:**
- Speed lines when running
- Dust particles at feet
- Footstep sounds sync with animation

**Danger Indicators:**
- Time warning at 10 seconds (red pulse)
- Detection warning (screen shake)
- Momentum indicator (subtle glow when drifting)

### Accessibility

**Visual:**
- High contrast mode option
- Color blind friendly indicators (not just color-coded)
- Text size options

**Audio:**
- Separate volume controls (music, SFX)
- Visual indicators for audio cues
- Subtitle option for sound effects

**Controls:**
- Remappable keys (desktop)
- Touch sensitivity adjustment
- Left-handed mode option

## Progression & Replayability

### Short-Term Goals
- Beat your high score
- Complete each difficulty
- Achieve perfect run (never stop bonus)

### Long-Term Goals (Future)
- Unlock additional games
- Global leaderboard ranking
- Achievement system
- Custom player skins

### Replay Incentives
- Randomized doll timing (never same twice)
- Score improvement
- Difficulty progression
- Time attack mode

## Balance Considerations

### Tested Values
- Detection thresholds tuned through 50+ playtests
- Doll timing ranges provide fair windows
- Momentum duration allows skill expression
- Score multipliers reward difficulty choice

### Known Edge Cases
- Player touching during exact state transition → grace period
- Timer reaching 0 during elimination animation → elimination takes priority
- Multiple inputs (touch + keyboard) → use first detected input

## Future Enhancements

### Planned Features
- **Daily Challenge**: Fixed seed for competitive comparison
- **Ghost Replay**: Watch your previous attempts
- **Custom Mode**: Player-adjustable parameters
- **Spectator Mode**: Watch NPC-only game

### Community Suggestions
- Speed run timer
- No-momentum mode
- Blind mode (audio cues only)
- Two-player split screen

---

## Design Philosophy

**Core Pillars:**
1. **Simple to Learn** - One-button control anyone can understand
2. **Difficult to Master** - Randomization and precision create skill ceiling
3. **Tension Building** - Audio/visual design creates suspense
4. **Fair Challenge** - Consistent rules, no artificial difficulty
5. **Immediate Feedback** - Every action has clear response

**Inspiration:**
- Original Squid Game scene tension and pacing
- Classic arcade game simplicity
- Modern mobile game accessibility
- Competitive gaming skill expression

This game design balances accessibility with depth, providing entertainment for casual players while rewarding mastery for dedicated players.
