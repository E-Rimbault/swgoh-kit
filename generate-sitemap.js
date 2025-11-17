const fs = require('fs');
const path = require('path');

const baseUrl = 'https://e-rimbault.github.io/swgoh-kit';
const outputPath = path.join(__dirname, 'sitemap.xml');

// Dossiers à analyser
const folders = [
  '',                  // racine (pour index.html)
  'html',
  'vaisseaux',
  'filtre-recherche',
  'classement-perso'
];

let urls = [];

// Ajoute la racine du site
urls.push({ loc: `${baseUrl}/`, priority: 1.0 });

// Fonction pour ajouter les fichiers .html d'un dossier
function addHtmlFilesFrom(folder) {
  const folderPath = path.join(__dirname, folder);

  if (!fs.existsSync(folderPath)) return;

  const files = fs.readdirSync(folderPath);

  files.forEach(file => {
    if (file.endsWith('.html')) {
      // Crée le chemin relatif et encode les caractères spéciaux
      const filePath = folder ? `${folder}/${file}` : file;
      const encodedPath = encodeURI(filePath); // encode espaces, apostrophes, &, etc.

      const fileUrl = `${baseUrl}/${encodedPath}`;
      urls.push({ loc: fileUrl, priority: 0.5 });
    }
  });
}

// Analyse tous les dossiers
folders.forEach(addHtmlFilesFrom);

// Construction du XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

urls.forEach(u => {
  xml += `  <url>\n`;
  xml += `    <loc>${u.loc}</loc>\n`;
  xml += `    <priority>${u.priority}</priority>\n`;
  xml += `  </url>\n`;
});

xml += `</urlset>\n`;

// Écriture du fichier
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`✔️ Sitemap généré : ${outputPath}`);
