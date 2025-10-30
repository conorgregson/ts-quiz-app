import { QuizEngine } from "./engine.js";
import { QUESTIONS } from "./questions.js";
import { QuestionKind } from "./enums.js";
import { resetAllProgress } from "./utils.js";
import { SoundEngine } from "./sound.js";

const promptEl = document.getElementById("prompt") as HTMLHeadingElement;
const optionsEl = document.getElementById("options") as HTMLDivElement;
const timerEl = document.getElementById("timer") as HTMLDivElement;
const scoreEl = document.getElementById("score") as HTMLParagraphElement;
const feedbackEl = document.getElementById("feedback") as HTMLDivElement;

const appEl = document.getElementById("app") as HTMLDivElement;
const summaryEl = document.getElementById("summary") as HTMLElement;
const finalLine = document.getElementById("final-line") as HTMLParagraphElement;
const bestsEl = document.getElementById("bests") as HTMLParagraphElement;
const missedList = document.getElementById("missed-list") as HTMLOListElement;

const muteToggle = document.getElementById("mute-toggle") as HTMLInputElement;
const volumeSlider = document.getElementById(
  "volume-slider"
) as HTMLInputElement;
const pauseResumeBtn = document.getElementById(
  "pause-resume-btn"
) as HTMLButtonElement;
const resetRunBtn = document.getElementById(
  "reset-run-btn"
) as HTMLButtonElement;
const resetAllBtn = document.getElementById(
  "reset-all-btn"
) as HTMLButtonElement;
const pausedOverlay = document.getElementById(
  "paused-overlay"
) as HTMLDivElement;

const cleanUIToggle = document.getElementById(
  "clean-ui-toggle"
) as HTMLInputElement;

const summaryRestartBtn = document.getElementById(
  "summary-restart-btn"
) as HTMLButtonElement;

const engine = new QuizEngine(QUESTIONS, {
  perQuestionDefaultSeconds: 20,
  shuffle: true,
});
const soundEffect = new SoundEngine();

resetRunBtn.addEventListener("click", restartQuiz);
summaryRestartBtn.addEventListener("click", restartQuiz);

function renderScore() {
  const scoreObject = engine.score;
  scoreEl.textContent = `Score: ${scoreObject.correct}/${scoreObject.total} • Streak: ${scoreObject.streak} (Best: ${scoreObject.bestStreak})`;
}

function clearOptions() {
  optionsEl.innerHTML = "";
}

function renderQuestion() {
  const question = engine.current;
  if (!question) return;

  feedbackEl.textContent = "";
  promptEl.textContent = question.prompt;
  clearOptions();

  if (question.kind === QuestionKind.Text) {
    question.data.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.onclick = () => handleAnswer(QuestionKind.Text, index);
      optionsEl.appendChild(btn);
    });
  } else {
    ["True", "False"].forEach((label, index) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.onclick = () => {
        soundEffect.play("click");
        handleAnswer(QuestionKind.Boolean, index === 0);
      };
      optionsEl.appendChild(btn);
    });
  }
}

function restartQuiz() {
  soundEffect.play("click");
  engine.resetRun();
  setPausedUI(false);
  appEl.hidden = false;
  summaryEl.hidden = true;
  step();
}

function renderSummary() {
  appEl.hidden = true;
  summaryEl.hidden = false;

  const { score, missed, bests } = engine.summary();
  finalLine.textContent = `You scored: ${score.correct}/${score.total} • Best streak (this run): ${score.bestStreak}`;
  bestsEl.textContent = `Best score overall: ${bests.bestScore} • Best streak overall: ${bests.bestStreak}`;

  missedList.innerHTML = "";
  if (missed.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Perfect Score — nothing missed";
    missedList.appendChild(li);
  } else {
    for (const missedQuestion of missed) {
      const li = document.createElement("li");

      const strong = document.createElement("strong");
      strong.textContent = missedQuestion.prompt;
      li.appendChild(strong);

      li.appendChild(document.createElement("br"));

      const yourAnswer = document.createElement("div");
      yourAnswer.append("Your answer: ");
      const yourAnswerEm = document.createElement("em");
      yourAnswerEm.textContent = missedQuestion.yourAnswer;
      yourAnswer.appendChild(yourAnswerEm);
      li.appendChild(yourAnswer);

      const correctAnswer = document.createElement("div");
      correctAnswer.append("Correct answer: ");
      const correctAnswerEm = document.createElement("em");
      correctAnswerEm.textContent = missedQuestion.correctAnswer;
      correctAnswer.appendChild(correctAnswerEm);
      li.appendChild(correctAnswer);

      if (missedQuestion.explanation) {
        li.appendChild(document.createElement("br"));
        const explanationText = document.createElement("small");
        const explanationLabel = document.createElement("span");
        explanationLabel.className = "label";
        explanationLabel.textContent = "Explanation: ";
        explanationText.append(
          explanationLabel,
          document.createTextNode(missedQuestion.explanation)
        );
        li.appendChild(explanationText);
      }

      missedList.appendChild(li);
    }
  }
}

