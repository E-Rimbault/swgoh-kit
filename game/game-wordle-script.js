const DATA_URL = "https://e-rimbault.github.io/swgoh-kit/filtre-recherche/units.json";

let allUnits = [];
let targetUnit = null;
let attempts = 0;
let gameMode = "daily";
let currentAllyCode = ""; 
let hintUsed = false; // Pour limiter à 1 indice par partie

// --- ÉTAT DES INDICES ---
let foundTraits = { alignment: "?", role: "?", ship: "?", leader: "?", factions: new Set(), year: "?" };

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
        "tag-leader": "Leader", "tag-crew": "crew member", "tag-commander": "fleet commander",
        "h-year": "Year of appearance",
        "rules-title": "HOW TO PLAY", "rules-next": "NEXT UNIT IN:", "rules-prop": "PROPERTIES", "rules-feed": "FEEDBACK",
        "rule-align": "<strong>ALIGNMENT:</strong> Light Side, Dark Side, or Neutral.",
        "rule-ship": "<strong>SHIP:</strong> Does the unit have a ship?",
        "rule-fact": "<strong>FACTIONS:</strong> Groups (Empire, Jedi, etc.).",
        "rule-lead": "<strong>LEADER:</strong> Does it have a leader ability?",
        "rule-year": "<strong>YEAR:</strong> Release year of the unit.",
        "rule-role": "<strong>ROLE:</strong> Combat role (Attacker, Tank, etc.).",
        "feed-correct": "Correct", "feed-partial": "Partial (Factions)", "feed-wrong": "Incorrect",
        "hist-not-played": "❌ Not played", "hist-pending": "🔒 Pending...",
        "btn-hint": "🔍 HINT", "hint-pop-title": "Matching Units", "hint-back": "BACK",
        "btn-giveup": "🏳️ GIVE UP", "confirm-giveup": "Do you really want to give up and reveal the unit?",
        "revealed-title": "UNIT REVEALED"
    },
    fr: {
        "game-title": "Jeu SWGOH Wordle", "start-btn": "Lancer la partie", "placeholder": "Nom de l'unité...",
        "h-name": "Nom", "h-align": "Alignement", "h-ship": "Vaisseau", "h-factions": "Factions",
        "h-leader": "Chef", "h-role": "Rôle", "vic-title": "INCROYABLE !", "vic-desc": "Félicitations !",
        "vic-attempts": "Nombre de tentative(s) :", "vic-tries": "tentatives.", "btn-replay": "REJOUER", "btn-back": "RETOUR",
        "yes": "Oui", "no": "Non", "sum-title": "Indices Identifiés", "btn-free": "JOUER EN MODE LIBRE",
        "next-unit": "Prochaine unité", "hist-title": "30 derniers jours", "already-played": "Défi quotidien déjà complété !",
        "tag-leader": "Chef", "tag-crew": "membre de l'équipage", "tag-commander": "commandant de la flotte",
        "h-year": "Année d'apparition",
        "rules-title": "COMMENT JOUER", "rules-next": "PROCHAINE UNITÉ DANS :", "rules-prop": "PROPRIÉTÉS", "rules-feed": "FEEDBACK",
        "rule-align": "<strong>ALIGNEMENT :</strong> Light Side, Dark Side, ou Neutral.",
        "rule-ship": "<strong>VAISSEAU :</strong> L'unité possède-t-elle un vaisseau ?",
        "rule-fact": "<strong>FACTIONS :</strong> Groupes d'appartenance (Empire, Jedi, etc.).",
        "rule-lead": "<strong>CHEF :</strong> Possède-t-elle une capacité de chef ?",
        "rule-year": "<strong>ANNÉE :</strong> Année de sortie de l'unité.",
        "rule-role": "<strong>RÔLE :</strong> Rôle en combat (Attaquant, Tank, etc.).",
        "feed-correct": "Correct", "feed-partial": "Partiel (Factions)", "feed-wrong": "Incorrect",
        "hist-not-played": "❌ Non joué", "hist-pending": "🔒 En attente...",
        "btn-hint": "🔍 INDICE", "hint-pop-title": "Unités Correspondantes", "hint-back": "RETOUR",
        "btn-giveup": "🏳️ ABANDONNER", "confirm-giveup": "Voulez-vous vraiment abandonner et révéler l'unité ?",
        "revealed-title": "UNITÉ RÉVÉLÉE"
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

// --- LOGIQUE UNITÉ QUOTIDIENNE ---
function getDailyUnit(units) {
    const d = new Date();
    // 1. On garde ta base de date
    let dateSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    
    // 2. FONCTION DE MÉLANGE (Muranaka Hash simplifiée)
    // On multiplie par un grand nombre premier pour "éparpiller" les résultats
    let scrambledSeed = (dateSeed * 15485863) % 999999; 
    
    // 3. On utilise cette seed mélangée pour l'index
    let index = scrambledSeed % units.length;
    let selected = units[index];

    // --- Garder ta logique anti-doublon existante ---
    const history = JSON.parse(localStorage.getItem(`history_${currentAllyCode}`) || "[]");
    const blockedNames = history.map(h => h.name);
    
    let safetyBreak = 0;
    while (blockedNames.includes(getLoc(selected.name)) && safetyBreak < units.length) {
        index = (index + 7) % units.length; // On saute de 7 en 7 si doublon pour plus d'aléa
        selected = units[index];
        safetyBreak++;
    }
    return selected;
}

function logRotationHistory(units) {
    const history = JSON.parse(localStorage.getItem(`history_${currentAllyCode}`) || "[]");
    let playedCount = 0;
    
    console.clear();
    console.log("%c--- RAPPORT D'ACTIVITÉ ---", "color: #FFE81F; font-weight: bold;");

    for (let i = 0; i < 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateString = targetDate.toLocaleDateString();
        const unitAtDate = getDailyUnitForDate(units, targetDate);
        const entry = history.find(h => h.date === dateString);

        if (entry) playedCount++;
    }
    console.log(`Joueur : ${currentAllyCode} | Taux : ${Math.round((playedCount / 30) * 100)}%`);
}

// --- GESTION CONNEXION & FIREBASE ---
async function handleStartClick() {
    const allyInput = document.getElementById("ally-code-input");
    const passInput = document.getElementById("password-input"); // Assure-toi que l'ID correspond au HTML
    
    const code = allyInput.value.trim();
    const password = passInput.value.trim();

    if (code.length < 3 || password.length < 6) {
        alert("Ally Code (min 3) and Password (min 6) required");
        return;
    }

    currentAllyCode = code;
    const fakeEmail = `${code}@swgohwordle.com`; // Format d'email interne

    if (window.db && window.fbAuth) {
        try {
            let user;
            try {
                // 1. On tente d'abord la CONNEXION
                const res = await window.fbAuth.signInWithEmailAndPassword(window.fbAuth.auth, fakeEmail, password);
                user = res.user;
                console.log("🔓 Login réussi");
            } catch (err) {
                // 2. Si l'utilisateur n'existe pas, on le CRÉE
                if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                    const res = await window.fbAuth.createUserWithEmailAndPassword(window.fbAuth.auth, fakeEmail, password);
                    user = res.user;
                    console.log("✨ Compte créé avec succès");
                } else {
                    // Si c'est une autre erreur (ex: mauvais mot de passe)
                    throw err; 
                }
            }

            // 3. Récupération des données Firestore via l'UID
            const playerRef = window.fbOps.doc(window.db, "players", user.uid);
            const playerDoc = await window.fbOps.getDoc(playerRef);
            
            if (playerDoc.exists()) {
                const cloudHistory = playerDoc.data().history || [];
                localStorage.setItem(`history_${currentAllyCode}`, JSON.stringify(cloudHistory));
            } else {
                // Initialisation du document si nouveau joueur
                await window.fbOps.setDoc(playerRef, { history: [], allyCode: code });
            }

        } catch (e) {
            console.error("Erreur Auth:", e);
            if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                alert("Mot de passe incorrect pour cet Ally Code.");
            } else {
                alert("Erreur : " + e.message);
            }
            return;
        }
    }

    // Suite de la logique (lancement du jeu)
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

