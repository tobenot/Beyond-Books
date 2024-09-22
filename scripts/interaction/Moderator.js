class Moderator {
    constructor(startEvent, commonKnowledge, GMDetails, playerInfo) {
        this.startEvent = startEvent;
        this.commonKnowledge = commonKnowledge;
        this.GMDetails = GMDetails;
        this.playerInfo = playerInfo;
    }

    async validateAction(action) {
        const VALIDATE_ACTION_SCHEMA = {
            type: "object",
            properties: {   
                reason: { type: "string" },
                suggestion: { type: "string" },
                isValid: { type: "boolean" },
                specificAction: { type: "string" }
            },
            required: ["reason", "suggestion", "isValid", "specificAction"],
            additionalProperties: false
        };

        const prompt = `
作为游戏主持人，请评估玩家是否有能力进行他描述的行动，背景：

开始事件：${this.startEvent}
公共知识：${this.commonKnowledge}
GM细节：${this.GMDetails}

玩家信息：
${this.playerInfo}

玩家行动：${action}
注意，玩家的行为可以胡闹，你主要判断可行性，只要有能力做到，就可以做。
请用JSON格式回答，包含以下字段：
- reason: 解释玩家行动是否可行的原因
- suggestion: 如果行动不可行，给出的建议。如果可行，则留空。
- isValid: 玩家行动是否可行的结论（布尔值）
- specificAction: 请具体描述玩家实际做的事情和说得话，避免歧义，同时也尽量保留原话，最重要的是具体化对象。例如，如果玩家说'你好'，可以描述为'向在场的人问好'，或者判断到是向谁问好。如果不可行，可以留空。如果玩家使用了特殊能力或技能，请具体说明使用的是哪个能力或技能，以及其具体的效果。`;

        const response = await this.callLargeLanguageModel(prompt, VALIDATE_ACTION_SCHEMA);
        return response;
    }

    async summarizeActions(mainPlayerAction, aiActions) {
        const SUMMARIZE_ACTIONS_SCHEMA = {
            type: "object",
            properties: {
                collision: { type: "string" },
                summary: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            note: { type: "string" }
                        },
                        required: ["name", "note"],
                        additionalProperties: false
                    }
                },
                endSectionFlag: { type: "boolean" }
            },
            required: ["collision", "summary", "endSectionFlag"],
            additionalProperties: false
        };

        const optimizedHistory = optimizedConversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
        
        const prompt = `请考虑以下背景信息和优化后的对话历史：

起始事件：${this.startEvent}
公共信息：${this.commonKnowledge}
主持人信息：${this.GMDetails}

优化后的对话历史：
${optimizedHistory}

现在，请分析这个回合中每个角色的行动：
主角行动：${mainPlayerAction}

其他角色行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action.action}`).join('\n')}

请按照指定的JSON格式回复，包括以下字段：
- collision: 角色之间行动的冲突，哪个角色做的可能让另一个角色达不到最终的效果
- summary: 一个数组，包含每个角色的名字和行动结果注释。
  - name: 角色名字
  - note: 对该行动的结论性判定，例如"攻击成功"、"防御失败"、"行动受阻"等，只简单写被谁影响、成败，不写心理。
- endSectionFlag: 布尔值，是否满足了桥段结束条件？如果是，将进入桥段复盘环节

请只提供简短的结论性判定，不要重复原始行动描述。`;

        console.log("生成总结提示", prompt);
        const response = await this.callLargeLanguageModel(prompt, SUMMARIZE_ACTIONS_SCHEMA);
        return response;
    }

    async generateFinalResult(actionSummary, mainPlayerAction, aiActions) {
        const optimizedHistory = optimizedConversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
        
        const actionsWithNotes = [
            { name: selectedCharacter, action: mainPlayerAction, note: actionSummary.summary.find(s => s.name === selectedCharacter)?.note || "" },
            ...Object.entries(aiActions).map(([name, action]) => ({
                name,
                action: action.action,
                note: actionSummary.summary.find(s => s.name === name)?.note || ""
            }))
        ];

        const prompt = `请考虑以下背景信息和优化后的对话历史：

起始事件：${this.startEvent}
公共信息：${this.commonKnowledge}
主持人信息：${this.GMDetails}

过去回合历史：
${optimizedHistory}

本回合各角色的行动和结果：
${actionsWithNotes.map(item => `${item.name}: ${item.action}\n结论: ${item.note}`).join('\n\n')}

请小说化地描述这个新的回合的结果，包括每个角色说出来的话、做的动作等。请用第三人称方式描写。请确保描述中包含每个角色实际成功做出的行动，并考虑行动结果注释。注意你的回复会直接增量展示为小说内容，所以不要写前导后缀提示。也不需要写太多内容，不要写重复了。也不要描写主角${selectedCharacter}的心理活动或主观气氛。`;

        console.log("生成最终结果提示", prompt);

        const response = await this.callLargeLanguageModelStream(prompt);
        return response;
    }

    async callLargeLanguageModel(prompt, schema) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                model: getModel(ModelType.BASIC), // 使用基本模型
                messages: [{ role: "user", content: prompt }],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "moderator_response",
                        schema: schema,
                        strict: true
                    }
                },
                max_tokens: 1000
            }),
            credentials: 'include'
        });

        const responseData = await handleApiResponse(response);
        return JSON.parse(responseData.choices[0].message.content);
    }

    async callLargeLanguageModelStream(prompt) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                model: getModel(ModelType.BASIC), // 使用基本模型
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