// PWA Service Worker Registrierung (Deaktiviert für Vorschau)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}

// --- KONFIGURATION & THEMES ---
const THEMES = {
    classic: { fBg: '#855E4D', fTxt: '#F5E2DA', bBg: '#F5E2DA', bTxt: '#855E4D' },
    sea: { fBg: '#1e3a8a', fTxt: '#bfdbfe', bBg: '#bfdbfe', bTxt: '#1e3a8a' },
    forest: { fBg: '#064e3b', fTxt: '#d1fae5', bBg: '#d1fae5', bTxt: '#064e3b' },
    midnight: { fBg: '#171717', fTxt: '#e5e5e5', bBg: '#404040', bTxt: '#f5f5f5' }
};

let state = {
    focusDuration: 25 * 60, // Standard 25m
    breakDuration: 5 * 60,  // Standard 5m
    focusRemaining: 25 * 60,
    breakRemaining: 5 * 60,
    currentMode: 'focus',
    isRunning: false,
    autoSwitch: true,
    bellVolume: 0.7,
    isAmbientPlaying: false,
    activeTheme: 'sea',
    panelOrder: 'focus-first', // Standard-Reihenfolge
    focusAmbientType: 'brown',
    breakAmbientType: 'rain',
    focusAmbientVolume: 0.3,
    breakAmbientVolume: 0.3,
    focusEndSound: 'bell',
    breakEndSound: 'harp',
    startTimestamp: null,
    endTimestamp: null
};

let timerInterval = null;
let audioCtx = null;
let ambientSource = null;
let ambientGainNode = null;
let isEditingInline = false;
let previewSource = null;
let previewGainNode = null;
let activePreviewPhase = null;

function setTheme(themeKey) {
    state.activeTheme = themeKey;
    const t = THEMES[themeKey];
    const root = document.documentElement;
    root.style.setProperty('--focus-bg', t.fBg);
    root.style.setProperty('--focus-text', t.fTxt);
    root.style.setProperty('--break-bg', t.bBg);
    root.style.setProperty('--break-text', t.bTxt);
}

function applyPanelOrder() {
    const focusPanel = document.getElementById('panel-focus');
    const breakPanel = document.getElementById('panel-break');
    if (state.panelOrder === 'break-first') {
        focusPanel.style.order = '2';
        breakPanel.style.order = '1';
    } else {
        focusPanel.style.order = '1';
        breakPanel.style.order = '2';
    }
}

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playAlarmSound(soundType) {
    if (soundType === 'none') return;
    initAudio();
    const now = audioCtx.currentTime;
    const mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(state.bellVolume, now + 0.01);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);
    mainGain.connect(audioCtx.destination);

    if (soundType === 'bell') {
        [220, 330, 440, 554, 880].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0.5 / (i + 1), now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + (4.0 / (i + 1)));
            osc.connect(g); g.connect(mainGain);
            osc.start(); osc.stop(now + 4.0);
        });
    } else if (soundType === 'digital') {
        const delays = [0, 0.25, 0.5];
        delays.forEach(delay => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(950, now + delay);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(0.3, now + delay + 0.01);
            g.gain.setValueAtTime(0.3, now + delay + 0.12);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.15);
            osc.connect(g); g.connect(mainGain);
            osc.start(now + delay); osc.stop(now + delay + 0.2);
        });
    } else if (soundType === 'harp') {
        const harpFreqs = [261.63, 329.63, 392.00, 523.25, 659.25];
        harpFreqs.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);
            g.gain.setValueAtTime(0, now + idx * 0.15);
            g.gain.linearRampToValueAtTime(0.25, now + idx * 0.15 + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.6);
            osc.connect(g); g.connect(mainGain);
            osc.start(now + idx * 0.15); osc.stop(now + idx * 0.15 + 2.0);
        });
    } else if (soundType === 'triumph') {
        const notes = [196.00, 246.94, 293.66, 392.00, 493.88, 587.33];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            g.gain.setValueAtTime(0, now + idx * 0.08);
            g.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.4);
            osc.connect(filter); filter.connect(g); g.connect(mainGain);
            osc.start(now + idx * 0.08); osc.stop(now + idx * 0.08 + 1.8);
        });
    }
}

