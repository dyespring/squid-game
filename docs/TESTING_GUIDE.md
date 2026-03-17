# Testing Guide

## 📚 What is Unit Testing?

**Unit testing** is the practice of testing individual pieces (units) of code in isolation to verify they work correctly.

### Real-World Analogy

Think of building a smartphone:
- ✅ Test the camera separately
- ✅ Test the battery separately
- ✅ Test the screen separately
- ✅ Test the speakers separately

**Only after** each part works individually, you assemble the phone.

**Unit tests = Testing each part before assembly**

---

## 🎯 Why Unit Testing Matters

### 1. **Catch Bugs Early**
```javascript
// Without tests: Bug discovered by users 😰
// With tests: Bug caught during development ✅
```

### 2. **Confidence in Changes**
```bash
# Make changes to code
npm test
# All tests pass? Safe to deploy! ✅
```

### 3. **Documentation**
Tests show HOW your code should be used:
```javascript
it('should add score with perfect bonus', () => {
  scoreSystem.start();
  // No detections = perfect run
  const result = scoreSystem.calculateFinalScore(30, 'HARD');
  expect(result.perfectBonus).toBe(500); // ✅ Documents behavior
});
```

### 4. **Refactoring Safety**
- Change internal implementation
- Tests still pass = you didn't break anything

---

## 🧪 Tests in Your Project

### Test Files Created:

**1. [ScoreSystem.test.ts](../src/tests/ScoreSystem.test.ts)**
- 12 tests
- Tests scoring calculation logic

**2. [HighScoreManager.test.ts](../src/tests/HighScoreManager.test.ts)**
- 17 tests
- Tests leaderboard and persistence

**Total: 29 tests** ✅

---

## 🚀 How to Run Tests

### 1. **Run All Tests Once**
```bash
npm test -- --run
```

**Output:**
```
✓ src/tests/ScoreSystem.test.ts (12 tests) 3ms
✓ src/tests/HighScoreManager.test.ts (17 tests) 5ms

Test Files  2 passed (2)
     Tests  29 passed (29) ✅
```

### 2. **Watch Mode (Auto-rerun on changes)**
```bash
npm run test:watch
```
Tests automatically run when you save files!

### 3. **Coverage Report**
```bash
npm run test:coverage
```
See which lines of code are tested:
```
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
ScoreSystem.ts              |  100.00 |   100.00 |  100.00 |  100.00
HighScoreManager.ts         |  100.00 |   100.00 |  100.00 |  100.00
```

---

## 📖 What Each Test Does

### ScoreSystem Tests

**1. Initialization Tests**
```javascript
it('should start with zero score', () => {
  expect(scoreSystem.getCurrentScore()).toBe(0);
});
```
✅ Verifies system starts fresh

**2. Score Calculation Tests**
```javascript
it('should calculate time bonus correctly', () => {
  scoreSystem.start();
  const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
  expect(result.timeBonus).toBe(300); // 30 * 10
});
```
✅ Verifies time bonus = remaining seconds × 10

**3. Difficulty Multiplier Tests**
```javascript
it('should apply difficulty multipliers', () => {
  // EASY: 1.0x, NORMAL: 1.5x, HARD: 2.0x
  expect(easyResult.difficultyMultiplier).toBe(1.0);
  expect(normalResult.difficultyMultiplier).toBe(1.5);
  expect(hardResult.difficultyMultiplier).toBe(2.0);
});
```
✅ Verifies score scales with difficulty

**4. Perfect Run Tests**
```javascript
it('should apply perfect run bonus', () => {
  scoreSystem.start();
  // No detections
  const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
  expect(result.perfectBonus).toBe(500);
});
```
✅ Verifies 500 point bonus for no detections

### HighScoreManager Tests

**1. Adding Scores**
```javascript
it('should add score to correct difficulty', () => {
  manager.addScore({ score: 1500, difficulty: 'NORMAL', ... });
  const scores = manager.getHighScores('NORMAL');
  expect(scores).toHaveLength(1);
  expect(scores[0].score).toBe(1500);
});
```
✅ Verifies scores saved to leaderboard

**2. Top 10 Limit**
```javascript
it('should limit to top 10 scores', () => {
  // Add 12 scores
  for (let i = 0; i < 12; i++) { ... }
  const scores = manager.getHighScores('NORMAL');
  expect(scores).toHaveLength(10); // Only top 10
});
```
✅ Verifies only best 10 scores kept

**3. Persistence**
```javascript
it('should save to localStorage', () => {
  manager.addScore({ ... });
  const stored = localStorage.getItem('squid_game_high_scores');
  expect(stored).toBeTruthy();
});
```
✅ Verifies scores persist across sessions

---

## 🎓 When to Run Tests

### **Always Run Before:**

1. ✅ **Committing Code**
   ```bash
   git add .
   npm test -- --run  # Make sure tests pass!
   git commit -m "Add scoring feature"
   ```

2. ✅ **Deploying to Production**
   ```bash
   npm test -- --run
   npm run build
   vercel --prod
   ```

3. ✅ **Creating a Pull Request**
   ```bash
   npm test -- --run
   git push origin feature-branch
   # Create PR
   ```

### **Run During Development:**