function setPausedUI(paused: boolean) {
  appEl.classList.toggle("is-paused", paused);
  pausedOverlay.classList.toggle("show", paused);
  pausedOverlay.classList.toggle("hidden", !paused);

  pauseResumeBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
  pauseResumeBtn.dataset.mode = paused ? "resume" : "pause";
}

function step() {
  if (engine.isFinished()) {
    engine.stopTimer();
    renderSummary();
    return;
  }
  renderScore();
  renderQuestion();
  engine.start(
    (seconds) => (timerEl.textContent = `${seconds}s`),
    () => {
      soundEffect.play("timeout");
      engine.recordTimeout();
      renderScore();
      engine.next();
      step();
    }
  );
}

function handleAnswer(kind: QuestionKind, value: number | boolean) {
  const correct = engine.answer(value);
  const question = engine.current;

  feedbackEl.textContent = correct
    ? "Correct ✅"
    : `Incorrect ❌${
        question?.explanation ? ` — ${question.explanation}` : ""
      }`;

  soundEffect.play(correct ? "correct" : "incorrect");
  renderScore();

  engine.stopTimer();
  engine.next();
  step();
}

muteToggle.addEventListener("change", () =>
  soundEffect.setMuted(muteToggle.checked)
);
volumeSlider.addEventListener("input", () =>
  soundEffect.setVolume(Number(volumeSlider.value))
);

pauseResumeBtn.addEventListener("click", () => {
  if (engine.isPaused()) {
    soundEffect.play("resume");
    engine.resume(
      (seconds) => (timerEl.textContent = `${seconds}s`),
      () => {
        soundEffect.play("timeout");
        engine.next();
        step();
      }
    );
    setPausedUI(false);
  } else {
    soundEffect.play("pause");
    engine.pause();
    setPausedUI(true);
  }
});

function onConfirm(
  btn: HTMLButtonElement,
  message: string,
  handler: () => void
) {
  btn.addEventListener("click", () => {
    if (confirm(message)) handler();
  });
}

onConfirm(resetAllBtn, "Reset ALL progress? This cannot be undone.", () => {
  soundEffect.play("click");
  resetAllProgress();
  engine.resetRun();
  setPausedUI(false);
  appEl.hidden = false;
  summaryEl.hidden = true;
  step();
});

function setCleanUI(on: boolean) {
  document.body.classList.toggle("clean-ui", on);
  if (cleanUIToggle) cleanUIToggle.checked = on;
}
cleanUIToggle?.addEventListener("change", () =>
  setCleanUI(cleanUIToggle.checked)
);

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    setCleanUI(!document.body.classList.contains("clean-ui"));
  }

  if (e.code === "Space" || e.key === "") {
    if (engine.isPaused()) {
      e.preventDefault();
      soundEffect.play("resume");
      engine.resume(
        (seconds) => (timerEl.textContent = `${seconds}s`),
        () => {
          soundEffect.play("timeout");
          engine.next();
          step();
        }
      );
    }
  }
});

pausedOverlay.addEventListener("click", () => {
  if (engine.isPaused()) {
    soundEffect.play("resume");
    engine.resume(
      (seconds) => (timerEl.textContent = `${seconds}s`),
      () => {
        soundEffect.play("timeout");
        engine.next();
        step();
      }
    );
    setPausedUI(false);
  }
});

summaryEl.hidden = true;
setPausedUI(false);
step();
