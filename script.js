const app = document.getElementById('app');
const status = document.getElementById('status-bar');

// --- Core Data & Utilities ---
const numbers = Array.from({length: 100}, (_, i) => i + 1);
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

function speak(text, callback) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fr-CA';
    // Attempt to find a female CA voice
    const voices = synth.getVoices();
    utter.voice = voices.find(v => v.lang === 'fr-CA' && v.name.includes('Female')) || voices.find(v => v.lang === 'fr-CA');
    utter.onend = callback;
    synth.speak(utter);
}

// --- Modules ---
let currentNum = 1;

function switchModule(type) {
    app.innerHTML = '';
    currentNum = Math.floor(Math.random() * 100) + 1;
    
    if (type === 'listen') startListenModule();
    if (type === 'read') startReadModule();
    if (type === 'spell') startSpellModule();
}

async function startListenModule() {
    const word = getFr(currentNum);
    app.innerHTML = `<div class="card"><span class="big-number">${currentNum}</span><p>${word}</p><h2 id="step">Écoutez...</h2></div>`;
    
    // Listen phase (5 times)
    for(let i=0; i<5; i++) {
        await new Promise(res => speak(word, res));
    }
    
    // Repeat phase (5 times)
    document.getElementById('step').innerText = "À vous! Dites-le 5 fois.";
    for(let i=0; i<5; i++) {
        status.innerText = `Répétition ${i+1}/5`;
        await new Promise(res => {
            recognition.onresult = (e) => res();
            recognition.start();
        });
    }
    status.innerText = "Excellent!";
    setTimeout(() => startListenModule(), 2000);
}

function startReadModule() {
    const word = getFr(currentNum);
    app.innerHTML = `<div class="card" id="card"><span class="big-number">${currentNum}</span><p>Lisez à voix haute</p></div>`;
    
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript.toLowerCase();
        if(transcript.includes(word)) {
            status.innerText = "Correct!";
            setTimeout(() => switchModule('read'), 1500);
        } else {
            status.innerText = `J'ai entendu "${transcript}". Réessayez.`;
        }
    };
    recognition.start();
}

function startSpellModule() {
    const word = getFr(currentNum);
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${currentNum}</span>
            <input type="text" id="spellInput" placeholder="..." style="font-size: 1.5rem; width: 80%; padding: 10px; margin-top: 20px;">
            <button onclick="checkSpell('${word}')" style="margin-top: 20px;">Vérifier</button>
        </div>`;
    speak(word);
}

window.checkSpell = (correct) => {
    const input = document.getElementById('spellInput').value.toLowerCase().trim();
    if(input === correct) {
        status.innerText = "Parfait!";
        setTimeout(() => switchModule('spell'), 1500);
    } else {
        status.innerText = "Pas tout à fait. Réessayez.";
    }
}

// Init
switchModule('listen');
