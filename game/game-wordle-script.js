const DATA_URL = "https://e-rimbault.github.io/swgoh-kit/filtre-recherche/units.json";

let allUnits = [];
let targetUnit = null;
let attempts = 0;
let gameMode = "daily";
let currentAllyCode = ""; 

// --- ÉTAT DES INDICES ---
let foundTraits = { alignment: "?", role: "?", ship: "?", leader: "?", factions: new Set() };

const FACTION_BLACKLIST = ["leader", "crew member", "fleet commander"];
const container = document.getElementById("units-container");
const guessesContainer = document.getElementById("guesses-container");
const searchContainer = document.getElementById("search-container");
const input = document.getElementById("unit-input");
const suggestions = document.getElementById("suggestions");
const modal = document.getElementById("victory-modal");
const PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjNjY2IiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9ImFyaWFsIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4/PC90ZXh0Pjwvc3ZnPg==";

const translations = {
    en: {
        "game-title": "SWGOH Wordle", "start-btn": "Start Game", "placeholder": "Enter character name...",
        "h-name": "Name", "h-align": "Alignment", "h-ship": "Ship", "h-factions": "Factions",
        "h-leader": "Leader", "h-role": "Role", "vic-title": "AMAZING!", "vic-desc": "Congratulations!",
        "vic-attempts": "Number of attempt(s) :", "vic-tries": "attempts.", "btn-replay": "REPLAY", "btn-back": "BACK",
        "yes": "Yes", "no": "No", "sum-title": "Identified Clues", "btn-free": "PLAY IN FREE MODE",
        "next-unit": "Next Unit in", "hist-title": "Last 30 Days", "already-played": "Daily challenge already completed!",
        "tag-leader": "Leader", "tag-crew": "crew member", "tag-commander": "fleet commander"
    },
    fr: {
        "game-title": "Jeu SWGOH Wordle", "start-btn": "Lancer la partie", "placeholder": "Nom de l'unité...",
        "h-name": "Nom", "h-align": "Alignement", "h-ship": "Vaisseau", "h-factions": "Factions",
        "h-leader": "Chef", "h-role": "Rôle", "vic-title": "INCROYABLE !", "vic-desc": "Félicitations !",
        "vic-attempts": "Nombre de tentative(s) :", "vic-tries": "tentatives.", "btn-replay": "REJOUER", "btn-back": "RETOUR",
        "yes": "Oui", "no": "Non", "sum-title": "Indices Identifiés", "btn-free": "JOUER EN MODE LIBRE",
        "next-unit": "Prochaine unité", "hist-title": "30 derniers jours", "already-played": "Défi quotidien déjà complété !",
        "tag-leader": "Chef", "tag-crew": "membre de l'équipage", "tag-commander": "commandant de la flotte"
    }
};

// --- COMPTE À REBOURS ---
function updateTimer() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;

    const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const timerSpan = document.getElementById("timer");
    const textSpan = document.getElementById("next-unit-text");
    
    if (timerSpan) timerSpan.textContent = `${hours}:${mins}:${secs}`;
    if (textSpan) textSpan.textContent = translations[lang]["next-unit"];
}
setInterval(updateTimer, 1000);

// --- LOGIQUE UNITÉ QUOTIDIENNE AVEC ROTATION 30 JOURS ---
function getDailyUnit(units) {
    const history = JSON.parse(localStorage.getItem(`history_${currentAllyCode}`) || "[]");
    const blockedNames = history.map(h => h.name);

    const d = new Date();
    let dateSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    
    let index = dateSeed % units.length;
    let selected = units[index];

    // Debug Console : Affichage des unités bloquées
    console.clear();
    console.log("%c--- SYSTÈME DE ROTATION (30 JOURS) ---", "color: #FFE81F; font-weight: bold; font-size: 12px;");
    
    if (history.length > 0) {
        history.forEach(item => {
            const parts = item.date.split('/');
            const unitDate = new Date(parts[2], parts[1] - 1, parts[0]); 
            const diffDays = Math.floor((new Date() - unitDate) / (1000 * 60 * 60 * 24));
            const remaining = 30 - diffDays;
            
            if (remaining > 0) {
                console.log(`🚫 %c${item.name}%c : Bloqué encore %c${remaining} jour(s)`, "color: #ff4444; font-weight: bold;", "color: white;", "color: #00d4ff;");
            }
        });
    } else {
        console.log("Aucune unité dans l'historique pour l'Ally Code : " + currentAllyCode);
    }

    // Algorithme d'exclusion
    let safetyBreak = 0;
    while (blockedNames.includes(getLoc(selected.name)) && safetyBreak < units.length) {
        index = (index + 1) % units.length;
        selected = units[index];
        safetyBreak++;
    }
    return selected;
}

