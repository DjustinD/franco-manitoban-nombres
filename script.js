const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');
const difficultySelect = document.getElementById('difficulty');

let currentModule = '';
let isRecognitionActive = false;
let isPaused = true; 

// --- Core Data ---
const frWords = {
    1: "un", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six", 7: "sept", 8: "huit", 9: "neuf", 10: "dix",
    11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze", 16: "seize", 17: "dix-sept", 18: "dix-huit", 19: "dix-neuf",
    20: "vingt", 21: "vingt et un", 22: "vingt-deux", 23: "vingt-trois", 24: "vingt-quatre", 25: "vingt-cinq", 26: "vingt-six", 27: "vingt-sept", 28: "vingt-huit", 29: "vingt-neuf",
    30: "trente", 31: "trente et un", 32: "trente-deux", 33: "trente-trois", 34: "trente-quatre", 35: "trente-cinq", 36: "trente-six", 37: "trente-sept", 38: "trente-huit", 39: "trente-neuf",
    40: "quarante", 41: "quarante et un", 42: "quarante-deux", 43: "quarante-trois", 44: "quarante-quatre", 45: "quarante-cinq", 46: "quarante-six", 47: "quarante-sept", 48: "quarante-huit", 49: "quarante-neuf",
    50: "cinquante", 51: "cinquante et un", 52: "cinquante-deux", 53: "cinquante-trois", 54: "cinquante-quatre", 55: "cinquante-cinq", 56: "cinquante-six", 57: "cinquante-sept", 58: "cinquante-huit", 59: "cinquante-neuf",
    60: "soixante", 61: "soixante et un", 62: "soixante-deux", 63: "soixante-trois", 64: "soixante-quatre", 65: "soixante-cinq", 66: "soixante-six", 67: "soixante-sept", 68: "soixante-huit", 69: "soixante-neuf",
    70: "soixante-dix", 71: "soixante et onze", 72: "soixante-douze", 73: "soixante-treize", 74: "soixante-quatorze", 75: "soixante-quinze", 76: "soixante-seize", 77: "soixante-dix-sept", 78: "soixante-dix-huit", 79: "soixante-dix-neuf",
    80: "quatre-vingts", 81: "quatre-vingt-un", 82: "quatre-vingt-deux", 83: "quatre-vingt-trois", 84: "quatre-vingt-quatre", 85: "quatre-vingt-cinq", 86: "quatre-vingt-six", 87: "quatre-vingt-sept", 88: "quatre-vingt-huit", 89: "quatre-vingt-neuf",
    90: "quatre-vingt-dix", 91: "quatre-vingt-onze", 92: "quatre-vingt-douze", 93: "quatre-vingt-treize", 94: "quatre-vingt-quatorze", 95: "quatre-vingt-quinze", 96: "quatre-vingt-seize", 97: "quatre-vingt-dix-sept", 98: "quatre-vingt-dix-huit", 99: "quatre-vingt-dix-neuf",
    100: "cent"
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
        utter.onend = resolve;
        synth.speak(utter);
    });
}

function listenForWord(targetWord) {
    return new Promise((resolve) => {
        if (isRecognitionActive) try { recognition.stop(); } catch(e) {}
        setTimeout(() => {
            try { recognition.start(); } catch(e) { resolve({ success: false, transcript: "" }); }
        }, 100);

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript.toLowerCase();
            resolve({ success: transcript.includes(targetWord.toLowerCase()), transcript: transcript });
        };
        recognition.onerror = () => resolve({ success: false, transcript: "Erreur" });
    });
}

// --- App Flow ---
function toggleProcess() {
    isPaused = !isPaused;
    if (!isPaused) switchModule(currentModule || 'listen');
    else {
        synth.cancel();
        try { recognition.stop(); } catch(e) {}
        status.innerText = "Session en pause";
    }
}

async function switchModule(type) {
    currentModule = type;
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
            <p id="heard" style="color:var(--primary-light); font-style:italic; min-height:1.2rem;"></p>
            <div class="btn-row">
                <button onclick="toggleProcess()">${isPaused ? '▶️ Reprendre' : '⏸️ Arrêter'}</button>
                <button onclick="switchModule('listen')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;
    
    for (let i = 0; i < 5; i++) {
        if (isPaused || currentModule !== 'listen') return;
        await speak(word);
    }

    let results = [];
    for (let i = 0; i < 5; i++) {
        if (isPaused || currentModule !== 'listen') return;
        status.innerText = `Répétez: ${i+1}/5`;
        const { success, transcript } = await listenForWord(word);
        document.getElementById('heard').innerText = `J'ai entendu: "${transcript}"`;
        results.push(success);
        document.getElementById('reps').innerText = results.map(s => s ? "✅" : "❌").concat(Array(5 - results.length).fill("⚪")).join(" ");
    }
    if (!isPaused) setTimeout(() => switchModule('listen'), 1500);
}

async function runReadModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <p>Lisez à voix haute</p>
            <p id="heard" style="color:var(--primary-light); font-style:italic; min-height:1.2rem;"></p>
            <div class="btn-row">
                <button onclick="toggleProcess()">${isPaused ? '▶️ Reprendre' : '⏸️ Arrêter'}</button>
                <button onclick="switchModule('read')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;
    
    let success = false;
    while (!success && !isPaused && currentModule === 'read') {
        const res = await listenForWord(word);
        document.getElementById('heard').innerText = `J'ai entendu: "${res.transcript}"`;
        success = res.success;
    }
    if (success && !isPaused) setTimeout(() => switchModule('read'), 1500);
}

async function runSpellModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <input type="text" id="spellInput" autocomplete="off" autofocus placeholder="Écrivez ici...">
            <div id="correct-ans" style="color:var(--success); font-weight:bold; min-height:1.2rem; margin:10px 0;"></div>
            <div class="btn-row">
                <button id="vBtn">Vérifier</button>
                <button onclick="toggleProcess()">${isPaused ? '▶️ Reprendre' : '⏸️ Arrêter'}</button>
                <button onclick="switchModule('spell')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;
    
    speak(word);
    const input = document.getElementById('spellInput');
    const ansDiv = document.getElementById('correct-ans');

    document.getElementById('vBtn').onclick = async () => {
        const userVal = input.value.toLowerCase().trim();
        ansDiv.innerText = word; // Always show correct spelling on check
        if (userVal === word) {
            status.innerText = "Excellent!";
            setTimeout(() => { if(!isPaused) switchModule('spell')}, 2000);
        } else {
            status.innerText = "Presque... regardez l'orthographe.";
            await speak(word);
        }
    };
}

window.onload = () => {
    difficultySelect.onchange = () => { if(!isPaused) switchModule(currentModule); };
    switchModule('listen');
};
