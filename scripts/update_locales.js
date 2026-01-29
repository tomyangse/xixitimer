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

// Key to add
const NAMESPACE = 'mentor';
const KEY = 'title';
const DEFAULT_VALUE = 'Smarty Mentor';
const ZH_VALUE = '小智导师';

const locales = files.map(f => f.replace('.json', ''));

locales.forEach(locale => {
    const filePath = path.join(localesDir, `${locale}.json`);

    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            let json = JSON.parse(content);

            // Ensure namespace exists
            if (!json[NAMESPACE]) {
                json[NAMESPACE] = {};
            }

            // Check if key exists
            if (!json[NAMESPACE][KEY]) {
                console.log(`Adding ${NAMESPACE}.${KEY} to ${locale}.json`);
                // Use Chinese value for 'zh', English/Default for others
                json[NAMESPACE][KEY] = (locale === 'zh') ? ZH_VALUE : DEFAULT_VALUE;

                fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
                console.log(`Updated ${locale}.json`);
            } else {
                console.log(`Key ${NAMESPACE}.${KEY} already exists in ${locale}.json`);
                // Force update for zh if it's not correct (optional, but good for fixing previous state)
                if (locale === 'zh' && json[NAMESPACE][KEY] !== ZH_VALUE) {
                    json[NAMESPACE][KEY] = ZH_VALUE;
                    fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
                    console.log(`Fixed zh value in ${locale}.json`);
                }
            }
        }
    } catch (err) {
        console.error(`Error processing ${locale}.json:`, err);
    }
});