function showHintPopup() {
    hintUsed = true;
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    
    // Filtrage des unités qui correspondent à TOUS les indices trouvés
    const filtered = allUnits.filter(u => {
        const matchAlign = foundTraits.alignment === "?" || getLoc(u.alignment) === foundTraits.alignment;
        const matchRole = foundTraits.role === "?" || getLoc(u.role) === foundTraits.role;
        const matchYear = foundTraits.year === "?" || u.year == foundTraits.year;
        const matchShip = foundTraits.ship === "?" || getYesNo(checkShip(u)) === foundTraits.ship;
        const matchLeader = foundTraits.leader === "?" || getYesNo(checkLeader(u)) === foundTraits.leader;
        
        const unitFactions = u.factions.map(f => getLoc(f));
        const matchFactions = Array.from(foundTraits.factions).every(f => unitFactions.includes(f));

        return matchAlign && matchRole && matchYear && matchShip && matchLeader && matchFactions;
    });

    let html = `<div class="modal-content">
        <h2 style="color:#00d4ff">${t["hint-pop-title"]} (${filtered.length})</h2>
        <div style="max-height:300px; overflow-y:auto; display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:15px 0;">`;
    
    filtered.forEach(u => {
        html += `<div style="font-size:0.8rem; background:rgba(255,255,255,0.1); padding:5px; border-radius:5px; text-align:center;">
            <img src="${u.image}" width="30" style="border-radius:50%"><br>${getLoc(u.name)}
        </div>`;
    });

    html += `</div><button onclick="closeModal()" class="main-btn">${t["hint-back"]}</button></div>`;
    modal.innerHTML = html;
    modal.classList.remove("hidden");
    
    // On vide le conteneur pour faire disparaître le bouton utilisé
    const helpActions = document.getElementById("help-actions-container");
    if (helpActions) helpActions.innerHTML = "";
}

