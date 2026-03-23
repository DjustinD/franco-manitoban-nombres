const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');

// --- Core Data & Utilities ---
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

// --- Speech & Recognition Core ---
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'fr-CA';

function speak(text) {
    return new Promise(resolve => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'fr-CA';
        const voices = synth.getVoices();
        utter.voice = voices.find(v => v.lang === 'fr-CA' && v.name.includes('Female')) || voices.find(v => v.lang === 'fr-CA');
        utter.onend = () => resolve();
        synth.speak(utter);
    });
}

function listenForWord(targetWord) {
    return new Promise((resolve) => {
        micInd.classList.remove('hidden');
        recognition.start();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            if (transcript.includes(targetWord.toLowerCase())) {
                resolve(true);
            } else {
                status.innerText = `J'ai entendu "${transcript}". Réessayez!`;
                resolve(false);
            }
        };

        recognition.onerror = () => resolve(false);
        recognition.onend = () => micInd.classList.add('hidden');
    });
}

// --- Module Management ---
let currentModule = '';

async function switchModule(type) {
    currentModule = type;
    synth.cancel();
    try { recognition.stop(); } catch(e) {}
    app.innerHTML = '';
    
    const num = Math.floor(Math.random() * 100) + 1;
    const word = getFr(num);

    if (type === 'listen') runListenModule(num, word);
    if (type === 'read') runReadModule(num, word);
    if (type === 'spell') runSpellModule(num, word);
}

// --- 1. Listen Module ---
async function runListenModule(num, word) {
    app.innerHTML = `<div class="card"><span class="big-number">${num}</span><p id="word-txt">${word}</p><h2 id="msg">Écoutez...</h2></div>`;
    
    for (let i = 0; i < 5; i++) {
        if (currentModule !== 'listen') return;
        status.innerText = `Écoute ${i+1}/5`;
        await speak(word);
    }

    document.getElementById('msg').innerText = "À vous ! Répétez 5 fois.";
    for (let i = 0; i < 5; i++) {
        if (currentModule !== 'listen') return;
        status.innerText = `Répétition ${i+1}/5`;
        let success = false;
        while (!success && currentModule === 'listen') {
            success = await listenForWord(word);
        }
    }
    
    status.innerText = "Excellent ! Suivant...";
    setTimeout(() => switchModule('listen'), 1500);
}

// --- 2. Read Module ---
async function runReadModule(num, word) {
    app.innerHTML = `<div class="card"><span class="big-number">${num}</span><p>Lisez le nombre à voix haute</p></div>`;
    
    let success = false;
    while (!success && currentModule === 'read') {
        success = await listenForWord(word);
    }
    
    status.innerText = "Parfait !";
    setTimeout(() => switchModule('read'), 1500);
}

// --- 3. Spell Module ---
async function runSpellModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <input type="text" id="spellInput" autofocus autocomplete="off">
            <button id="checkBtn">Vérifier</button>
            <div id="flash" class="feedback-flash"></div>
        </div>`;
    
    speak(word);

    const input = document.getElementById('spellInput');
    const flash = document.getElementById('flash');

    document.getElementById('checkBtn').onclick = () => {
        if (input.value.toLowerCase().trim() === word) {
            flash.innerText = "✅";
            flash.classList.add('show-feedback');
            status.innerText = "Correct !";
            setTimeout(() => switchModule('spell'), 1500);
        } else {
            flash.innerText = "❌";
            flash.classList.add('show-feedback');
            status.innerText = "Réessayez...";
            speak(word);
            setTimeout(() => flash.classList.remove('show-feedback'), 1000);
        }
    };
}

// Initial Load
window.onload = () => switchModule('listen');
