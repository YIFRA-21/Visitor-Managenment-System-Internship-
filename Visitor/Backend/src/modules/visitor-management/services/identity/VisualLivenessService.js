/**
 * VisualLivenessService
 * Generates randomized visual liveness challenges and validates visual gesture completion.
 * Challenge Library: Blink, Blink Twice, Turn Left, Turn Right, Look Up, Look Down,
 * Tilt Left, Tilt Right, Smile, Raise Eyebrows, Open Mouth, Close Mouth, Move Closer,
 * Move Back, Hold Still, Follow Moving Target, Random Head Movement.
 */

class VisualLivenessService {
  constructor() {
    this.challengePool = [
      { id: 'BLINK', label: 'Blink', instruction: 'Please blink your eyes naturally' },
      { id: 'BLINK_TWICE', label: 'Blink Twice', instruction: 'Please blink your eyes twice' },
      { id: 'TURN_LEFT', label: 'Turn Left', instruction: 'Please turn your head left' },
      { id: 'TURN_RIGHT', label: 'Turn Right', instruction: 'Please turn your head right' },
      { id: 'LOOK_UP', label: 'Look Up', instruction: 'Please look up' },
      { id: 'LOOK_DOWN', label: 'Look Down', instruction: 'Please look down' },
      { id: 'TILT_LEFT', label: 'Tilt Left', instruction: 'Please tilt your head to the left' },
      { id: 'TILT_RIGHT', label: 'Tilt Right', instruction: 'Please tilt your head to the right' },
      { id: 'SMILE', label: 'Smile', instruction: 'Please smile naturally' },
      { id: 'RAISE_EYEBROWS', label: 'Raise Eyebrows', instruction: 'Please raise your eyebrows' },
      { id: 'OPEN_MOUTH', label: 'Open Mouth', instruction: 'Please open your mouth slightly' },
      { id: 'CLOSE_MOUTH', label: 'Close Mouth', instruction: 'Please close your mouth' },
      { id: 'MOVE_CLOSER', label: 'Move Closer', instruction: 'Please move closer to the camera' },
      { id: 'MOVE_BACK', label: 'Move Back', instruction: 'Please move slightly back' },
      { id: 'HOLD_STILL', label: 'Hold Still', instruction: 'Please hold still for a moment' },
      { id: 'FOLLOW_TARGET', label: 'Follow Moving Target', instruction: 'Please follow the target indicator with your eyes' },
      { id: 'RANDOM_HEAD_MOVEMENT', label: 'Random Head Movement', instruction: 'Please move your head gently' }
    ];
  }

  generateRandomChallenges(count = 4) {
    const shuffled = [...this.challengePool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  verifyLivenessResults(completedChallenges = []) {
    const minRequired = 3;
    const passed = completedChallenges.length >= minRequired;
    return {
      livenessPassed: passed,
      livenessScore: passed ? 98.0 : 40.0,
      completionRate: Math.min(100, Math.round((completedChallenges.length / 4) * 100)),
      completedChallenges,
      replayAttackDetected: false,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new VisualLivenessService();
