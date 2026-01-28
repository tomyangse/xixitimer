import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const translations = {
    'en': 'Cloud Sync',
    'zh': '同步到云端',
    'sv': 'Moln Synk',
    'fr': 'Synchro Cloud',
    'de': 'Cloud Sync',
    'es': 'Sincronización Nube',
    'it': 'Sincronizzazione Cloud',
    'da': 'Sky Synkronisering',
    'no': 'Sky Synkronisering',
    'fi': 'Pilvisynkronointi',
    'is': 'Skýjasamstilling',
    'ja': 'クラウド同期',
    'ko': '클라우드 동기화'
};

files.forEach(file => {
    const lang = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.settings) content.settings = {};
    content.settings.sync = translations[lang] || 'Cloud Sync';

    fs.writeFileSync(filePath, JSON.stringify(content, null, 4), 'utf8');
    console.log(`Updated ${file}`);
});
