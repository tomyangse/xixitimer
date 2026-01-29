// Google Cloud Text-to-Speech Client
const GOOGLE_TTS_API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY;

// Voice map for supported languages
// Voice map for supported languages - Upgraded to Wavenet/Neural for natural sounding speech
const VOICE_MAP = {
    'en': { languageCode: 'en-US', name: 'en-US-Neural2-F', gender: 'FEMALE' },     // Upgrade to Neural2 for English
    'zh': { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-A', gender: 'FEMALE' },    // Better Chinese Wavenet
    'sv': { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-A', gender: 'FEMALE' },
    'fr': { languageCode: 'fr-FR', name: 'fr-FR-Wavenet-A', gender: 'FEMALE' },
    'de': { languageCode: 'de-DE', name: 'de-DE-Wavenet-A', gender: 'FEMALE' },
    'es': { languageCode: 'es-ES', name: 'es-ES-Wavenet-A', gender: 'FEMALE' },
    'it': { languageCode: 'it-IT', name: 'it-IT-Wavenet-A', gender: 'FEMALE' },
    'da': { languageCode: 'da-DK', name: 'da-DK-Wavenet-A', gender: 'FEMALE' },
    'no': { languageCode: 'nb-NO', name: 'nb-NO-Wavenet-A', gender: 'FEMALE' },
    'fi': { languageCode: 'fi-FI', name: 'fi-FI-Wavenet-A', gender: 'FEMALE' },
    'is': { languageCode: 'is-IS', name: 'is-IS-Standard-A', gender: 'FEMALE' },      // Iceland only has Standard
    'ja': { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-A', gender: 'FEMALE' },
    'ko': { languageCode: 'ko-KR', name: 'ko-KR-Wavenet-A', gender: 'FEMALE' }
};

/**
 * Convert text to speech using Google Cloud TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} lang - App language code (e.g., 'en', 'zh')
 * @returns {Promise<string>} - Base64 encoded audio content
 */
export async function textToSpeech(text, lang = 'zh') {
    if (!GOOGLE_TTS_API_KEY) {
        console.warn('Google TTS API key not configured');
        return null;
    }

    const voiceConfig = VOICE_MAP[lang] || VOICE_MAP['en'];

    try {
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: voiceConfig.languageCode,
                        name: voiceConfig.name,
                        ssmlGender: voiceConfig.gender
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 0.95,  // Slightly slower for kids
                        pitch: 1.0
                    }
                })
            }
        );

        const data = await response.json();

        if (data.audioContent) {
            return data.audioContent;
        } else {
            console.error('TTS error:', data.error);
            return null;
        }
    } catch (error) {
        console.error('TTS fetch error:', error);
        return null;
    }
}

/**
 * Play audio from base64 encoded content
 * @param {string} base64Audio - Base64 encoded audio
 */
export function playAudio(base64Audio) {
    if (!base64Audio) return null;

    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    return audio;
}

/**
 * Speak text using Google Cloud TTS
 * @param {string} text - Text to speak
 * @param {string} lang - Language code (e.g. 'en', 'zh')
 */
export async function speak(text, lang = 'zh') {
    const audioContent = await textToSpeech(text, lang);
    if (audioContent) {
        return playAudio(audioContent);
    }

    // Fallback to browser native TTS
    console.log('Using browser TTS fallback');
    return speakWithBrowser(text, lang);
}

/**
 * Fallback: Use browser's native Speech Synthesis
 * @param {string} text - Text to speak
 * @param {string} lang - Language code
 */
function speakWithBrowser(text, lang = 'zh') {
    if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return null;
    }

    // Map short codes to full BCP 47 tags for browser
    const browserLangMap = {
        'en': 'en-US',
        'zh': 'zh-CN',
        'sv': 'sv-SE',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'es': 'es-ES',
        'it': 'it-IT',
        'da': 'da-DK',
        'no': 'nb-NO',
        'fi': 'fi-FI',
        'is': 'is-IS',
        'ja': 'ja-JP',
        'ko': 'ko-KR'
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = browserLangMap[lang] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    // Create a wrapper object that mimics the Audio interface
    return {
        play: async () => {
            window.speechSynthesis.cancel(); // Cancel any previous
            window.speechSynthesis.speak(utterance);

            // Return a promise that resolves when speaking ends
            return new Promise((resolve) => {
                utterance.onend = resolve;
                utterance.onerror = resolve; // Resolve on error too to prevent hanging
            });
        },
        pause: () => window.speechSynthesis.cancel(),
        onended: null // This can be assigned by consumer
    };
}
