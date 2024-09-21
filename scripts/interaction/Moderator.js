class Moderator {
    async validateAction(action, context) {
        const prompt = `
作为游戏主持人，请评估以下玩家行动的可行性：

玩家行动：${action}

开始事件：${context.startEvent}
公共知识：${context.commonKnowledge}
GM细节：${context.GMDetails}

请回答以下问题：
1. 这个行动是否可行？（是/否）
2. 为什么？（简要解释）
3. 如果不可行，有什么建议？
4. 请具体描述玩家实际做的事情，避免歧义，最重要的是具体化对象。例如，如果玩家说"你好"，可以描述为"向在场的人问好"，或者判断到是向谁问好。

注意，玩家的行为可以不理智，你主要判断可行性，只要有能力做到，就可以做。

请用JSON格式回答：

{
"reason": "解释",
"suggestion": "如果不可行，给出建议",
"isValid": boolean,
"specificAction": "具体描述玩家实际做的事情"
}
`;

        const response = await this.callLargeLanguageModel(prompt);
        return JSON.parse(response);
    }

    async generateFinalResult(mainPlayerAction, aiActions) {
        const prompt = `请你作为主持人来最终输出这个回合的结果。
背景信息：${this.currentContext}

主角行动：${mainPlayerAction}

其他角色行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action.action}`).join('\n')}

请按照以下JSON格式回复：
{
  "display": "单个字符串，这个字段会展示给全部玩家，请小说化地、详细描述这个回合的结果,包括其他角色说出来的话、做的动作等。请用第三人称方式描写，但DO NOT描写主角的心理活动。DO NOT描写气氛等主观的事物。",
  "endSectionFlag": "布尔值,是否满足了桥段结束条件？如果是,将进入桥段复盘环节"
}`;

        console.log("生成最终结果提示", prompt);

        const response = await this.callLargeLanguageModel(prompt);
        return JSON.parse(response);
    }

    async callLargeLanguageModel(prompt) {
        // 打印日志
        console.log("调用大语言模型", {
            prompt,
            API_URL,
            API_KEY,
            MODEL
        });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                model: MODEL, 
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                max_tokens: 1000
            }),
            credentials: 'include'
        });

        const responseData = await handleApiResponse(response);
        return responseData.choices[0].message.content;
    }
}