async function saveToHistory(unit, count) {
    const key = `history_${currentAllyCode}`;
    let history = JSON.parse(localStorage.getItem(key) || "[]");
    const today = new Date().toLocaleDateString();
    
    if (!history.find(h => h.date === today)) {
        const newEntry = { 
            date: today, 
            name: getLoc(unit.name), 
            attempts: count, 
            img: unit.image 
        };
        history.unshift(newEntry);
        if (history.length > 30) history.pop();
        
        // 1. Sauvegarde Locale (on garde l'Ally Code pour le stockage navigateur)
        localStorage.setItem(key, JSON.stringify(history));

        // 2. Sauvegarde Cloud Sécurisée
        // On vérifie si l'utilisateur est bien connecté via Firebase Auth
        const user = window.fbAuth.auth.currentUser;

        if (window.db && window.fbOps && user) {
            try {
                // IMPORTANT : On utilise user.uid (l'ID secret) et non currentAllyCode
                const playerRef = window.fbOps.doc(window.db, "players", user.uid);
                
                await window.fbOps.updateDoc(playerRef, { 
                    history: history,
                    lastAllyCode: currentAllyCode, // Optionnel : on garde une trace du code
                    lastUpdate: new Date()
                });
                
                console.log("☁️ Historique sécurisé synchronisé !");
            } catch (e) {
                console.error("Erreur de synchro Cloud :", e);
                // Si le document n'existe pas encore, on utilise setDoc au lieu de updateDoc
                if (e.code === 'not-found') {
                    const playerRef = window.fbOps.doc(window.db, "players", user.uid);
                    await window.fbOps.setDoc(playerRef, { history: history, allyCode: currentAllyCode });
                }
            }
        } else {
            console.warn("Cloud non synchronisé : Utilisateur non connecté ou Firebase non chargé.");
        }
    }
}

// --- RESTE DU CODE (LOGIQUE DE JEU) ---

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

