class Moderator {
    constructor(startEvent, commonKnowledge, GMDetails) {
        this.startEvent = startEvent;
        this.commonKnowledge = commonKnowledge;
        this.GMDetails = GMDetails;
    }

    async validateAction(action) {
        const prompt = `
作为游戏主持人，请评估玩家行动的可行性，背景：

开始事件：${this.startEvent}
公共知识：${this.commonKnowledge}
GM细节：${this.GMDetails}

玩家行动：${action}

请回答以下问题：
1. 简要解释玩家行动是否可行
2. 如果不可行，有什么建议？
3. 给出你对于可行性的结论。
4. 请具体描述玩家实际做的事情，避免歧义，最重要的是具体化对象。例如，如果玩家说"你好"，可以描述为"向在场的人问好"，或者判断到是向谁问好。如果不可行，可以留空。

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

    async summarizeActions(mainPlayerAction, aiActions) {
        const optimizedHistory = optimizedConversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
        
        const prompt = `请考虑以下背景信息和优化后的对话历史：

起始事件：${this.startEvent}
公共信息：${this.commonKnowledge}
主持人信息：${this.GMDetails}

优化后的对话历史：
${optimizedHistory}

现在，请总结这个回合中每个角色实际上做的事情：
主角之间行动可能会有冲突，所以可能需要处理，比如角色A攻击角色B，角色B防御，则这次攻击可能达不到A想达到的效果，同样的B防御也不一定达到最终的效果。
注意这里要保留原本的描写，比如具体说的话，不要简写了。
主角行动：${mainPlayerAction}

其他角色行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action.action}`).join('\n')}

请按照以下JSON格式回复：
{
"collision": "角色之间行动的冲突，哪个角色做的可能让另一个角色达不到最终的效果",
  "summary": {
    "角色1": "角色1实际做的事",
    "角色2": "角色2实际做的事",
    // ... 其他角色
  },
  "endSectionFlag": "布尔值,是否满足了桥段结束条件？如果是,将进入桥段复盘环节"
}`;

        console.log("生成行动总结提示", prompt);

        const response = await this.callLargeLanguageModel(prompt);
        return JSON.parse(response);
    }

    async generateFinalResult(actionSummary) {
        const optimizedHistory = optimizedConversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
        
        const prompt = `请考虑以下背景信息和优化后的对话历史：

起始事件：${this.startEvent}
公共信息：${this.commonKnowledge}
主持人信息：${this.GMDetails}

优化后的对话历史：
${optimizedHistory}

各角色的行动总结：
${Object.entries(actionSummary.summary).map(([name, action]) => `${name}: ${action}`).join('\n')}

请小说化地、详细描述这个回合的结果,包括其他角色说出来的话、做的动作等。请用第三人称方式描写，但DO NOT描写主角的心理活动。DO NOT描写气氛等主观的事物。请确保描述中包含每个角色实际成功做出的行动。注意你的回复会直接展示为小说内容，所以不要写前导后缀提示。也不需要写太多内容。`;

        console.log("生成最终结果提示", prompt);

        const response = await this.callLargeLanguageModelStream(prompt);
        return response;
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

    async callLargeLanguageModelStream(prompt) {
        console.log("调用大语言模型（非JSON）", {
            prompt,
            API_URL,
            API_KEY,
            MODEL
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                model: MODEL, 
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1000,
                stream: true
            }),
            credentials: 'include'
        };

        let finalResult = '';
        const streamHandler = new StreamHandler();
        await streamHandler.fetchStream(API_URL, options, (partialResponse) => {
            updateDisplay('assistant', partialResponse, true);
            finalResult = partialResponse;
        });

        return finalResult;
    }
}