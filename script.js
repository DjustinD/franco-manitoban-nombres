const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');
const difficultySelect = document.getElementById('difficulty');

let score = { correct: 0, total: 0, streak: 0 };
let currentModule = '';
let isRecognitionActive = false;

// --- Core Logic ---
const frWords = {
    1: "un", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six", 7: "sept", 8: "huit", 9: "neuf", 10: "dix",
    11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze", 16: "seize", 20: "vingt", 30: "trente",
    40: "quarante", 50: "cinquante", 60: "soixante", 70: "soixante-dix", 80: "quatre-vingts", 90: "quatre-vingt-dix", 100: "cent"
};

function getFr(n) {
    if (frWords[n]) return frWords[n];
    if (n < 70) {
        let d = Math.floor(n/10)*10, r = n%10;
        return frWords[d] + (r === 1 ? " et un" : "-" + frWords[r]);
    }
    if (n < 80) return "soixante-" + getFr(n-60);
    if (n < 100) return "quatre-vingt-" + getFr(n-80);
    return n.toString();
}

// --- Speech Engine ---
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'fr-CA';

recognition.onstart = () => { isRecognitionActive = true; };
recognition.onend = () => { isRecognitionActive = false; micInd.classList.add('hidden'); };

function speak(text) {
    return new Promise(resolve => {
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'fr-CA';
        utter.onend = () => resolve();
        synth.speak(utter);
    });
}

function listenForWord(targetWord) {
    return new Promise((resolve) => {
        if (isRecognitionActive) try { recognition.stop(); } catch(e) {}
        
        setTimeout(() => {
            micInd.classList.remove('hidden');
            try { recognition.start(); } catch(e) { resolve(false); }
        }, 50);

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript.toLowerCase();
            resolve(transcript.includes(targetWord.toLowerCase()));
        };
        recognition.onerror = () => resolve(false);
    });
}

// --- Modules ---
async function switchModule(type) {
    currentModule = type;
    synth.cancel();
    try { recognition.stop(); } catch(e) {}
    
    const num = Math.floor(Math.random() * difficultySelect.value) + 1;
    const word = getFr(num);

    if (type === 'listen') runListenModule(num, word);
    if (type === 'read') runReadModule(num, word);
    if (type === 'spell') runSpellModule(num, word);
}

async function runListenModule(num, word) {
    app.innerHTML = `<div class="card"><span class="big-number">${num}</span><p>${word}</p><button onclick="switchModule('listen')" class="btn-secondary">Passer ⏭️</button></div>`;
    for (let i = 0; i < 5; i++) { await speak(word); }
    for (let i = 0; i < 5; i++) {
        let success = false;
        while (!success && currentModule === 'listen') success = await listenForWord(word);
    }
    switchModule('listen');
}

async function runReadModule(num, word) {
    app.innerHTML = `<div class="card"><span class="big-number">${num}</span><p>Lisez à voix haute</p><button onclick="switchModule('read')" class="btn-secondary">Passer ⏭️</button></div>`;
    let success = false;
    while (!success && currentModule === 'read') success = await listenForWord(word);
    switchModule('read');
}

async function runSpellModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <input type="text" id="spellInput" autofocus>
            <div class="btn-row">
                <button onclick="checkSpell('${word}')">Vérifier</button>
                <button onclick="switchModule('spell')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;
    speak(word);
}

window.checkSpell = (word) => {
    if (document.getElementById('spellInput').value.toLowerCase().trim() === word) switchModule('spell');
};

window.onload = () => {
    difficultySelect.onchange = () => switchModule(currentModule);
    switchModule('listen');
};
