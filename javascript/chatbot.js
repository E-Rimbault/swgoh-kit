
function toggleChatbot() {
    const chatbotSection = document.getElementById('chatbot-section');
    if (chatbotSection.style.display === 'none' || chatbotSection.style.display === '') {
        chatbotSection.style.display = 'block';
    } else {
        chatbotSection.style.display = 'none';
    }
}

function afficherQuestions() {
    const questions = [
        "Sur quelle page voulez-vous vous rendre?",
        "page swgoh.gg",
        "filtre personnage",
        "filtre vaisseaux",
        "recherche perso",
        "recherche vaisseaux",
        "Guide du voyage",
        "CGU"
    ];
    const selectElement = document.getElementById('question-dropdown');
    selectElement.innerHTML = ''; // Clear any existing options
    questions.forEach((question, index) => {
        const option = document.createElement('option');
        option.textContent = question;
        option.value = index;
        selectElement.appendChild(option);
    });
}

function obtenirReponse(selection) {
    const reponses = {
        0: "",
        1: "<a href='https://swgoh.gg/' target='_blank'>page swgoh.gg</a>",
        2: "<a href='filtre-recherche/filtre-personnage.html'>Filtre personnage</a>",
        3: "<a href='filtre-recherche/filtre-vaisseaux.html'>Filtre vaisseaux</a>",
        4: "<a href='filtre-recherche/recherche-perso.html'>Recherche personnage</a>",
        5: "<a href='filtre-recherche/recherche-vaisseaux.html'>Recherche vaisseaux</a>",
        6: "<a href='guide-du-voyage/guide-voyage.html'>Guide du voyage</a>",
        7 :"<a href='CGU.html'>CGU</a>"
    };
    return reponses[selection] || "Sélection invalide. Veuillez choisir une question valide.";
}

function getReponse() {
    const selection = parseInt(document.getElementById('question-dropdown').value, 10);
    const reponse = obtenirReponse(selection);
    document.getElementById('reponse').innerHTML = reponse; // Use innerHTML to display the link properly
    document.getElementById('reponse').style.display = 'block';
    document.getElementById('questions').style.display = 'none';
    document.getElementById('new-question-btn').style.display = 'block';
}

function nouvelleQuestion() {
    document.getElementById('reponse').innerHTML = '';
    document.getElementById('reponse').style.display = 'none';
    document.getElementById('questions').style.display = 'block';
    document.getElementById('new-question-btn').style.display = 'none';
    afficherQuestions();
}

// Afficher les questions dès que la page se charge
window.onload = afficherQuestions;

