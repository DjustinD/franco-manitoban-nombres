const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');
const difficultySelect = document.getElementById('difficulty');
const pauseBtn = document.getElementById('global-pause');

let currentModule = '';
let isRecognitionActive = false;
let isPaused = true;
let score = 0;
let total = 0;
let streak = 0;

// --- Session Log ---
const sessionLog = [];

function log(type, data) {
    const entry = { time: new Date().toISOString(), type, ...data };
    sessionLog.push(entry);
    const label = {
        tts:      '🔊 TTS',
        stt:      '🎤 STT',
        result:   '📊 Result',
        module:   '📂 Module',
        pause:    '⏸️  Pause',
        score:    '✅ Score',
    }[type] ?? type;
    const detail = Object.entries(data).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(' ');
    console.log(`[${entry.time}] ${label}  ${detail}`);
}

function downloadLog() {
    const lines = sessionLog.map(e => {
        const parts = Object.entries(e).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\t');
        return parts;
    });
    const header = 'time\ttype\t[fields...]';
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nombres-log-${new Date().toISOString().replace(/[:.]/g,'-')}.tsv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// --- Core Data ---
const frWords = {
    1: "un", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq",
    6: "six", 7: "sept", 8: "huit", 9: "neuf", 10: "dix",
    11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze",
    16: "seize", 17: "dix-sept", 18: "dix-huit", 19: "dix-neuf", 20: "vingt",
    21: "vingt et un", 22: "vingt-deux", 23: "vingt-trois", 24: "vingt-quatre", 25: "vingt-cinq",
    26: "vingt-six", 27: "vingt-sept", 28: "vingt-huit", 29: "vingt-neuf", 30: "trente",
    31: "trente et un", 32: "trente-deux", 33: "trente-trois", 34: "trente-quatre", 35: "trente-cinq",
    36: "trente-six", 37: "trente-sept", 38: "trente-huit", 39: "trente-neuf", 40: "quarante",
    41: "quarante et un", 42: "quarante-deux", 43: "quarante-trois", 44: "quarante-quatre", 45: "quarante-cinq",
    46: "quarante-six", 47: "quarante-sept", 48: "quarante-huit", 49: "quarante-neuf", 50: "cinquante",
    51: "cinquante et un", 52: "cinquante-deux", 53: "cinquante-trois", 54: "cinquante-quatre", 55: "cinquante-cinq",
    56: "cinquante-six", 57: "cinquante-sept", 58: "cinquante-huit", 59: "cinquante-neuf", 60: "soixante",
    61: "soixante et un", 62: "soixante-deux", 63: "soixante-trois", 64: "soixante-quatre", 65: "soixante-cinq",
    66: "soixante-six", 67: "soixante-sept", 68: "soixante-huit", 69: "soixante-neuf", 70: "soixante-dix",
    71: "soixante et onze", 72: "soixante-douze", 73: "soixante-treize", 74: "soixante-quatorze", 75: "soixante-quinze",
    76: "soixante-seize", 77: "soixante-dix-sept", 78: "soixante-dix-huit", 79: "soixante-dix-neuf", 80: "quatre-vingts",
    81: "quatre-vingt-un", 82: "quatre-vingt-deux", 83: "quatre-vingt-trois", 84: "quatre-vingt-quatre", 85: "quatre-vingt-cinq",
    86: "quatre-vingt-six", 87: "quatre-vingt-sept", 88: "quatre-vingt-huit", 89: "quatre-vingt-neuf", 90: "quatre-vingt-dix",
    91: "quatre-vingt-onze", 92: "quatre-vingt-douze", 93: "quatre-vingt-treize", 94: "quatre-vingt-quatorze", 95: "quatre-vingt-quinze",
    96: "quatre-vingt-seize", 97: "quatre-vingt-dix-sept", 98: "quatre-vingt-dix-huit", 99: "quatre-vingt-dix-neuf", 100: "cent"
};

// --- Speech Engine ---
const synth = window.speechSynthesis;
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'fr-CA';

recognition.onstart = () => { isRecognitionActive = true; micInd.classList.remove('hidden'); };
recognition.onend = () => { isRecognitionActive = false; micInd.classList.add('hidden'); };

function speak(text) {
    return new Promise(resolve => {
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'fr-CA';
        log('tts', { module: currentModule, text });
        utter.onend = resolve;
        synth.speak(utter);
    });
}

function listenForWord(targetWord) {
    return new Promise((resolve) => {
        // Prevent InvalidStateError by checking active status
        if (isRecognitionActive) {
            recognition.stop();
        }
        
        // Small delay ensures the previous session actually closed
        setTimeout(() => {
            try { 
                recognition.start(); 
            } catch(e) { 
                console.error("Mic Error:", e);
                resolve({ success: false, transcript: "" }); 
            }
        }, 300);

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript.toLowerCase();
            const confidence = e.results[0][0].confidence;
            const matched = speechMatch(transcript, targetWord);
            log('stt', { module: currentModule, target: targetWord, heard: transcript, confidence: +confidence.toFixed(3), matched });
            resolve({ success: matched, transcript });
        };
        recognition.onerror = (e) => {
            log('stt', { module: currentModule, target: targetWord, heard: null, error: e.error });
            resolve({ success: false, transcript: '---' });
        };
    });
}

