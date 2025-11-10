// scripts/updateNews.js
import axios from "axios";
import fs from "fs";

const apiUrl =
  "https://forums.ea.com/en/star-wars-galaxy-of-heroes/api/v2/discussions?categoryID=swgoh-game-info-hub-en";

async function updateNews() {
  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    // Trouve le bon tableau contenant les discussions
    const discussions =
      data?.Discussions || data?.discussions || data?.Results || [];

    if (!Array.isArray(discussions) || discussions.length === 0) {
      console.error("❌ Aucune discussion trouvée dans la réponse API.");
      fs.writeFileSync("./news.json", JSON.stringify([], null, 2));
      return;
    }

    // Transforme les données en format lisible
    const news = discussions.map((item) => ({
      title: item.Name || item.Title || "Titre non disponible",
      date: item.DateInserted || item.DateCreated || null,
      link: `https://forums.ea.com/en/star-wars-galaxy-of-heroes/blog/swgoh-game-info-hub-en/${item.UrlCode}/${item.DiscussionID}`,
    }));

    // Sauvegarde à la racine du projet (pas dans scripts/)
    fs.writeFileSync("./news.json", JSON.stringify(news, null, 2));

    console.log(`✅ ${news.length} actualités enregistrées dans news.json`);
  } catch (error) {
    console.error("❌ Erreur :", error.message);
    fs.writeFileSync("./news.json", JSON.stringify([], null, 2));
  }
}

updateNews();
