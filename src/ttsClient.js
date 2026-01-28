// Google Cloud Text-to-Speech Client
const GOOGLE_TTS_API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY;

/**
 * Convert text to speech using Google Cloud TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} languageCode - Language code (default: zh-CN)
 * @param {string} voiceName - Voice name (default: zh-CN-Wavenet-A for female)
 * @returns {Promise<string>} - Base64 encoded audio content
 */
export async function textToSpeech(text, languageCode = 'cmn-CN', voiceName = 'cmn-CN-Standard-A') {
    if (!GOOGLE_TTS_API_KEY) {
        console.warn('Google TTS API key not configured');
        return null;
    }

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
                        languageCode,
                        name: voiceName,
                        ssmlGender: 'FEMALE'
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
 */
export async function speak(text) {
    const audioContent = await textToSpeech(text);
    if (audioContent) {
        return playAudio(audioContent);
    }

    // Fallback to browser native TTS
    console.log('Using browser TTS fallback');
    return speakWithBrowser(text);
}

/**
 * Fallback: Use browser's native Speech Synthesis
 * @param {string} text - Text to speak
 */
function speakWithBrowser(text) {
    if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    window.speechSynthesis.speak(utterance);

    // Return a pseudo-audio object for compatibility
    return {
        pause: () => window.speechSynthesis.cancel(),
        onended: null
    };
}