function showHistory() {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    const historyCache = JSON.parse(localStorage.getItem(`history_${currentAllyCode}`) || "[]");
    const todayStr = new Date().toLocaleDateString(); // On récupère la date du jour
    
    let html = `<div class="modal-content">
        <h2 style="font-size:1.2rem">${t["hist-title"]}</h2>
        <div style="max-height: 400px; overflow-y: auto; margin: 15px 0; padding-right:5px;">`;

    for (let i = 0; i < 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateString = targetDate.toLocaleDateString();
        const unitAtDate = getDailyUnitForDate(allUnits, targetDate);
        const userEntry = historyCache.find(h => h.date === dateString);

        const isPlayed = !!userEntry;
        const isToday = (dateString === todayStr);

        // --- LOGIQUE ANTI-SPOIL ---
        // Si c'est aujourd'hui et que ce n'est pas joué, on cache les infos
        const displayName = (isToday && !isPlayed) ? "???" : getLoc(unitAtDate.name);
        const displayImg = (isToday && !isPlayed) ? PLACEHOLDER_SVG : unitAtDate.image;
        
        const opacity = isPlayed ? "1" : "0.5";
        const statusText = isPlayed 
            ? `${userEntry.attempts} ${t["vic-tries"]}` 
            : `<span style="color:#666">${isToday ? t["hist-pending"] : t["hist-not-played"]}</span>`;

        html += `
            <div style="display: flex; align-items: center; border-bottom: 1px solid #333; padding: 10px 0; opacity: ${opacity}">
                <img src="${displayImg}" width="40" style="border-radius:50%; margin-right: 12px; border: 1px solid ${isPlayed ? 'var(--sw-yellow)' : '#444'}">
                <div style="text-align:left; font-size:0.85rem">
                    <div style="color:#888; font-size:0.7rem">${dateString}</div>
                    <strong style="color:${isPlayed ? 'white' : '#aaa'}">${displayName}</strong><br>
                    ${statusText}
                </div>
            </div>`;
    }

    html += `</div><button onclick="closeModal()" class="main-btn">${t["btn-back"]}</button></div>`;
    modal.innerHTML = html;
    modal.classList.remove("hidden");
}

function getDailyUnitForDate(units, dateObj) {
    let dateSeed = dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
    // Utiliser EXACTEMENT la même formule de mélange
    let scrambledSeed = (dateSeed * 15485863) % 999999;
    let index = scrambledSeed % units.length;
    return units[index];
}

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
        <p><span>${t["h-year"]} :</span> ${foundTraits.year}</p> <p><span>${t["h-ship"]} :</span> ${foundTraits.ship}</p>
        <p><span>${t["h-leader"]} :</span> ${foundTraits.leader}</p>
        <p style="grid-column: 1 / -1;"><span>${t["h-factions"]} :</span> ${Array.from(foundTraits.factions).join(", ") || "?"}</p>
    `;
}

function switchLanguage(lang) {
    sessionStorage.setItem("selectedLanguage", lang);
    const t = translations[lang];

    // 1. Éléments de l'interface principale
    document.getElementById("game-title").textContent = t["game-title"];
    document.getElementById("start-btn").textContent = t["start-btn"];
    input.placeholder = t["placeholder"];

    // 2. Mise à jour de la Modal d'Aide (Règles)
    const helpModal = document.getElementById("help-modal");
    if (helpModal) {
        document.getElementById("help-modal-title").textContent = t["rules-title"];
        const helpSub = helpModal.querySelector(".help-sub");
        if (helpSub) helpSub.textContent = t["rules-next"];
        
        const sections = helpModal.querySelectorAll(".help-section h3");
        if (sections[0]) sections[0].textContent = t["rules-prop"];
        if (sections[1]) sections[1].textContent = t["rules-feed"];

        const propsList = helpModal.querySelector(".properties-list");
        if (propsList) {
            propsList.innerHTML = `
                <li>${t["rule-align"]}</li>
                <li>${t["rule-ship"]}</li>
                <li>${t["rule-fact"]}</li>
                <li>${t["rule-lead"]}</li>
                <li>${t["rule-year"]}</li>
                <li>${t["rule-role"]}</li>
            `;
        }

        const feedbackLabels = helpModal.querySelectorAll(".feedback-item span");
        if (feedbackLabels.length >= 3) {
            feedbackLabels[0].textContent = t["feed-correct"];
            feedbackLabels[1].textContent = t["feed-partial"];
            feedbackLabels[2].textContent = t["feed-wrong"];
        }
    }

    // 3. Traduction des Boutons d'Action (Indice / Abandon)
    // On les cherche dans le DOM pour les traduire s'ils sont déjà affichés
    const activeHintBtn = document.querySelector(".hint-btn");
    if (activeHintBtn) activeHintBtn.textContent = t["btn-hint"];
    
    const activeGiveUpBtn = document.querySelector(".giveup-btn");
    if (activeGiveUpBtn) activeGiveUpBtn.textContent = t["btn-giveup"];

    // 4. Traduction des En-têtes du tableau de jeu (si le jeu a commencé)
    const headers = document.querySelectorAll(".header-cell");
    if (headers.length >= 7) {
        headers[0].textContent = t["h-name"];
        headers[1].textContent = t["h-align"];
        headers[2].textContent = t["h-ship"];
        headers[3].textContent = t["h-factions"];
        headers[4].textContent = t["h-leader"];
        headers[5].textContent = t["h-role"];
        headers[6].textContent = t["h-year"];
    }

    // 5. Actualisation des composants de jeu
    if (allUnits.length > 0) displayAllUnits(allUnits);
    
    updateTimer();

    // Actualisation du résumé (Indices identifiés)
    if (document.getElementById("summary-container") && !document.getElementById("summary-container").classList.contains("hidden")) {
        updateSummary();
    }
}

function startNewGame(mode) {
    gameMode = mode;
    attempts = 0;
    hintUsed = false;
    
    foundTraits = { alignment: "?", role: "?", ship: "?", leader: "?", factions: new Set(), year: "?" };
    targetUnit = (mode === "daily") ? getDailyUnit(allUnits) : allUnits[Math.floor(Math.random() * allUnits.length)];

    document.getElementById("setup-container").classList.add("hidden");
    searchContainer.classList.remove("hidden");
    
    // On vide les anciens boutons si une partie précédente a eu lieu
    const helpContainer = document.getElementById("help-actions-container");
    if (helpContainer) helpContainer.innerHTML = "";

    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];
    
    // On ne garde que les headers ici
    guessesContainer.innerHTML = `
        <div class="guess-row headers">
            <div class="header-cell">${t["h-name"]}</div>
            <div class="header-cell">${t["h-align"]}</div>
            <div class="header-cell">${t["h-ship"]}</div>
            <div class="header-cell">${t["h-factions"]}</div>
            <div class="header-cell">${t["h-leader"]}</div>
            <div class="header-cell">${t["h-role"]}</div>
            <div class="header-cell">${t["h-year"]}</div> 
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

    // --- LOGIQUE DE L'ANNÉE ---
    let yearArrow = "";
    let yearStatus = "wrong";

    if (unit.year === targetUnit.year) {
        yearStatus = "correct";
    } else if (unit.year < targetUnit.year) {
        yearArrow = " ↑"; 
    } else {
        yearArrow = " ↓"; 
    }

    if (unit.year === targetUnit.year) foundTraits.year = unit.year;

    updateSummary();

    const guessData = {
        image: unit.image,
        name: getLoc(unit.name),
        alignment: { val: getLoc(unit.alignment), match: unit.alignment.en === targetUnit.alignment.en },
        ship: { val: getYesNo(checkShip(unit)), match: checkShip(unit) === checkShip(targetUnit) },
        leader: { val: getYesNo(checkLeader(unit)), match: checkLeader(unit) === checkLeader(targetUnit) },
        role: { val: getLoc(unit.role), match: unit.role.en === targetUnit.role.en },
        factions: { val: getCleanFactions(unit).map(f => getLoc(f)).join(", "), status: factionStatus },
        year: { val: unit.year + yearArrow, status: yearStatus }
    };

    renderGuessRow(guessData);