// --- GESTION ALLY CODE & ÉTAT DU JEU ---
function handleStartClick() {
    const allyInput = document.getElementById("ally-code-input");
    const code = allyInput.value.trim();

    if (code.length < 3) {
        allyInput.style.borderColor = "red";
        setTimeout(() => allyInput.style.borderColor = "var(--sw-blue)", 2000);
        return;
    }

    currentAllyCode = code;
    localStorage.setItem("last_ally_code", currentAllyCode);

    const history = JSON.parse(localStorage.getItem(`history_${currentAllyCode}`) || "[]");
    const today = new Date().toLocaleDateString();
    const alreadyPlayed = history.find(h => h.date === today);

    if (alreadyPlayed) {
        showAlreadyPlayedModal(alreadyPlayed);
    } else {
        startNewGame("daily");
    }
}

function showAlreadyPlayedModal(entry) {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    modal.innerHTML = `
        <div class="modal-content">
            <h2 style="color:var(--sw-yellow)">${t["already-played"]}</h2>
            <p>Ally Code: <strong>${currentAllyCode}</strong></p>
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #444; background: rgba(0,0,0,0.5)">
                <img src="${entry.img}" width="60" style="border-radius:50%"><br>
                <span style="text-transform:uppercase; font-weight:bold">${entry.name}</span><br>
                <span>${t["vic-attempts"]} ${entry.attempts}</span>
            </div>
            <button onclick="startNewGame('free'); closeModal();" class="main-btn">${t["btn-free"]}</button>
            <button onclick="showHistory();" class="main-btn" style="background:#333; margin-top:10px">${t["hist-title"]}</button>
        </div>
    `;
    modal.classList.remove("hidden");
}

function saveToHistory(unit, count) {
    const key = `history_${currentAllyCode}`;
    let history = JSON.parse(localStorage.getItem(key) || "[]");
    const today = new Date().toLocaleDateString();
    
    if (!history.find(h => h.date === today)) {
        history.unshift({ date: today, name: getLoc(unit.name), attempts: count, img: unit.image });
        if (history.length > 30) history.pop();
        localStorage.setItem(key, JSON.stringify(history));
    }
}

function showHistory() {
    if (!currentAllyCode) {
        currentAllyCode = document.getElementById("ally-code-input").value.trim() || "Guest";
    }
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const history = JSON.parse(localStorage.getItem(`history_${currentAllyCode}`) || "[]");
    
    let html = `<div class="modal-content">
        <h2 style="font-size:1.2rem">${translations[lang]["hist-title"]}</h2>
        <p style="font-size:0.8rem; color:#888">Ally Code: ${currentAllyCode}</p>
        <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">`;
    
    if (history.length === 0) {
        html += `<p style="text-align:center; padding: 20px;">No data found for this code.</p>`;
    } else {
        history.forEach(item => {
            html += `
            <div style="display: flex; align-items: center; border-bottom: 1px solid #333; padding: 8px 0;">
                <img src="${item.img}" width="35" style="border-radius:50%; margin-right: 12px; border: 1px solid #555;">
                <div style="text-align:left; font-size:0.9rem">
                    <div style="color:var(--sw-yellow); font-size:0.7rem">${item.date}</div>
                    <strong>${item.name}</strong> • ${item.attempts} essais
                </div>
            </div>`;
        });
    }
    
    html += `</div><button onclick="closeModal()" class="main-btn">${translations[lang]["btn-back"]}</button></div>`;
    modal.innerHTML = html;
    modal.classList.remove("hidden");
}

// --- FONCTIONS JEU ---
function getLoc(obj) {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    return obj[lang] || obj["en"];
}

function getYesNo(val) {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const key = (val && val.toLowerCase() === "yes") ? "yes" : "no";
    return translations[lang][key];
}

function getCleanFactions(unit) {
    return unit.factions.filter(f => !FACTION_BLACKLIST.includes(f.en.toLowerCase()));
}

const checkShip = (u) => u.factions.some(f => ["crew member", "fleet commander"].includes(f.en.toLowerCase())) ? "Yes" : "No";
const checkLeader = (u) => u.factions.some(f => f.en.toLowerCase() === "leader") ? "Yes" : "No";

function updateSummary() {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    const sumContainer = document.getElementById("summary-container");
    if(!sumContainer) return;

    sumContainer.classList.remove("hidden");
    document.getElementById("summary-title").textContent = t["sum-title"];
    
    document.getElementById("summary-content").innerHTML = `
        <p><span>${t["h-align"]} :</span> ${foundTraits.alignment}</p>
        <p><span>${t["h-role"]} :</span> ${foundTraits.role}</p>
        <p><span>${t["h-ship"]} :</span> ${foundTraits.ship}</p>
        <p><span>${t["h-leader"]} :</span> ${foundTraits.leader}</p>
        <p style="grid-column: 1 / -1;"><span>${t["h-factions"]} :</span> ${Array.from(foundTraits.factions).join(", ") || "?"}</p>
    `;
}