```bash
# Start watch mode
npm run test:watch

# Now edit code - tests run automatically! ⚡
```

---

## 🔍 Reading Test Output

### ✅ Passing Test
```
✓ src/tests/ScoreSystem.test.ts > should calculate score
```
**Meaning:** Test passed! Code works as expected.

### ❌ Failing Test
```
✗ src/tests/ScoreSystem.test.ts > should calculate score
  Expected: 1000
  Received: 1500
```
**Meaning:**
- Test expected 1000
- Got 1500 instead
- Your code has a bug OR test needs updating

---

## 🛠️ Writing Your Own Tests

### Example: Testing a new feature

Let's say you add a "combo bonus" feature:

```typescript
// 1. Write the test FIRST
it('should apply combo bonus', () => {
  scoreSystem.start();
  scoreSystem.recordCombo(5); // 5 moves without detection

  const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
  expect(result.comboBonus).toBe(250); // 5 * 50
});

// 2. Run test - it FAILS (feature doesn't exist yet)
// 3. Write the actual code
// 4. Run test - it PASSES ✅
```

This is called **Test-Driven Development (TDD)**

---

## 📊 Test Coverage

Coverage shows which code is tested:

```bash
npm run test:coverage
```

**Coverage Report:**
```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
ScoreSystem.ts        |  100.00 |   100.00 |  100.00 |  100.00 ✅
HighScoreManager.ts   |  100.00 |   100.00 |  100.00 |  100.00 ✅
```

**What it means:**
- **% Stmts**: Percentage of statements executed
- **% Branch**: Percentage of if/else branches tested
- **% Funcs**: Percentage of functions tested
- **% Lines**: Percentage of lines executed

**Goal:** 80%+ coverage on critical code

---

## 🎯 Best Practices

### 1. **Test Behavior, Not Implementation**
```javascript
// ❌ Bad - Tests implementation details
it('should set internalVariable to true', () => {
  expect(scoreSystem.internalVariable).toBe(true);
});

// ✅ Good - Tests behavior
it('should return perfect run bonus when no detections', () => {
  const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
  expect(result.perfectBonus).toBe(500);
});
```

### 2. **One Assertion Per Test (Usually)**
```javascript
// ✅ Good - Clear what's being tested
it('should calculate time bonus', () => {
  const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
  expect(result.timeBonus).toBe(300);
});

it('should calculate perfect bonus', () => {
  const result = scoreSystem.calculateFinalScore(30, 'NORMAL');
  expect(result.perfectBonus).toBe(500);
});
```

### 3. **Use Descriptive Test Names**
```javascript
// ❌ Bad
it('test score', () => { ... });

// ✅ Good
it('should calculate correct final score with time and perfect bonus', () => { ... });
```

### 4. **Setup and Teardown**
```javascript
beforeEach(() => {
  // Run before EACH test
  scoreSystem = new ScoreSystem();
});

afterEach(() => {
  // Run after EACH test
  localStorage.clear();
});
```

---

## 🐛 Debugging Failed Tests

### Step 1: Read the Error
```
✗ should calculate score
  Expected: 1000
  Received: 1500

  at line 77
```

### Step 2: Add console.log
```javascript
it('should calculate score', () => {
  const result = scoreSystem.calculateFinalScore(0, 'EASY');
  console.log('Result:', result); // Debug output
  expect(result.finalScore).toBe(1000);
});
```

### Step 3: Run Specific Test
```bash
npm test -- --run ScoreSystem
```

### Step 4: Fix the Bug
```javascript
// Found the issue: Perfect bonus being added
// Add detection to test without perfect bonus
scoreSystem.recordDetection();
```

---

## 🚀 CI/CD Integration

Your tests run automatically on GitHub:

**.github/workflows/ci.yml**
```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm run test:coverage
```

**Every time you push code:**
1. GitHub runs tests automatically
2. You see pass/fail status
3. Can't merge if tests fail ❌

---

## 📝 Quick Reference

### Commands
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm test -- ScoreSystem  # Run specific test file
```

### Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Arrange: Set up test data
    const input = 5;

    // Act: Execute the code
    const result = myFunction(input);

    // Assert: Check the result
    expect(result).toBe(10);
  });
});
```

### Common Assertions
```javascript
expect(value).toBe(5)              // Exact equality
expect(value).toBeGreaterThan(3)   // Comparison
expect(array).toHaveLength(10)     // Array length
expect(value).toBeTruthy()         // Truthy
expect(fn).toThrow()               // Throws error
```

---

## 🎉 Summary

### What Tests Do in Your Project:

1. ✅ **Verify scoring calculations**
   - Base score, time bonus, perfect bonus
   - Difficulty multipliers work correctly

2. ✅ **Verify high score system**
   - Leaderboards save correctly
   - Top 10 limit enforced
   - Scores persist in localStorage

3. ✅ **Prevent regressions**
   - Future changes won't break existing features
   - Bugs caught before reaching users

### When to Run:
- ✅ Before committing
- ✅ Before deploying
- ✅ During development (watch mode)

### Result:
**29 tests passing = Confidence your game works correctly!** 🎮

---

**Ready to test?**

```bash
npm test -- --run
```

🧪 **Happy Testing!**