// --- LOGIQUE DES BOUTONS D'AIDE (INDICE & ABANDON) ---
    const helpContainer = document.getElementById("help-actions-container");
    if (helpContainer) {
        const lang = sessionStorage.getItem("selectedLanguage") || "en";
        const t = translations[lang];

        // On vide pour reconstruire proprement à chaque essai
        helpContainer.innerHTML = ""; 

        // 1. Création du bouton INDICE (si >= 4 essais ET non utilisé)
        if (attempts >= 4 && !hintUsed) {
            const btnHint = document.createElement("button");
            btnHint.className = "main-btn hint-btn";
            btnHint.textContent = t["btn-hint"];
            btnHint.onclick = showHintPopup;
            helpContainer.appendChild(btnHint);
        }

        // 2. Création du bouton ABANDON (si >= 10 essais)
        // On utilise un 'if' séparé pour que les deux boutons puissent être là en même temps
        if (attempts >= 10) {
            const btnGiveUp = document.createElement("button");
            btnGiveUp.className = "main-btn giveup-btn";
            // Ajout d'une petite marge à gauche si le bouton indice est déjà présent
            if (helpContainer.children.length > 0) btnGiveUp.style.marginLeft = "10px";
            
            btnGiveUp.textContent = t["btn-giveup"];
            btnGiveUp.onclick = handleGiveUp;
            helpContainer.appendChild(btnGiveUp);
        }
    }

    // --- VÉRIFICATION VICTOIRE ---
    if (unit.id === targetUnit.id || getLoc(unit.name) === getLoc(targetUnit.name)) {
        if (helpContainer) helpContainer.innerHTML = "";
        if(gameMode === "daily") saveToHistory(targetUnit, attempts);
        showVictory();
    }
}