function createNoiseBuffer(type) {
    const duration = 10;
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const t = i / sampleRate;
        if (type === 'white') {
            data[i] = white * 0.35;
        } else if (type === 'pink') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            data[i] = pink * 0.06;
        } else if (type === 'brown') {
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 1.3;
        } else if (type === 'rain') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            const droplet = Math.random() > 0.9985 ? (Math.random() * 0.35) : 0;
            data[i] = (pink * 0.06) + droplet;
        } else if (type === 'waves') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            const lfo = 0.55 + 0.45 * Math.sin((2 * Math.PI * t) / duration - Math.PI / 2);
            data[i] = pink * 0.07 * lfo;
        } else if (type === 'fireplace') {
            data[i] = (lastOut + (0.018 * white)) / 1.018;
            lastOut = data[i];
            data[i] *= 0.65;
            if (Math.random() > 0.9995) {
                data[i] += (Math.random() * 2 - 1) * 0.28;
            }
        } else if (type === 'lofi') {
            const lofiChords = [
                [164.81, 196.00, 246.94, 293.66],
                [220.00, 261.63, 329.63, 392.00],
                [146.83, 174.61, 220.00, 261.63],
                [196.00, 246.94, 293.66, 349.23]
            ];
            let chordIdx = Math.floor(t / 2.5) % 4;
            let chordTime = t % 2.5;
            let env = 1.0;
            if (chordTime < 0.3) env = chordTime / 0.3;
            else if (chordTime > 2.2) env = (2.5 - chordTime) / 0.3;
            let waveSum = 0;
            const freqs = lofiChords[chordIdx];
            freqs.forEach(f => { waveSum += Math.sin(2 * Math.PI * f * t) * 0.22; });
            let crackle = 0;
            if (Math.random() > 0.9996) crackle = (Math.random() * 2 - 1) * 0.4;
            data[i] = (waveSum * env * 0.15) + crackle * 0.03;
        } else if (type === 'lofi_nostalgia') {
            const chords = [
                [87.31, 220.00, 261.63, 329.63],
                [98.00, 246.94, 293.66, 329.63],
                [82.41, 196.00, 246.94, 293.66],
                [110.00, 261.63, 329.63, 392.00]
            ];
            let chordIdx = Math.floor(t / 2.5) % 4;
            let chordTime = t % 2.5;
            let env = 1.0;
            if (chordTime < 0.3) env = chordTime / 0.3;
            else if (chordTime > 2.2) env = (2.5 - chordTime) / 0.3;
            let wow = 0.00025 * Math.sin(2 * Math.PI * 3.2 * t);
            let waveSum = 0;
            const freqs = chords[chordIdx];
            freqs.forEach(f => {
                let p = 2 * Math.PI * f * (t + wow);
                waveSum += Math.sin(p) * 0.18 + Math.sin(p * 2) * 0.05;
            });
            let crackle = 0;
            if (Math.random() > 0.9997) crackle = (Math.random() * 2 - 1) * 0.35;
            data[i] = (waveSum * env * 0.13) + crackle * 0.02;
        } else if (type === 'lofi_cozy') {
            const chords = [
                [110.00, 130.81, 196.00, 246.94],
                [146.83, 185.00, 220.00, 329.63],
                [98.00, 146.83, 185.00, 220.00],
                [130.81, 164.81, 196.00, 246.94]
            ];
            let chordIdx = Math.floor(t / 2.5) % 4;
            let chordTime = t % 2.5;
            let env = 1.0;
            if (chordTime < 0.4) env = chordTime / 0.4;
            else if (chordTime > 2.1) env = (2.5 - chordTime) / 0.4;
            let waveSum = 0;
            const freqs = chords[chordIdx];
            freqs.forEach((f, idx) => {
                let detune = 1.0008 * (idx - 1.5);
                waveSum += Math.sin(2 * Math.PI * f * detune * t) * 0.2;
            });
            let chime = 0;
            if (chordTime > 0.6 && chordTime < 1.1) {
                let chimeT = chordTime - 0.6;
                chime = Math.sin(2 * Math.PI * 880 * chimeT) * Math.exp(-12 * chimeT) * 0.06;
            }
            let crackle = 0;
            if (Math.random() > 0.9995) crackle = (Math.random() * 2 - 1) * 0.3;
            data[i] = (waveSum * env * 0.12) + chime + crackle * 0.02;
        } else if (type === 'lofi_sunset') {
            const chords = [
                [130.81, 164.81, 196.00, 246.94],
                [87.31, 174.61, 220.00, 261.63],
                [146.83, 174.61, 220.00, 261.63],
                [98.00, 146.83, 246.94, 293.66]
            ];
            let chordIdx = Math.floor(t / 2.5) % 4;
            let chordTime = t % 2.5;
            let env = 1.0;
            if (chordTime < 0.3) env = chordTime / 0.3;
            else if (chordTime > 2.2) env = (2.5 - chordTime) / 0.3;
            let filterSweep = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.08 * t);
            let waveSum = 0;
            const freqs = chords[chordIdx];
            freqs.forEach(f => {
                let base = Math.sin(2 * Math.PI * f * t) * 0.18;
                let harmonic = Math.sin(2 * Math.PI * f * 2 * t) * 0.05 * filterSweep;
                waveSum += base + harmonic;
            });
            let crackle = 0;
            if (Math.random() > 0.9997) crackle = (Math.random() * 2 - 1) * 0.25;
            data[i] = (waveSum * env * 0.14) + crackle * 0.015;
        } else if (type === 'space') {
            const f1 = 55.0;
            const f2 = 82.41;
            let spaceWave = Math.sin(2 * Math.PI * f1 * t) * 0.4 + Math.sin(2 * Math.PI * f2 * t) * 0.3;
            let starPing = 0;
            if (t % 4.0 < 0.1) {
                const pingTime = t % 4.0;
                starPing = Math.sin(2 * Math.PI * 880 * pingTime) * Math.exp(-15 * pingTime) * 0.1;
            }
            data[i] = (spaceWave + starPing) * 0.12;
        } else if (type === 'birds') {
            let birdChirp = 0;
            const cycle = t % 3.0;
            if (cycle > 1.2 && cycle < 1.45) {
                const chirpT = cycle - 1.2;
                const freq = 2200 + 1200 * Math.sin(2 * Math.PI * 8 * chirpT) + 400 * chirpT;
                birdChirp = Math.sin(2 * Math.PI * freq * chirpT) * Math.exp(-8 * chirpT) * 0.12;
            }
            data[i] = birdChirp;
        }
    }
    return buffer;
}

