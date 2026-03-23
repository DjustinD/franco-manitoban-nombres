const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');
const difficultySelect = document.getElementById('difficulty');

let currentModule = '';
let isRecognitionActive = false;

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
        if (isRecognitionActive) recognition.stop();
        
        setTimeout(() => {
            try { recognition.start(); } catch(e) { resolve(false); }
        }, 100);

        recognition.onresult = (e) => {
            const result = e.results[0][0].transcript.toLowerCase();
            resolve(result.includes(targetWord.toLowerCase()));
        };
        recognition.onerror = () => resolve(false);
    });
}

// --- App Control ---
async function switchModule(type) {
    currentModule = type;
    synth.cancel();
    try { recognition.stop(); } catch(e) {}
    
    app.innerHTML = '';
    const num = Math.floor(Math.random() * parseInt(difficultySelect.value)) + 1;
    const word = getFr(num);

    if (type === 'listen') runListenModule(num, word);
    if (type === 'read') runReadModule(num, word);
    if (type === 'spell') runSpellModule(num, word);
}

async function runListenModule(num, word) {
    app.innerHTML = `<div class="card"><span class="big-number">${num}</span><p>${word}</p><div class="btn-row"><button onclick="switchModule('listen')" class="btn-secondary">Passer ⏭️</button></div></div>`;
    for (let i = 0; i < 5; i++) { 
        if (currentModule !== 'listen') return;
        await speak(word); 
    }
    for (let i = 0; i < 5; i++) {
        if (currentModule !== 'listen') return;
        status.innerText = `Répétez: ${i+1}/5`;
        let success = false;
        while (!success && currentModule === 'listen') success = await listenForWord(word);
    }
    if (currentModule === 'listen') switchModule('listen');
}

async function runReadModule(num, word) {
    app.innerHTML = `<div class="card"><span class="big-number">${num}</span><p>Lisez à voix haute</p><div class="btn-row"><button onclick="switchModule('read')" class="btn-secondary">Passer ⏭️</button></div></div>`;
    let success = false;
    while (!success && currentModule === 'read') success = await listenForWord(word);
    if (currentModule === 'read') switchModule('read');
}

async function runSpellModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <input type="text" id="spellInput" autocomplete="off" autofocus>
            <div class="btn-row">
                <button id="vBtn">Vérifier</button>
                <button onclick="switchModule('spell')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;
    
    speak(word);
    document.getElementById('vBtn').onclick = () => {
        if (document.getElementById('spellInput').value.toLowerCase().trim() === word) switchModule('spell');
    };
}

window.onload = () => {
    difficultySelect.onchange = () => switchModule(currentModule);
    switchModule('listen');
};
