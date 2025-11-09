// scripts/updateNews.js
import axios from "axios";
import fs from "fs";

const apiUrl = "https://forums.ea.com/en/star-wars-galaxy-of-heroes/api/v2/discussions?categoryID=swgoh-game-info-hub-en";

function pickTitle(item) {
  // essaie plusieurs clés possibles
  return item.Name || item.Title || item.name || item.title || item.Subject || item.DiscussionName || item.DiscussionTitle || null;
}

function pickDate(item) {
  return item.DateInserted || item.PostedDate || item.CreatedAt || item.created || item.date || null;
}

function pickUrl(item) {
  // cas courant : UrlCode + DiscussionID
  if (item.UrlCode && item.DiscussionID) {
    return `https://forums.ea.com/en/star-wars-galaxy-of-heroes/blog/swgoh-game-info-hub-en/${item.UrlCode}/${item.DiscussionID}`;
  }
  // sinon essayer une propriété directe
  if (item.Url || item.url || item.Link || item.link) {
    return item.Url || item.url || item.Link || item.link;
  }
  // sinon null
  return null;
}

async function updateNews() {
  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 });
    // LOG: afficher dans les logs la forme brute (limité) pour debug
    console.log("DEBUG: top-level keys:", Object.keys(data || {}).slice(0,50));
    if (Array.isArray(data)) {
      console.log("DEBUG: data is an array; length =", data.length);
    } else if (data && typeof data === "object") {
      // si la réponse contient un container (ex: Discussions)
      const containerKeys = Object.keys(data).slice(0,50);
      console.log("DEBUG: container keys sample:", containerKeys);
      if (data.Discussions && Array.isArray(data.Discussions)) {
        console.log("DEBUG: data.Discussions length =", data.Discussions.length);
      } else {
        // show first few props of the object for inspection
        const firstKey = containerKeys[0];
        if (firstKey && data[firstKey]) {
          console.log("DEBUG sample of", firstKey, ":", JSON.stringify(data[firstKey], null, 2).slice(0,1000));
        }
      }
    }

    // On trouve l'array contenant les discussions de façon robuste
    let discussions = null;
    if (Array.isArray(data)) discussions = data;
    else if (Array.isArray(data.Discussions)) discussions = data.Discussions;
    else if (Array.isArray(data.discussions)) discussions = data.discussions;
    else if (Array.isArray(data.Threads)) discussions = data.Threads;
    else {
      // chercher premier champ tableau
      for (const k of Object.keys(data || {})) {
        if (Array.isArray(data[k])) {
          discussions = data[k];
          console.log(`DEBUG: using array at key "${k}" as discussions`);
          break;
        }
      }
    }

    if (!discussions) {
      console.error("❌ Impossible de trouver un tableau de discussions dans la réponse. Voir logs DEBUG ci-dessus.");
      // on écrit un JSON vide pour ne pas casser le site
      fs.writeFileSync("./news.json", JSON.stringify([], null, 2));
      return;
    }

    const news = discussions.map(item => {
      const title = pickTitle(item) || "(Titre non disponible)";
      const date = pickDate(item) || null;
      const link = pickUrl(item) || null;
      return { title, date, link };
    }).filter(n => n.title); // garder les éléments ayant un titre

    fs.writeFileSync("./news.json", JSON.stringify(news, null, 2));
    console.log(`✅ news.json mis à jour (${news.length} articles)`);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération:", error && error.message ? error.message : error);
    // écrire un fichier minimal pour ne pas casser l'affichage
    try { fs.writeFileSync("./news.json", JSON.stringify([], null, 2)); } catch(e){/* ignore */ }
  }
}

updateNews();