function startAmbientSound() {
    initAudio();
    stopAmbientSoundOnly();
    const activeType = state.currentMode === 'focus' ? state.focusAmbientType : state.breakAmbientType;
    const activeVolume = state.currentMode === 'focus' ? state.focusAmbientVolume : state.breakAmbientVolume;
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = createNoiseBuffer(activeType);
    ambientSource.loop = true;
    ambientGainNode = audioCtx.createGain();
    ambientGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    ambientGainNode.gain.linearRampToValueAtTime(activeVolume, audioCtx.currentTime + 1.5);
    ambientSource.connect(ambientGainNode);
    ambientGainNode.connect(audioCtx.destination);
    ambientSource.start();
    state.isAmbientPlaying = true;
    updateAmbientUI();
}

function stopAmbientSoundOnly() {
    if (ambientSource) {
        try {
            ambientGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
            const s = ambientSource;
            setTimeout(() => s.stop(), 900);
        } catch (e) {}
        ambientSource = null;
    }
    state.isAmbientPlaying = false;
    updateAmbientUI();
}

function toggleAmbientSound() { state.isAmbientPlaying ? stopAmbientSoundOnly() : startAmbientSound(); }

function updateAmbientUI() {
    document.getElementById('sound-on-icon').classList.toggle('hidden', !state.isAmbientPlaying);
    document.getElementById('sound-off-icon').classList.toggle('hidden', state.isAmbientPlaying);
    document.getElementById('btn-sound-ambient').classList.toggle('text-emerald-400', state.isAmbientPlaying);
}