async function handleGiveUp() {
    const lang = sessionStorage.getItem("selectedLanguage") || "en";
    const t = translations[lang];

    // Utilisation de la confirmation traduite
    if (!confirm(t["confirm-giveup"])) return;

    if (gameMode === "daily") {
        const key = `history_${currentAllyCode}`;
        let history = JSON.parse(localStorage.getItem(key) || "[]");
        const today = new Date().toLocaleDateString();

        if (!history.find(h => h.date === today)) {
            const entry = {
                date: today,
                name: getLoc(targetUnit.name),
                // On enregistre le statut d'abandon de façon lisible
                attempts: lang === "fr" ? "Abandon" : "Gave Up", 
                img: targetUnit.image
            };
            history.unshift(entry);
            localStorage.setItem(key, JSON.stringify(history));
            
            // Synchronisation Firebase si connecté
            const user = window.fbAuth?.auth?.currentUser;
            if (user && window.db) {
                try {
                    const playerRef = window.fbOps.doc(window.db, "players", user.uid);
                    await window.fbOps.updateDoc(playerRef, { history: history });
                } catch(e) {
                    console.error("Erreur synchro abandon:", e);
                }
            }
        }
    }
    
    // On affiche la modal de fin
    showVictory();
    
    // On change le titre de la modal pour indiquer la révélation
    setTimeout(() => {
        const title = modal.querySelector("h2");
        if (title) title.textContent = t["revealed-title"];
    }, 10);
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
        <div class="cell ${data.year.status}">${data.year.val}</div> 
    `;
    // On s'assure d'insérer après les headers
    const headerRow = guessesContainer.querySelector('.headers');
    if (headerRow) {
        headerRow.insertAdjacentElement('afterend', row);
    }
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
                <p><span>${t["h-year"]} :</span> ${targetUnit.year}</p>
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
        if (rawFactions.includes("leader")) extraTags += `<span class="badge-extra badge-leader">${translations[lang]["tag-leader"]}</span>`;
        if (rawFactions.includes("crew member")) extraTags += `<span class="badge-extra badge-ship">${translations[lang]["tag-crew"]}</span>`;
        if (rawFactions.includes("fleet commander")) extraTags += `<span class="badge-extra badge-ship">${translations[lang]["tag-commander"]}</span>`;

        card.innerHTML = `
            <img src="${unit.image}" alt="${name}" onerror="this.src='${PLACEHOLDER_SVG}'">
            <div class="unit-info">
                <h4>${name}</h4>
                <p class="align-text"><strong>${align}</strong></p>
                <p class="role-text">${role}</p>
                <small class="factions-text">${factions}</small>
                <div class="extra-indices">${extraTags}</div>
            </div>`;
        
        card.onclick = () => {
            if (!searchContainer.classList.contains("hidden")) {
                submitGuess(unit);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        container.appendChild(card);
    });
}

function openHelp() {
    const helpModal = document.getElementById("help-modal");
    helpModal.classList.remove("hidden");
    
    // Mise à jour du chrono dans la modal immédiatement
    updateHelpTimer();
}

function closeHelp() {
    document.getElementById("help-modal").classList.add("hidden");
}

function updateHelpTimer() {
    const timerText = document.getElementById("timer").textContent;
    const helpTimer = document.getElementById("help-timer");
    if (helpTimer) helpTimer.textContent = timerText;
}

// Optionnel : Mettre à jour le chrono de la modal chaque seconde si elle est ouverte
setInterval(() => {
    const helpModal = document.getElementById("help-modal");
    if (helpModal && !helpModal.classList.contains("hidden")) {
        updateHelpTimer();
    }
}, 1000);

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
        const checkData = setInterval(() => {
            if (allUnits.length > 0) {
                logRotationHistory(allUnits);
                clearInterval(checkData);
            }
        }, 100);
    }
    switchLanguage(sessionStorage.getItem("selectedLanguage") || "en");
    updateTimer();
};

window.onclick = (e) => { if (e.target == modal) closeModal(); };