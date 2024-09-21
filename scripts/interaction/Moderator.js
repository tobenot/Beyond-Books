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
                reason: { 
                    type: "string",
                    description: "解释玩家行动是否可行的原因"
                },
                suggestion: { 
                    type: "string",
                    description: "如果行动不可行，给出的建议"
                },
                isValid: { 
                    type: "boolean",
                    description: "玩家行动是否可行的结论"
                },
                specificAction: { 
                    type: "string",
                    description: "请具体描述玩家实际做的事情，避免歧义，最重要的是具体化对象。例如，如果玩家说‘你好’，可以描述为‘向在场的人问好’，或者判断到是向谁问好。如果不可行，可以留空。如果玩家使用了特殊能力或技能，请具体说明使用的是哪个能力或技能，以及其效果。"
                }
            },
            required: ["reason", "suggestion", "isValid", "specificAction"],
            additionalProperties: false
        };

        const prompt = `
作为游戏主持人，请评估玩家行动的可行性，背景：

开始事件：${this.startEvent}
公共知识：${this.commonKnowledge}
GM细节：${this.GMDetails}

玩家信息：
${this.playerInfo}

玩家行动：${action}
注意，玩家的行为可以不理智，你主要判断可行性，只要有能力做到，就可以做。
请按照指定的JSON格式回答。`;

        const response = await this.callLargeLanguageModel(prompt, VALIDATE_ACTION_SCHEMA);
        return response;
    }

    async summarizeActions(mainPlayerAction, aiActions) {
        const SUMMARIZE_ACTIONS_SCHEMA = {
            type: "object",
            properties: {
                collision: { 
                    type: "string",
                    description: "角色之间行动的冲突，哪个角色做的可能让另一个角色达不到最终的效果"
                },
                summary: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { 
                                type: "string",
                                description: "角色名字"
                            },
                            action: { 
                                type: "string",
                                description: "角色的实际行动"
                            },
                        },
                        required: ["name", "action"],
                        additionalProperties: false
                    },
                    required: ["mainPlayer", "aiPlayers"],
                    additionalProperties: false
                },
                endSectionFlag: { 
                    type: "boolean",
                    description: "布尔值,是否满足了桥段结束条件？如果是,将进入桥段复盘环节"
                }
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

现在，请总结这个回合中每个角色实际上做的事情：
主角之间行动可能会有冲突，所以可能需要处理，比如角色A攻击角色B，角色B防御，则这次攻击可能达不到A想达到的效果，同样的B防御也不一定达到最终的效果。
注意这里要保留原本的描写，比如具体说的话，不要简写了。
主角行动：${mainPlayerAction}

其他角色行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action.action}`).join('\n')}

请按照指定的JSON格式回复，包括主角和AI角色的行动及其结果。`;

        const response = await this.callLargeLanguageModel(prompt, SUMMARIZE_ACTIONS_SCHEMA);
        return response;
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
${actionSummary.summary.map(item => `${item.name}: ${item.action}`).join('\n')}

请小说化地、详细描述这个回合的结果,包括其他角色说出来的话、做的动作等。请用第三人称方式描写，但DO NOT描写主角的心理活动。DO NOT描写气氛等主观的事物。请确保描述中包含每个角色实际成功做出的行动。注意你的回复会直接展示为小说内容，所以不要写前导后缀提示。也不需要写太多内容。`;

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