function toggleTimer() { state.isRunning ? pauseTimer() : startTimer(); }

function startTimer() {
    if (state.isRunning || isEditingInline) return;
    state.isRunning = true;
    const now = new Date();
    const remaining = state.currentMode === 'focus' ? state.focusRemaining : state.breakRemaining;
    state.startTimestamp = new Date(now);
    state.endTimestamp = new Date(now.getTime() + remaining * 1000);
    stopPreviewAmbient();
    if (!state.isAmbientPlaying) startAmbientSound();
    document.getElementById('play-icon').classList.add('hidden');
    document.getElementById('pause-icon').classList.remove('hidden');
    updateDisplay();
    timerInterval = setInterval(() => {
        const rem = state.currentMode === 'focus' ? 'focusRemaining' : 'breakRemaining';
        if (state[rem] > 0) {
            state[rem]--;
            updateDisplay();
        } else {
            handlePhaseEnd();
        }
    }, 1000);
}

function pauseTimer() {
    state.isRunning = false;
    clearInterval(timerInterval);
    document.getElementById('play-icon').classList.remove('hidden');
    document.getElementById('pause-icon').classList.add('hidden');
    stopAmbientSoundOnly();
    updateDisplay();
}

function handlePhaseEnd() {
    const finishedMode = state.currentMode;
    pauseTimer();
    const activeAlarm = finishedMode === 'focus' ? state.focusEndSound : state.breakEndSound;
    playAlarmSound(activeAlarm);
    if (finishedMode === 'focus') {
        state.focusRemaining = state.focusDuration;
    } else {
        state.breakRemaining = state.breakDuration;
    }
    if (state.autoSwitch) {
        setTimeout(() => {
            switchActiveMode(finishedMode === 'focus' ? 'break' : 'focus');
            startTimer();
        }, 1500);
    } else {
        updateDisplay();
    }
}

function updateActivePanelVisualState() {
    const focusPanel = document.getElementById('panel-focus');
    const breakPanel = document.getElementById('panel-break');
    focusPanel.classList.toggle('opacity-40', state.currentMode !== 'focus');
    focusPanel.classList.toggle('grayscale-[15%]', state.currentMode !== 'focus');
    breakPanel.classList.toggle('opacity-40', state.currentMode !== 'break');
    breakPanel.classList.toggle('grayscale-[15%]', state.currentMode !== 'break');
}

function switchActiveMode(mode) {
    if (isEditingInline) return;
    if (state.currentMode === mode) return;
    const wasRunning = state.isRunning;
    pauseTimer();
    state.currentMode = mode;
    updateActivePanelVisualState();
    state.startTimestamp = null;
    state.endTimestamp = null;
    updateDisplay();
    if (wasRunning) {
        startTimer();
    } else if (state.isAmbientPlaying) {
        startAmbientSound();
    }
}

function skipOrReset() {
    pauseTimer();
    state.focusRemaining = state.focusDuration;
    state.breakRemaining = state.breakDuration;
    state.startTimestamp = null;
    state.endTimestamp = null;
    switchActiveMode(state.currentMode === 'focus' ? 'break' : 'focus');
}

function formatTime(seconds) {
    return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
}

