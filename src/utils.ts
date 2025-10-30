export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const temporary = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temporary;
  }
  return arr;
}

const BEST_SCORE_KEY = "quiz.bestScore";
const BEST_STREAK_KEY = "quiz.bestStreak";

export function loadBest() {
  const bestScore = Number(localStorage.getItem(BEST_SCORE_KEY) ?? "0");
  const bestStreak = Number(localStorage.getItem(BEST_STREAK_KEY) ?? "0");
  return {
    bestScore: Number.isNaN(bestScore) ? 0 : bestScore,
    bestStreak: Number.isNaN(bestStreak) ? 0 : bestStreak,
  };
}

export function saveBest(bestScore: number, bestStreak: number) {
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  localStorage.setItem(BEST_STREAK_KEY, String(bestStreak));
}

export function resetAllProgress() {
  localStorage.removeItem("quiz.bestScore");
  localStorage.removeItem("quiz.bestStreak");
}
