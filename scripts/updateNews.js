import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const url = "https://forums.ea.com/category/star-wars-galaxy-of-heroes-en/blog/swgoh-game-info-hub-en";

async function updateNews() {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const news = [];

    $(".DiscussionListItem").each((i, el) => {
      const title = $(el).find(".Title a").text().trim();
      const link = $(el).find(".Title a").attr("href");
      const date = $(el).find(".DateCreated time").attr("datetime");
      if (title && link) {
        news.push({
          title,
          date: date || null,
          link: `https://forums.ea.com${link}`,
        });
      }
    });

    fs.writeFileSync("./news.json", JSON.stringify(news, null, 2));
    console.log("✅ news.json mis à jour :", news.length, "articles");
  } catch (error) {
    console.error("❌ Erreur de récupération :", error.message);
  }
}

updateNews();
