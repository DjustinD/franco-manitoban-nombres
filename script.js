const app = document.getElementById('app');
const status = document.getElementById('status-bar');
const micInd = document.getElementById('mic-indicator');
const difficultySelect = document.getElementById('difficulty');
const pauseBtn = document.getElementById('global-pause');

let currentModule = '';
let isRecognitionActive = false;
let isPaused = true; 

// --- Core Data ---
const frWords = { /* ... keep your full 1-100 object here ... */ };

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
            resolve({ success: transcript.includes(targetWord.toLowerCase()), transcript: transcript });
        };
        recognition.onerror = () => resolve({ success: false, transcript: "---" });
    });
}

// --- App Flow ---
function toggleProcess() {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? "▶️ Reprendre" : "⏸️ Pause";
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
            <p id="heard"></p>
            <div class="btn-row">
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
        await new Promise(r => setTimeout(r, 500)); // Pause between tries
    }
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
                <button onclick="switchModule('spell')" class="btn-secondary">Passer ⏭️</button>
            </div>
        </div>`;
    
    speak(word);
    const input = document.getElementById('spellInput');
    const ansDiv = document.getElementById('correct-ans');

    // Handle Enter Key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('vBtn').click();
    });

    document.getElementById('vBtn').onclick = async () => {
        const userVal = input.value.toLowerCase().trim();
        ansDiv.innerText = word; 
        if (userVal === word) {
            status.innerText = "Excellent!";
            setTimeout(() => { if(!isPaused) switchModule('spell')}, 1500);
        } else {
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