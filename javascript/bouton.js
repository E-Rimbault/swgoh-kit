// Affiche ou masque le bouton en fonction de la position de défilement
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("scrollBtn").style.display = "block";
  } else {
    document.getElementById("scrollBtn").style.display = "none";
  }
}

// Fonction pour remonter en haut de la page
function scrollToTop() {
  document.body.scrollTop = 0; // Pour les navigateurs Safari
  document.documentElement.scrollTop = 0; // Pour les autres navigateurs
}