function formatClock(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function updateDisplay() {
    document.getElementById('time-focus').innerText = formatTime(state.focusRemaining);
    document.getElementById('time-break').innerText = formatTime(state.breakRemaining);
    const circumference = 276.46;
    const focusRatio = state.focusRemaining / state.focusDuration;
    const focusFilledLength = focusRatio * circumference;
    const focusCircle = document.getElementById('focus-circle');
    focusCircle.setAttribute('stroke-dasharray', `${focusFilledLength} ${circumference}`);
    focusCircle.setAttribute('stroke-dashoffset', '0');
    const fRot = - (focusRatio * 360);
    document.getElementById('focus-handle').style.transform = `rotate(${fRot}deg)`;
    const breakRatio = state.breakRemaining / state.breakDuration;
    const breakFilledLength = breakRatio * circumference;
    const breakCircle = document.getElementById('break-circle');
    breakCircle.setAttribute('stroke-dasharray', `${breakFilledLength} ${circumference}`);
    breakCircle.setAttribute('stroke-dashoffset', '0');
    let displayStartStr = "";
    let displayEndStr = "";
    let prefix = "";
    if (state.isRunning && state.startTimestamp && state.endTimestamp) {
        displayStartStr = formatClock(state.startTimestamp);
        displayEndStr = formatClock(state.endTimestamp);
        prefix = "Intervall";
    } else {
        const now = new Date();
        const remainingSec = state.currentMode === 'focus' ? state.focusRemaining : state.breakRemaining;
        const endProj = new Date(now.getTime() + remainingSec * 1000);
        displayStartStr = `Jetzt (${formatClock(now)})`;
        displayEndStr = formatClock(endProj);
        // prefix = "Projektion";
    }
    if (state.currentMode === 'focus') {
        document.getElementById('bounds-focus').innerText = `${prefix} ${displayStartStr} ➔ ${displayEndStr}`;
        document.getElementById('bounds-focus').style.opacity = "1.0";
        document.getElementById('bounds-break').style.opacity = "0.4";
        document.getElementById('bounds-break').innerText = `Pause: ${Math.round(state.breakDuration / 60)} Min`;
    } else {
        document.getElementById('bounds-break').innerText = `${prefix} ${displayStartStr} ➔ ${displayEndStr}`;
        document.getElementById('bounds-break').style.opacity = "1.0";
        document.getElementById('bounds-focus').style.opacity = "0.4";
        document.getElementById('bounds-focus').innerText = `Fokus: ${Math.round(state.focusDuration / 60)} Min`;
    }
}

function startInlineEdit(event, mode) {
    event.stopPropagation();
    if (isEditingInline) return;
    isEditingInline = true;
    pauseTimer();
    state.startTimestamp = null;
    state.endTimestamp = null;
    const displayEl = document.getElementById(`time-${mode}`);
    const currentSeconds = mode === 'focus' ? state.focusDuration : state.breakDuration;
    const currentFormatted = formatTime(currentSeconds);
    const wrapper = document.createElement('div');
    wrapper.className = 'relative flex flex-col items-center justify-center';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentFormatted;
    input.placeholder = "MM:SS oder MMSS";
    input.className = 'bg-transparent text-center focus:outline-none font-light border-b-2 border-dashed border-current w-[6ch] timer-digits transition-all duration-200';
    input.style.fontSize = 'inherit';
    input.style.fontFamily = 'inherit';
    input.style.color = 'inherit';
    const hint = document.createElement('div');
    hint.className = 'absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs md:text-sm font-normal tracking-wide opacity-90 py-1.5 px-3.5 rounded bg-stone-950 text-stone-300 border border-stone-800 pointer-events-none whitespace-nowrap z-30 shadow-md';
    hint.innerText = "Enter zum Speichern (z.B. 1530 für 15:30, oder 25 für 25:00)";
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());
    const saveAndExit = () => {
        if (!isEditingInline) return;
        const rawVal = input.value.trim();
        let totalSeconds = currentSeconds;
        if (rawVal) {
            if (rawVal.includes(':')) {
                const parts = rawVal.split(':');
                const m = parseInt(parts[0]) || 0;
                const s = parseInt(parts[1]) || 0;
                totalSeconds = m * 60 + s;
            } else {
                const cleanDigits = rawVal.replace(/\D/g, '');
                if (cleanDigits.length > 0) {
                    if (cleanDigits.length <= 2) {
                        totalSeconds = parseInt(cleanDigits) * 60;
                    } else {
                        const s = parseInt(cleanDigits.slice(-2)) || 0;
                        const m = parseInt(cleanDigits.slice(0, -2)) || 0;
                        totalSeconds = m * 60 + s;
                    }
                }
            }
        }
        if (totalSeconds < 5) totalSeconds = 5;
        if (totalSeconds > 999 * 60) totalSeconds = 999 * 60;
        if (mode === 'focus') {
            state.focusDuration = totalSeconds;
            state.focusRemaining = totalSeconds;
        } else {
            state.breakDuration = totalSeconds;
            state.breakRemaining = totalSeconds;
        }
        saveLocalState();
        isEditingInline = false;
        updateDisplay();
    };
    const cancelEdit = () => {
        isEditingInline = false;
        updateDisplay();
    };
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveAndExit();
        else if (e.key === 'Escape') cancelEdit();
    });
    input.addEventListener('blur', () => saveAndExit());
    wrapper.appendChild(input);
    wrapper.appendChild(hint);
    displayEl.innerHTML = '';
    displayEl.appendChild(wrapper);
    input.focus();
    input.select();
}

