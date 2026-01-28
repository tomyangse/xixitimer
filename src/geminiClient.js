// Gemini API Client for Goal Mentor feature
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function getGoalMentorAdvice(goalsData, currentDate, dayOfWeek, daysLeftInWeek) {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured');
        return {
            summary: '欢迎回来！继续努力完成你的目标吧！',
            suggestion: '今天可以选择一个活动开始练习。',
            encouragement: '相信自己，你可以做到！💪'
        };
    }

    const prompt = `你是一个友善的儿童学习导师"小智"，负责帮助8-12岁的孩子管理学习目标。

当前日期：${currentDate}（${dayOfWeek}）
本周还剩 ${daysLeftInWeek} 天

孩子的目标和完成情况：
${goalsData}

请用温暖鼓励的语气，回复JSON格式（不要markdown代码块）：
{
  "summary": "本周进度总结（1-2句话）",
  "suggestion": "今天的建议（具体1-2个活动，考虑剩余天数）",
  "encouragement": "一句鼓励的话（可以用表情符号）"
}

注意：
- 语气要适合孩子，温暖有爱
- 如果进度落后，不要批评，而是给出追赶建议
- 如果进度良好，要表扬并鼓励保持
- 建议要具体可行`;

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
        return {
            summary: '欢迎回来！让我们一起看看本周的目标吧。',
            suggestion: '选择一个你最想完成的活动开始吧！',
            encouragement: '每一点进步都值得骄傲！🌟'
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        return {
            summary: '欢迎回来！继续努力完成你的目标吧！',
            suggestion: '今天可以选择一个活动开始练习。',
            encouragement: '相信自己，你可以做到！💪'
        };
    }
}