function switchLanguage(lang) {
    sessionStorage.setItem("selectedLanguage", lang);
    const t = translations[lang];
    document.getElementById("game-title").textContent = t["game-title"];
    document.getElementById("start-btn").textContent = t["start-btn"];
    input.placeholder = t["placeholder"];
    
    if (allUnits.length > 0) displayAllUnits(allUnits);
    
    updateTimer();
    if (!document.getElementById("summary-container").classList.contains("hidden")) updateSummary();
}

function startNewGame(mode) {
    gameMode = mode;
    attempts = 0;
    foundTraits = { alignment: "?", role: "?", ship: "?", leader: "?", factions: new Set() };
    
    targetUnit = (mode === "daily") ? getDailyUnit(allUnits) : allUnits[Math.floor(Math.random() * allUnits.length)];

    document.getElementById("setup-container").classList.add("hidden");
    searchContainer.classList.remove("hidden");
    
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    
    guessesContainer.innerHTML = `<div class="guess-row headers">
        <div class="header-cell">${t["h-name"]}</div><div class="header-cell">${t["h-align"]}</div>
        <div class="header-cell">${t["h-ship"]}</div><div class="header-cell">${t["h-factions"]}</div>
        <div class="header-cell">${t["h-leader"]}</div><div class="header-cell">${t["h-role"]}</div>
    </div>`;
    
    updateSummary();
}

function submitGuess(unit) {
    attempts++;
    input.value = "";
    suggestions.innerHTML = "";
    
    const targetFactionsEN = targetUnit.factions.map(f => f.en.toLowerCase());
    const cleanGuessEN = getCleanFactions(unit).map(f => f.en.toLowerCase());
    const cleanTargetEN = getCleanFactions(targetUnit).map(f => f.en.toLowerCase());
    
    const isExactMatch = cleanGuessEN.length === cleanTargetEN.length && cleanGuessEN.every(f => cleanTargetEN.includes(f));
    const hasCommonFaction = cleanGuessEN.some(f => cleanTargetEN.includes(f));
    let factionStatus = isExactMatch ? "correct" : (hasCommonFaction ? "partial" : "wrong");

    if (unit.alignment.en === targetUnit.alignment.en) foundTraits.alignment = getLoc(unit.alignment);
    if (unit.role.en === targetUnit.role.en) foundTraits.role = getLoc(unit.role);
    if (checkShip(unit) === checkShip(targetUnit)) foundTraits.ship = getYesNo(checkShip(unit));
    if (checkLeader(unit) === checkLeader(targetUnit)) foundTraits.leader = getYesNo(checkLeader(unit));
    
    unit.factions.forEach(f => {
        if (targetFactionsEN.includes(f.en.toLowerCase()) && !FACTION_BLACKLIST.includes(f.en.toLowerCase())) {
            foundTraits.factions.add(getLoc(f));
        }
    });

    updateSummary();

    const guessData = {
        image: unit.image,
        name: getLoc(unit.name),
        alignment: { val: getLoc(unit.alignment), match: unit.alignment.en === targetUnit.alignment.en },
        ship: { val: getYesNo(checkShip(unit)), match: checkShip(unit) === checkShip(targetUnit) },
        leader: { val: getYesNo(checkLeader(unit)), match: checkLeader(unit) === checkLeader(targetUnit) },
        role: { val: getLoc(unit.role), match: unit.role.en === targetUnit.role.en },
        factions: { val: getCleanFactions(unit).map(f => getLoc(f)).join(", "), status: factionStatus }
    };

    renderGuessRow(guessData);
    if (unit.id === targetUnit.id) {
        if(gameMode === "daily") saveToHistory(targetUnit, attempts);
        showVictory();
    }
}

function renderGuessRow(data) {
    const row = document.createElement("div");
    row.className = "guess-row";
    row.innerHTML = `
        <div class="cell"><img src="${data.image}" class="row-img" onerror="this.src='${PLACEHOLDER_SVG}'"><br>${data.name}</div>
        <div class="cell ${data.alignment.match ? 'correct' : 'wrong'}">${data.alignment.val}</div>
        <div class="cell ${data.ship.match ? 'correct' : 'wrong'}">${data.ship.val}</div>
        <div class="cell ${data.factions.status}">${data.factions.val}</div>
        <div class="cell ${data.leader.match ? 'correct' : 'wrong'}">${data.leader.val}</div>
        <div class="cell ${data.role.match ? 'correct' : 'wrong'}">${data.role.val}</div>
    `;
    guessesContainer.querySelector('.headers').insertAdjacentElement('afterend', row);
}