function saveLocalState() {
    localStorage.setItem('split_timer_v1_9', JSON.stringify({
        fD: state.focusDuration, bD: state.breakDuration,
        fAT: state.focusAmbientType, bAT: state.breakAmbientType,
        fAV: state.focusAmbientVolume, bAV: state.breakAmbientVolume,
        fES: state.focusEndSound, bES: state.breakEndSound,
        theme: state.activeTheme, pO: state.panelOrder
    }));
}

function toggleSettingsModal(s) {
    const m = document.getElementById('modal-settings');
    if (s) {
        document.getElementById('input-focus-time').value = state.focusDuration / 60;
        document.getElementById('input-break-time').value = state.breakDuration / 60;
        document.getElementById('select-focus-ambient-type').value = state.focusAmbientType;
        document.getElementById('select-break-ambient-type').value = state.breakAmbientType;
        document.getElementById('range-focus-ambient-vol').value = state.focusAmbientVolume * 100;
        document.getElementById('range-break-ambient-vol').value = state.breakAmbientVolume * 100;
        document.getElementById('label-focus-ambient-vol').innerText = `${Math.round(state.focusAmbientVolume * 100)}%`;
        document.getElementById('label-break-ambient-vol').innerText = `${Math.round(state.breakAmbientVolume * 100)}%`;
        document.getElementById('select-focus-end-sound').value = state.focusEndSound;
        document.getElementById('select-break-end-sound').value = state.breakEndSound;
        document.getElementById('select-panel-order').value = state.panelOrder;
        m.classList.remove('opacity-0', 'pointer-events-none');
        m.firstElementChild.classList.remove('scale-95');
    } else {
        stopPreviewAmbient();
        m.classList.add('opacity-0', 'pointer-events-none');
        m.firstElementChild.classList.add('scale-95');
    }
}

function saveSettings() {
    stopPreviewAmbient();
    state.focusDuration = (parseInt(document.getElementById('input-focus-time').value) || 25) * 60;
    state.breakDuration = (parseInt(document.getElementById('input-break-time').value) || 5) * 60;
    state.focusAmbientType = document.getElementById('select-focus-ambient-type').value;
    state.breakAmbientType = document.getElementById('select-break-ambient-type').value;
    state.focusAmbientVolume = document.getElementById('range-focus-ambient-vol').value / 100;
    state.breakAmbientVolume = document.getElementById('range-break-ambient-vol').value / 100;
    state.focusEndSound = document.getElementById('select-focus-end-sound').value;
    state.breakEndSound = document.getElementById('select-break-end-sound').value;
    state.panelOrder = document.getElementById('select-panel-order').value;
    if (!state.isRunning) {
        state.currentMode = state.panelOrder === 'break-first' ? 'break' : 'focus';
        updateActivePanelVisualState();
        state.focusRemaining = state.focusDuration;
        state.breakRemaining = state.breakDuration;
        state.startTimestamp = null;
        state.endTimestamp = null;
    }
    saveLocalState();
    applyPanelOrder();
    updateDisplay();
    toggleSettingsModal(false);
    if (state.isAmbientPlaying) startAmbientSound();
}

function triggerAlarmPreview(phase) {
    initAudio();
    const soundElement = document.getElementById(`select-${phase}-end-sound`);
    playAlarmSound(soundElement.value);
}

