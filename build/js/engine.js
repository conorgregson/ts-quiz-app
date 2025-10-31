import { QuestionKind } from "./enums.js";
import { shuffleInPlace, loadBest, saveBest } from "./utils.js";
export class QuizEngine {
    constructor(questions, config) {
        this.config = config;
        this.index = 0;
        this.timerId = null;
        this.remaining = 0;
        this.scoreState = {
            correct: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
        };
        this.missed = [];
        this.paused = false;
        this.questions = [...questions];
        if (config.shuffle)
            shuffleInPlace(this.questions);
    }
    get current() {
        return this.questions[this.index];
    }
    get score() {
        return { ...this.scoreState };
    }
    isFinished() {
        return this.index >= this.questions.length;
    }
    start(onTick, onTimeout) {
        this.stopTimer();
        this.paused = false;
        const currentQuestion = this.current;
        if (!currentQuestion)
            return;
        const second = currentQuestion.seconds && currentQuestion.seconds > 0
            ? currentQuestion.seconds
            : Math.max(1, this.config.perQuestionDefaultSeconds);
        this.remaining = second;
        onTick(this.remaining);
        this.timerId = window.setInterval(() => {
            this.remaining -= 1;
            onTick(this.remaining);
            if (this.remaining <= 0) {
                this.stopTimer();
                onTimeout();
            }
        }, 1000);
    }
    stopTimer() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    answer(value) {
        const currentQuestion = this.current;
        if (!currentQuestion)
            return false;
        const correct = this.isCorrect(currentQuestion, value);
        this.scoreState.total += 1;
        if (correct) {
            this.scoreState.correct += 1;
            this.scoreState.streak += 1;
            if (this.scoreState.streak > this.scoreState.bestStreak) {
                this.scoreState.bestStreak = this.scoreState.streak;
            }
        }
        else {
            this.scoreState.streak = 0;
            const missedEntry = {
                id: currentQuestion.id,
                prompt: currentQuestion.prompt,
                yourAnswer: this.formatYourAnswer(currentQuestion, value),
                correctAnswer: this.formatCorrectAnswer(currentQuestion),
                ...(currentQuestion.explanation
                    ? { explanation: currentQuestion.explanation }
                    : {}),
            };
            this.missed.push(missedEntry);
        }
        // Update "bests" in localStorage
        const bests = loadBest();
        if (this.scoreState.correct > bests.bestScore ||
            this.scoreState.bestStreak > bests.bestStreak) {
            saveBest(Math.max(bests.bestScore, this.scoreState.correct), Math.max(bests.bestStreak, this.scoreState.bestStreak));
        }
        return correct;
    }
    next() {
        this.index += 1;
        return !this.isFinished();
    }
    isCorrect(currentQuestion, value) {
        if (currentQuestion.kind === QuestionKind.Text) {
            return (typeof value === "number" && value === currentQuestion.data.correctIndex);
        }
        else {
            return (typeof value === "boolean" && value === currentQuestion.data.correct);
        }
    }
    formatCorrectAnswer(currentQuestion) {
        if (currentQuestion.kind === QuestionKind.Text) {
            const idx = currentQuestion.data.correctIndex;
            return currentQuestion.data.options[idx] ?? "";
        }
        return currentQuestion.data.correct ? "True" : "False";
    }
    formatYourAnswer(currentQuestion, value) {
        if (currentQuestion.kind === QuestionKind.Text &&
            typeof value === "number") {
            return currentQuestion.data.options[value] ?? "(no answer)";
        }
        if (currentQuestion.kind === QuestionKind.Boolean &&
            typeof value === "boolean") {
            return value ? "True" : "False";
        }
        return "(no answer)";
    }
    recordTimeout() {
        const currentQuestion = this.current;
        if (!currentQuestion)
            return;
        this.scoreState.total += 1;
        this.scoreState.streak = 0;
        const missedEntry = {
            id: currentQuestion.id,
            prompt: currentQuestion.prompt,
            yourAnswer: "(no answer)",
            correctAnswer: this.formatCorrectAnswer(currentQuestion),
            ...(currentQuestion.explanation
                ? { explanation: currentQuestion.explanation }
                : {}),
        };
        this.missed.push(missedEntry);
    }
    summary() {
        return {
            score: this.score,
            missed: [...this.missed],
            bests: loadBest(),
        };
    }
    isPaused() {
        return this.paused;
    }
    schedule(onTick, onTimeout) {
        onTick(this.remaining);
        this.timerId = window.setInterval(() => {
            this.remaining -= 1;
            onTick(this.remaining);
            if (this.remaining <= 0) {
                this.stopTimer();
                onTimeout();
            }
        }, 1000);
    }
    pause() {
        if (this.timerId === null || this.paused)
            return;
        this.stopTimer();
        this.paused = true;
    }
    resume(onTick, onTimeout) {
        if (!this.paused)
            return;
        this.paused = false;
        this.schedule(onTick, onTimeout);
    }
    resetRun() {
        this.stopTimer();
        this.paused = false;
        this.remaining = 0;
        this.index = 0;
        this.scoreState = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
        this.missed = [];
        if (this.config.shuffle) {
            shuffleInPlace(this.questions);
        }
    }
}