function showVictory() {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    const buttonLabel = gameMode === "daily" ? t["btn-free"] : t["btn-replay"];
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${t["vic-title"]}</h2>
            <p>${gameMode === "daily" ? "Daily Challenge Complete!" : t["vic-desc"]}</p>
            <img src="${targetUnit.image}" id="victory-img" onerror="this.src='${PLACEHOLDER_SVG}'">
            <h3 style="color: white; text-transform: uppercase;">${getLoc(targetUnit.name)}</h3>
            <div class="victory-details">
                <p><span>${t["h-align"]} :</span> ${getLoc(targetUnit.alignment)}</p>
                <p><span>${t["h-role"]} :</span> ${getLoc(targetUnit.role)}</p>
                <p><span>${t["h-ship"]} :</span> ${getYesNo(checkShip(targetUnit))}</p>
                <p><span>${t["h-leader"]} :</span> ${getYesNo(checkLeader(targetUnit))}</p>
                <p><span>${t["h-factions"]} :</span> ${getCleanFactions(targetUnit).map(f => getLoc(f)).join(", ")}</p>
            </div>
            <p>${t["vic-attempts"]} <strong>${attempts}</strong> ${t["vic-tries"]}</p>
            <button onclick="startNewGame('free'); closeModal();" class="main-btn">${buttonLabel}</button>
        </div>
    `;
    modal.classList.remove("hidden");
}

function closeModal() { modal.classList.add("hidden"); }

// --- EVENT LISTENERS ---
document.getElementById("start-btn").addEventListener("click", handleStartClick);
document.getElementById("history-btn").addEventListener("click", showHistory);

input.addEventListener("input", () => {
    const val = input.value.toLowerCase().trim();
    suggestions.innerHTML = "";
    if (val.length < 2) return;
    allUnits.filter(u => getLoc(u.name).toLowerCase().includes(val)).slice(0, 5).forEach(unit => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="${unit.image}" width="40" style="border-radius:50%"> ${getLoc(unit.name)}`;
        div.onclick = () => submitGuess(unit);
        suggestions.appendChild(div);
    });
});

// --- AFFICHAGE DE TOUTES LES UNITÉS (GRILLE) ---
function displayAllUnits(units) {
    const container = document.getElementById("units-container");
    if (!container) return;
    
    container.innerHTML = ""; 
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    
    units.forEach(unit => {
        const card = document.createElement("div");
        card.className = "unit-card"; 
        
        const name = getLoc(unit.name);
        const role = getLoc(unit.role);
        const align = getLoc(unit.alignment);
        const factions = getCleanFactions(unit).map(f => getLoc(f)).join(", ");

        let extraTags = "";
        const rawFactions = unit.factions.map(f => f.en.toLowerCase());
        
        if (rawFactions.includes("leader")) {
            extraTags += `<span class="badge-extra badge-leader">${translations[lang]["tag-leader"]}</span>`;
        }
        if (rawFactions.includes("crew member")) {
            extraTags += `<span class="badge-extra badge-ship">${translations[lang]["tag-crew"]}</span>`;
        }
        if (rawFactions.includes("fleet commander")) {
            extraTags += `<span class="badge-extra badge-ship">${translations[lang]["tag-commander"]}</span>`;
        }

        card.innerHTML = `
            <img src="${unit.image}" alt="${name}" onerror="this.src='${PLACEHOLDER_SVG}'">
            <div class="unit-info">
                <h4>${name}</h4>
                <p class="align-text"><strong>${align}</strong></p>
                <p class="role-text">${role}</p>
                <small class="factions-text">${factions}</small>
                <div class="extra-indices">${extraTags}</div>
            </div>
        `;
        
        card.onclick = () => {
            if (!searchContainer.classList.contains("hidden")) {
                submitGuess(unit);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        
        container.appendChild(card);
    });
}

// --- INIT ---
fetch(DATA_URL).then(r => r.json()).then(data => {
    allUnits = data;
    displayAllUnits(allUnits); 
}).catch(console.error);

window.onload = () => {
    const savedCode = localStorage.getItem("last_ally_code");
    if (savedCode) {
        currentAllyCode = savedCode;
        document.getElementById("ally-code-input").value = savedCode;
        
        // On attend que le fetch des unités soit fini pour scanner la rotation
        const checkData = setInterval(() => {
            if (allUnits.length > 0) {
                getDailyUnit(allUnits); // Affiche les logs dès le départ
                clearInterval(checkData);
            }
        }, 100);
    }
    switchLanguage(sessionStorage.getItem("selectedLanguage") || "en");
    updateTimer();
};

window.onclick = (e) => { if (e.target == modal) closeModal(); };