function togglePreviewAmbient(phase) {
    initAudio();
    if (activePreviewPhase === phase) {
        stopPreviewAmbient();
        return;
    }
    stopPreviewAmbient();
    const type = document.getElementById(`select-${phase}-ambient-type`).value;
    const volume = parseFloat(document.getElementById(`range-${phase}-ambient-vol`).value) / 100;
    previewSource = audioCtx.createBufferSource();
    previewSource.buffer = createNoiseBuffer(type);
    previewSource.loop = true;
    previewGainNode = audioCtx.createGain();
    previewGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    previewGainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.1);
    previewSource.connect(previewGainNode);
    previewGainNode.connect(audioCtx.destination);
    previewSource.start();
    activePreviewPhase = phase;
    updatePreviewButtonsUI();
}

function stopPreviewAmbient() {
    if (previewSource) {
        try { previewSource.stop(); } catch (e) {}
        previewSource = null;
    }
    activePreviewPhase = null;
    updatePreviewButtonsUI();
}

function updatePreviewButtonsUI() {
    ['focus', 'break'].forEach(phase => {
        const btn = document.getElementById(`btn-preview-ambient-${phase}`);
        if (!btn) return;
        const isCurrent = activePreviewPhase === phase;
        const accentColor = phase === 'focus' ? 'emerald' : 'rose';
        if (isCurrent) {
            btn.className = `text-[10px] text-${accentColor}-400 hover:text-${accentColor}-300 flex items-center gap-1 bg-${accentColor}-500/25 px-1.5 py-0.5 rounded transition-all scale-105 font-semibold select-none`;
            btn.innerHTML = `<svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Stopp</span>`;
        } else {
            btn.className = `text-[10px] text-${accentColor}-400 hover:text-${accentColor}-300 flex items-center gap-1 bg-${accentColor}-500/10 px-1.5 py-0.5 rounded transition-all select-none`;
            btn.innerHTML = `<svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Testen</span>`;
        }
    });
}

setInterval(() => {
    if (!state.isRunning && !isEditingInline) updateDisplay();
}, 1000);

window.addEventListener('DOMContentLoaded', () => {
    const saved = JSON.parse(localStorage.getItem('split_timer_v1_9') || '{}');
    if (saved.fD !== undefined) {
        state.focusDuration = saved.fD;
        state.breakDuration = saved.bD;
        state.focusAmbientType = saved.fAT || 'brown';
        state.breakAmbientType = saved.bAT || 'rain';
        state.focusAmbientVolume = saved.fAV !== undefined ? saved.fAV : 0.3;
        state.breakAmbientVolume = saved.bAV !== undefined ? saved.bAV : 0.3;
        state.focusEndSound = saved.fES || 'bell';
        state.breakEndSound = saved.bES || 'harp';
        state.panelOrder = saved.pO || 'focus-first';
        setTheme(saved.theme || 'sea');
    } else {
        setTheme('sea');
    }
    state.focusRemaining = state.focusDuration;
    state.breakRemaining = state.breakDuration;
    applyPanelOrder();
    state.currentMode = state.panelOrder === 'break-first' ? 'break' : 'focus';
    updateActivePanelVisualState();
    lucide.createIcons();
    updateDisplay();
    ['focus', 'break'].forEach(phase => {
        const selectEl = document.getElementById(`select-${phase}-ambient-type`);
        const rangeEl = document.getElementById(`range-${phase}-ambient-vol`);
        selectEl.addEventListener('change', () => {
            if (activePreviewPhase === phase) {
                togglePreviewAmbient(phase);
                togglePreviewAmbient(phase);
            }
        });
        rangeEl.addEventListener('input', (e) => {
            document.getElementById(`label-${phase}-ambient-vol`).innerText = `${e.target.value}%`;
            if (activePreviewPhase === phase && previewGainNode && audioCtx) {
                const newVol = parseFloat(e.target.value) / 100;
                previewGainNode.gain.setValueAtTime(newVol, audioCtx.currentTime);
            }
        });
    });
});
