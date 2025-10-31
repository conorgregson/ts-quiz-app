export class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.audioGain = null;
        this.masterVolume = 0.6;
        this.muted = false;
    }
    ensureContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            this.audioGain = this.audioContext.createGain();
            this.audioGain.gain.value = this.muted ? 0 : this.masterVolume;
            this.audioGain.connect(this.audioContext.destination);
        }
    }
    setVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        if (this.audioGain)
            this.audioGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    getVolume() {
        return this.masterVolume;
    }
    setMuted(muteValue) {
        this.muted = muteValue;
        if (this.audioGain)
            this.audioGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    isMuted() {
        return this.muted;
    }
    async play(cue) {
        this.ensureContext();
        if (!this.audioContext || !this.audioGain || this.muted)
            return;
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const enviornemnt = this.audioContext.createGain();
        enviornemnt.gain.value = 0.0001;
        enviornemnt.connect(this.audioGain);
        oscillator.connect(enviornemnt);
        const set = (type, audioFrequency) => {
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(audioFrequency, now);
        };
        const trigger = (duration = 0.18, peak = 0.9) => {
            enviornemnt.gain.cancelScheduledValues(now);
            enviornemnt.gain.setValueAtTime(0.0001, now);
            enviornemnt.gain.linearRampToValueAtTime(peak * this.masterVolume, now + 0.01);
            enviornemnt.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            oscillator.start(now);
            oscillator.stop(now + duration + 0.02);
        };
        switch (cue) {
            case "correct":
                set("sine", 880);
                trigger(0.14, 0.8);
                setTimeout(() => this.play("click"), 1);
                break;
            case "incorrect":
                set("square", 220);
                trigger(0.22, 0.7);
                break;
            case "timeout":
                set("triangle", 196);
                trigger(0.25, 0.7);
                break;
            case "pause":
                set("sine", 440);
                trigger(0.12, 0.5);
                break;
            case "resume":
                set("sine", 660);
                trigger(0.12, 0.6);
                break;
            case "click":
                set("square", 1200);
                trigger(0.05, 0.3);
                break;
        }
    }
}