function normalizeForSpeech(str) {
    return str.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function speechMatch(transcript, target) {
    const t = normalizeForSpeech(transcript);
    const w = normalizeForSpeech(target);
    // Also match without trailing 's' (quatre-vingts → quatre vingt)
    return t.includes(w) || t.includes(w.replace(/s$/, ''));
}

function updateScore(correct) {
    total++;
    if (correct) { score++; streak++; }
    else { streak = 0; }
    document.getElementById('score-count').innerText = `✅ ${score} / ${total}`;
    document.getElementById('streak-count').innerText = `🔥 ${streak}`;
    log('score', { correct, score, total, streak });
}

// --- App Flow ---
function toggleProcess() {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? "▶️ Reprendre" : "⏸️ Pause";
    log('pause', { isPaused });
    if (!isPaused) switchModule(currentModule || 'listen');
    else {
        synth.cancel();
        try { recognition.stop(); } catch(e) {}
        status.innerText = "Session en pause";
    }
}

async function switchModule(type) {
    currentModule = type;
    ['listen', 'read', 'spell'].forEach(m => {
        document.getElementById(`btn-${m}`).classList.toggle('active', m === type);
    });
    log('module', { module: type, difficulty: difficultySelect.value });
    if (isPaused) return;

    app.innerHTML = '';
    const num = Math.floor(Math.random() * parseInt(difficultySelect.value)) + 1;
    const word = frWords[num];

    if (type === 'listen') runListenModule(num, word);
    if (type === 'read') runReadModule(num, word);
    if (type === 'spell') runSpellModule(num, word);
}

// --- Modules ---
async function runListenModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <p>${word}</p>
            <div id="reps">⚪ ⚪ ⚪ ⚪ ⚪</div>
            <p id="heard"></p>
            <div class="btn-row">
                <button onclick="switchModule('listen')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;

    let results = [];
    for (let i = 0; i < 5; i++) {
        if (isPaused || currentModule !== 'listen') return;
        await speak(word);
        if (isPaused || currentModule !== 'listen') return;
        status.innerText = `Répétez : ${i + 1}/5`;
        const { success, transcript } = await listenForWord(word);
        const heardEl = document.getElementById('heard');
        if (heardEl) heardEl.innerText = `J'ai entendu : " ${transcript} "`;
        results.push(success);
        const repsEl = document.getElementById('reps');
        if (repsEl) repsEl.innerText = results.map(s => s ? '✅' : '❌').concat(Array(5 - results.length).fill('⚪')).join(' ');
        await new Promise(r => setTimeout(r, 500));
    }

    updateScore(results.filter(Boolean).length >= 3);
    if (!isPaused) setTimeout(() => switchModule('listen'), 1500);
}

async function runReadModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <p>Lisez à voix haute</p>
            <p id="heard"></p>
            <div class="btn-row">
                <button onclick="switchModule('read')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;

    status.innerText = "Parlez maintenant...";
    let firstAttempt = true;
    let success = false;
    while (!success && !isPaused && currentModule === 'read') {
        const res = await listenForWord(word);
        const heardEl = document.getElementById('heard');
        if (heardEl) heardEl.innerText = `J'ai entendu : " ${res.transcript} "`;
        if (res.success) {
            if (firstAttempt) updateScore(true);
            success = true;
            status.innerText = "Excellent! 🎉";
        } else {
            if (firstAttempt) { updateScore(false); firstAttempt = false; }
            status.innerText = `Réessayez ! (${word})`;
        }
    }
    if (success && !isPaused) setTimeout(() => switchModule('read'), 1500);
}

async function runSpellModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <input type="text" id="spellInput" autocomplete="off" autofocus placeholder="Écrivez ici...">
            <div id="correct-ans" style="min-height:1.2rem; margin:10px 0;"></div>
            <div class="btn-row">
                <button id="vBtn">Vérifier</button>
                <button onclick="switchModule('spell')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;

    speak(word);
    const input = document.getElementById('spellInput');
    const ansDiv = document.getElementById('correct-ans');
    let firstAttempt = true;

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('vBtn').click();
    });

    document.getElementById('vBtn').onclick = async () => {
        const userVal = input.value.toLowerCase().trim();
        if (userVal === word) {
            if (firstAttempt) updateScore(true);
            ansDiv.style.color = 'var(--success)';
            ansDiv.innerText = `✅ ${word}`;
            status.innerText = "Excellent!";
            setTimeout(() => { if (!isPaused) switchModule('spell'); }, 1500);
        } else {
            if (firstAttempt) { updateScore(false); firstAttempt = false; }
            ansDiv.style.color = 'var(--error)';
            ansDiv.innerText = `❌ ${word}`;
            status.innerText = "Réessayez...";
            await speak(word);
        }
    };
}

window.onload = () => {
    difficultySelect.onchange = () => { if(!isPaused) switchModule(currentModule); };
    // Set initial view without starting automatically
    app.innerHTML = '<div class="card"><h2>Prêt?</h2><button onclick="toggleProcess()">Démarrer la session</button></div>';
};