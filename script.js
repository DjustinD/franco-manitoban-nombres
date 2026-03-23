const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');
const difficultySelect = document.getElementById('difficulty');

// --- Score & State ---
let score = { correct: 0, total: 0, streak: 0 };

function updateScoreDisplay() {
    document.getElementById('streak-count').textContent = `🔥 ${score.streak}`;
    document.getElementById('score-count').textContent = `✅ ${score.correct} / ${score.total}`;
}

function recordResult(correct) {
    score.total++;
    if (correct) {
        score.correct++;
        score.streak++;
    } else {
        score.streak = 0;
    }
    updateScoreDisplay();
}

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

function getMaxNumber() {
    return parseInt(difficultySelect.value, 10);
}

function randomNum() {
    return Math.floor(Math.random() * getMaxNumber()) + 1;
}

// --- Nav Highlighting ---
function setActiveNav(type) {
    ['listen', 'read', 'spell'].forEach(t => {
        const btn = document.getElementById(`btn-${t}`);
        btn.classList.toggle('active', t === type);
    });
}

// --- Speech & Recognition Core ---
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'fr-CA';

function speak(text) {
    return new Promise(resolve => {
        synth.cancel();
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
                status.innerText = `J'ai entendu "${transcript}". Réessayez !`;
                resolve(false);
            }
        };

        recognition.onerror = () => resolve(false);
        recognition.onend = () => micInd.classList.add('hidden');
    });
}

// --- Progress Bar Helper ---
function buildProgressBar(current, total, label) {
    const pct = Math.round((current / total) * 100);
    return `
        <div class="progress-container">
            <div class="progress-label">${label} ${current}/${total}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
}

// --- Module Management ---
let currentModule = '';

async function switchModule(type) {
    currentModule = type;
    synth.cancel();
    try { recognition.stop(); } catch(e) {}
    app.innerHTML = '';
    setActiveNav(type);
    
    const num = randomNum();
    const word = getFr(num);

    if (type === 'listen') runListenModule(num, word);
    if (type === 'read') runReadModule(num, word);
    if (type === 'spell') runSpellModule(num, word);
}

// --- 1. Listen Module ---
async function runListenModule(num, word) {
    const REPS = 5;

    function render(phase, step) {
        const isListenPhase = phase === 'listen';
        app.innerHTML = `
            <div class="card">
                <span class="big-number">${num}</span>
                <p class="word-display">${word}</p>
                <p class="module-title">${isListenPhase ? '🔊 Écoutez attentivement' : '🎤 À vous de répéter'}</p>
                ${buildProgressBar(step, REPS, isListenPhase ? 'Écoute' : 'Répétition')}
            </div>`;
    }

    render('listen', 0);

    for (let i = 0; i < REPS; i++) {
        if (currentModule !== 'listen') return;
        render('listen', i + 1);
        await speak(word);
    }

    for (let i = 0; i < REPS; i++) {
        if (currentModule !== 'listen') return;
        render('repeat', i);
        let success = false;
        while (!success && currentModule === 'listen') {
            success = await listenForWord(word);
        }
        if (success) {
            status.innerText = i < REPS - 1 ? `Bravo ! Encore ${REPS - i - 1} fois.` : 'Excellent !';
        }
        render('repeat', i + 1);
    }

    if (currentModule === 'listen') {
        recordResult(true);
        status.innerText = '🎉 Excellent ! Suivant...';
        setTimeout(() => switchModule('listen'), 1500);
    }
}

// --- 2. Read Module ---
async function runReadModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <p class="module-title">📖 Lisez ce nombre à voix haute</p>
            <p class="hint-text">Prononcez le nombre en français</p>
        </div>`;
    
    let success = false;
    while (!success && currentModule === 'read') {
        success = await listenForWord(word);
    }
    
    if (currentModule === 'read') {
        recordResult(true);
        status.innerText = '🎉 Parfait !';
        setTimeout(() => switchModule('read'), 1500);
    }
}

// --- 3. Spell Module ---
async function runSpellModule(num, word) {
    app.innerHTML = `
        <div class="card">
            <span class="big-number">${num}</span>
            <div id="reveal-area" style="min-height:1.6rem; margin-bottom:0.5rem; font-weight:bold; color:var(--primary); font-size:1.3rem;"></div>
            <p class="module-title">✏️ Tapez le nombre en toutes lettres</p>
            <input type="text" id="spellInput" autofocus autocomplete="off" spellcheck="false" placeholder="Ex : vingt-trois">
            <div class="btn-row">
                <button id="checkBtn">Vérifier</button>
                <button id="revealBtn" class="btn-secondary">Montrer</button>
                <button id="listenBtn" class="btn-secondary">🔊</button>
            </div>
            <div id="flash" class="feedback-flash"></div>
        </div>`;
    
    speak(word);

    const input = document.getElementById('spellInput');
    const flash = document.getElementById('flash');
    const revealArea = document.getElementById('reveal-area');

    document.getElementById('listenBtn').onclick = () => speak(word);

    document.getElementById('revealBtn').onclick = async () => {
        revealArea.innerText = word;
        await speak(word);
        setTimeout(() => { revealArea.innerText = ''; }, 2500);
    };

    document.getElementById('checkBtn').onclick = () => {
        const userValue = input.value.toLowerCase().trim();
        
        if (userValue === word) {
            input.classList.add('correct');
            flash.innerText = '✅';
            flash.classList.add('show-feedback');
            status.innerText = '🎉 Correct !';
            recordResult(true);
            document.getElementById('checkBtn').disabled = true;
            document.getElementById('revealBtn').disabled = true;
            setTimeout(() => switchModule('spell'), 1500);
        } else {
            input.classList.add('incorrect');
            flash.innerText = '❌';
            flash.classList.add('show-feedback');
            status.innerText = 'Pas tout à fait. Utilisez "Montrer" si besoin.';
            recordResult(false);
            speak(word);
            setTimeout(() => {
                flash.classList.remove('show-feedback');
                input.classList.remove('incorrect');
                input.value = '';
                input.focus();
            }, 1200);
        }
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('checkBtn').click();
    });
}

// Initial Load
window.onload = () => {
    updateScoreDisplay();
    switchModule('listen');
};

