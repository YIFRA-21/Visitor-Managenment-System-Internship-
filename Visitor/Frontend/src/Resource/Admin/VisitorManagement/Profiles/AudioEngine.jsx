/**
 * AudioEngine – Enterprise Web Audio API Sound Engine & Text-To-Speech Synthesizer
 *
 * Provides UI sound cues & Web Speech API Text-to-Speech (TTS) spoken instructions
 * for Visual Liveness Detection workflow.
 *
 * WCAG-compliant: global mute toggle with LocalStorage persistence.
 */
const STORAGE_KEY = 'vms_liveness_audio_muted';
export class AudioEngine {
    ctx = null;
    _muted;
    _initialized = false;
    synth = null;
    constructor() {
        this._muted = this.loadMuteState();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        }
    }
    async init() {
        if (this._initialized && this.ctx)
            return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            this._initialized = true;
        }
        catch (err) {
            console.warn('[AudioEngine] Web Audio API not available:', err);
        }
    }
    async destroy() {
        if (this.synth) {
            try {
                this.synth.cancel();
            }
            catch { /* ignore */ }
        }
        if (this.ctx) {
            try {
                await this.ctx.close();
            }
            catch { /* ignore */ }
            this.ctx = null;
            this._initialized = false;
        }
    }
    get muted() {
        return this._muted;
    }
    toggleMute() {
        this._muted = !this._muted;
        this.saveMuteState();
        if (this._muted && this.synth) {
            this.synth.cancel();
        }
        return this._muted;
    }
    setMuted(val) {
        this._muted = val;
        this.saveMuteState();
        if (this._muted && this.synth) {
            this.synth.cancel();
        }
    }
    loadMuteState() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        }
        catch {
            return false;
        }
    }
    saveMuteState() {
        try {
            localStorage.setItem(STORAGE_KEY, String(this._muted));
        }
        catch { /* storage unavailable */ }
    }
    /**
     * Speak instruction aloud using SpeechSynthesis API (TTS)
     * @param text Instruction to read out loud
     */
    speakInstruction(text) {
        if (this._muted || !this.synth)
            return;
        try {
            this.synth.cancel(); // Stop any active speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95; // Clear natural speed
            utterance.pitch = 1.0;
            utterance.lang = 'en-US';
            // Pick a clear voice if available
            const voices = this.synth.getVoices();
            const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en'));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            this.synth.speak(utterance);
        }
        catch (err) {
            console.warn('[AudioEngine] TTS Speech error:', err);
        }
    }
    playTone(frequency, durationMs, gain = 0.12, type = 'sine', startOffset = 0) {
        if (this._muted || !this.ctx)
            return;
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();
        const dur = durationMs / 1000;
        const now = this.ctx.currentTime + startOffset;
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);
        amp.gain.setValueAtTime(0, now);
        amp.gain.linearRampToValueAtTime(gain, now + 0.008);
        amp.gain.setValueAtTime(gain, now + dur - 0.025);
        amp.gain.linearRampToValueAtTime(0, now + dur);
        osc.connect(amp);
        amp.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);
    }
    stepTransition() {
        this.playTone(587.33, 100, 0.10, 'sine');
    }
    stepSuccess() {
        this.playTone(880, 150, 0.13, 'sine');
    }
    verificationComplete() {
        this.playTone(523.25, 140, 0.14, 'sine', 0);
        this.playTone(659.25, 140, 0.14, 'sine', 0.10);
        this.playTone(783.99, 180, 0.16, 'sine', 0.20);
    }
    frameWarning() {
        this.playTone(220, 70, 0.09, 'sine', 0);
        this.playTone(220, 70, 0.09, 'sine', 0.10);
    }
}
export default AudioEngine;
