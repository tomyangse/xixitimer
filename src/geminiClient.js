// Gemini API Client for Goal Mentor feature
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function getGoalMentorAdvice(goalsData, currentDate, dayOfWeek, daysLeftInWeek, language = 'zh') {
    const langInstructions = {
        'en': {
            role: 'You are a friendly mentor named "Smarty" helping kids (8-12 yo) manage study goals.',
            prompt: 'Please reply in English.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Welcome back! Keep working on your goals!',
                suggestion: 'Pick an activity to start today.',
                encouragement: 'believe in yourself! 💪'
            }
        },
        'sv': {
            role: 'Du är en vänlig mentor som heter "Smarty" och hjälper barn (8-12 år) att hantera studiemål.',
            prompt: 'Svara på svenska.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Välkommen tillbaka! Fortsätt jobba mot dina mål!',
                suggestion: 'Välj en aktivitet att börja med idag.',
                encouragement: 'Tro på dig själv! 💪'
            }
        },
        'zh': {
            role: '你是一个友善的儿童学习导师"小智"，负责帮助8-12岁的孩子管理学习目标。',
            prompt: '请用中文回复。',
            jsonStructure: '{"summary": "本周进度总结", "suggestion": "今天的建议", "encouragement": "鼓励的话"}',
            fallback: {
                summary: '欢迎回来！继续努力完成你的目标吧！',
                suggestion: '今天可以选择一个活动开始练习。',
                encouragement: '相信自己，你可以做到！💪'
            }
        },
        'fr': {
            role: 'Tu es un mentor amical nommé "Smarty" aidant les enfants (8-12 ans) à gérer leurs objectifs d\'étude.',
            prompt: 'Veuillez répondre en français.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Bienvenue ! Continue à travailler sur tes objectifs !',
                suggestion: 'Choisis une activité pour commencer aujourd\'hui.',
                encouragement: 'Crois en toi ! 💪'
            }
        },
        'de': {
            role: 'Du bist ein freundlicher Mentor namens "Smarty", der Kindern (8-12 Jahre) hilft, ihre Lernziele zu verwalten.',
            prompt: 'Bitte antworte auf Deutsch.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Willkommen zurück! Arbeite weiter an deinen Zielen!',
                suggestion: 'Wähle eine Aktivität, um heute zu beginnen.',
                encouragement: 'Glaube an dich selbst! 💪'
            }
        },
        'es': {
            role: 'Eres un mentor amigable llamado "Smarty" que ayuda a los niños (8-12 años) a gestionar sus objetivos de estudio.',
            prompt: 'Por favor, responde en español.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: '¡Bienvenido de nuevo! ¡Sigue trabajando en tus objetivos!',
                suggestion: 'Elige una actividad para empezar hoy.',
                encouragement: '¡Cree en ti mismo! 💪'
            }
        },
        'it': {
            role: 'Sei un mentore amichevole di nome "Smarty" che aiuta i bambini (8-12 anni) a gestire gli obiettivi di studio.',
            prompt: 'Per favore rispondi in italiano.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Bentornato/a! Continua a lavorare sui tuoi obiettivi!',
                suggestion: 'Scegli un\'attività per iniziare oggi.',
                encouragement: 'Credi in te stesso! 💪'
            }
        },
        'da': {
            role: 'Du er en venlig mentor ved navn "Smarty", der hjælper børn (8-12 år) med at styre studiemål.',
            prompt: 'Svar venligst på dansk.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Velkommen tilbage! Fortsæt med at arbejde på dine mål!',
                suggestion: 'Vælg en aktivitet for at starte i dag.',
                encouragement: 'Tro på dig selv! 💪'
            }
        },
        'no': {
            role: 'Du er en vennlig mentor ved navn "Smarty" som hjelper barn (8-12 år) med å håndtere studiemål.',
            prompt: 'Svar på norsk.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Velkommen tilbake! Fortsett å jobb med målene dine!',
                suggestion: 'Velg en aktivitet for å starte i dag.',
                encouragement: 'Tro på deg selv! 💪'
            }
        },
        'fi': {
            role: 'Olet ystävällinen mentori nimeltä "Smarty", joka auttaa lapsia (8-12 v) hallitsemaan opiskelutavoitteita.',
            prompt: 'Vastaa suomeksi.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Tervetuloa takaisin! Jatka tavoitteidesi eteen työskentelyä!',
                suggestion: 'Valitse aktiviteetti aloittaaksesi tänään.',
                encouragement: 'Usko itseesi! 💪'
            }
        },
        'is': {
            role: 'Þú ert vingjarnlegur leiðbeinandi sem heitir "Smarty" og hjálpar börnum (8-12 ára) að stjórna námsmarkmiðum.',
            prompt: 'Vinsamlegast svaraðu á íslensku.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'Velkomin(n) aftur! Haltu áfram að vinna að markmiðum þínum!',
                suggestion: 'Veldu verkefni til að byrja á í dag.',
                encouragement: 'Trúðu á sjálfan þig! 💪'
            }
        },
        'ja': {
            role: 'あなたは、子供たち（8〜12歳）が学習目標を管理するのを手助けする「Smarty」という親切なメンターです。',
            prompt: '日本語で返信してください。',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: 'おかえりなさい！目標に向かって頑張りましょう！',
                suggestion: '今日始めるアクティビティを選んでください。',
                encouragement: '自分を信じて！ 💪'
            }
        },
        'ko': {
            role: '당신은 아이들(8-12세)이 학습 목표를 관리하도록 돕는 "Smarty"라는 친절한 멘토입니다.',
            prompt: '한국어로 답변해 주세요.',
            jsonStructure: '{"summary": "...", "suggestion": "...", "encouragement": "..."}',
            fallback: {
                summary: '어서 오세요! 목표를 향해 계속 노력하세요!',
                suggestion: '오늘 시작할 활동을 선택하세요.',
                encouragement: '자신을 믿으세요! 💪'
            }
        }
    };

    // Default to 'zh' if language not supported directly
    const langKey = (language && language.slice(0, 2)) || 'zh';
    const config = langInstructions[langKey] || langInstructions['zh'];

    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured');
        return config.fallback;
    }

    const prompt = `${config.role}

当前日期 (Current Date)：${currentDate}（${dayOfWeek}）
本周还剩 (Days left)：${daysLeftInWeek} 天

孩子的目标和完成情况 (Goals Data)：
${goalsData}

${config.prompt}
Reply in JSON format (no markdown code blocks):
${config.jsonStructure}

注意 (Notes):
- Tone should be warm and encouraging for kids.
- No criticism for falling behind, offer catch-up advice.
- Praise good progress.
- Be specific.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    }
                })
            }
        );

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const text = data.candidates[0].content.parts[0].text;
            // Try to parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }

        // Fallback
        return config.fallback;
    } catch (error) {
        console.error('Gemini API error:', error);
        return config.fallback;
    }
}
