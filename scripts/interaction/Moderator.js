class Moderator {
    constructor(startEvent, commonKnowledge, GMDetails, playerInfo, sectionObjective, endConditions) {
        this.startEvent = startEvent;
        this.commonKnowledge = commonKnowledge;
        this.GMDetails = GMDetails;
        this.playerInfo = playerInfo;
        this.sectionObjective = sectionObjective;
        this.endConditions = endConditions; // 添加这一行
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

上一回合：
${optimizedConversationHistory.length > 0 ? optimizedConversationHistory[optimizedConversationHistory.length - 1].content : '无'}

本回合玩家行动：${action}
注意，玩家的行为可以胡闹，你主要判断可行性，只要有能力做到，就可以做。
请用JSON格式回答，包含以下字段：
- reason: 解释玩家行动是否可行的原因
- suggestion: 如果行动不可行，给出的建议。如果可行，则留空。
- isValid: 玩家行动是否可行的结论（布尔值）
- specificAction: 请具体描述玩家实际做的事情和说得话，避免歧义，同时也尽量保留原话，最重要的是具体化对象。例如，如果玩家说'你好'，可以描述为'向在场的人问好'，或者判断到是向谁问好。如果不可行，可以留空。如果玩家使用了特殊能力或技能，请具体说明使用的是哪个能力，对能力的效果至少要有一句描写。`;

        const response = await this.callLargeLanguageModel(prompt, VALIDATE_ACTION_SCHEMA);
        return response;
    }

    async summarizeActions(mainPlayerAction, aiActions, plotTriggers, turnCount) {
        const SUMMARIZE_ACTIONS_SCHEMA = {
            type: "object",
            properties: {
                triggerChecks: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            triggerCondition: { type: "string" },
                            currentProgress: { type: "string" },
                            isTriggered: { type: "boolean" }
                        },
                        required: ["id", "triggerCondition", "currentProgress", "isTriggered"],
                        additionalProperties: false
                    }
                },
                collision: { type: "string" },
                summary: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            note: { type: "string" },
                            successProbability: {
                                type: "string",
                                enum: ["impossible", "unlikely", "possible", "likely", "certain"],
                                description: "行动成功的可能性"
                            }
                        },
                        required: ["name", "note", "successProbability"],
                        additionalProperties: false
                    }
                },
                endReason: { type: "string" },
                endSectionFlag: { type: "boolean" },
                suggestions: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["triggerChecks", "collision", "summary", "endReason","endSectionFlag",  "suggestions"],
            additionalProperties: false
        };

        const optimizedHistory = optimizedConversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
        
        const prompt = `请考虑以下背景信息和优化后的对话历史：

起始事件：${this.startEvent}
公共信息：${this.commonKnowledge}
主持人信息：${this.GMDetails}
结束条件：
${this.endConditions.map((condition, index) => `${index + 1}. ${condition}`).join('\n')}

优化后的对话历史：
${optimizedHistory}

主角目标：${this.sectionObjective}

现在，请分析这个回合中每个角色的行动：
主角行动：${mainPlayerAction}

其他角色行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action.action}`).join('\n')}

当前回合数：${turnCount}

剧情触发器列表：
${plotTriggers.filter(trigger => !trigger.consumed && !trigger.triggerCondition.startsWith('第')).map(trigger => `- ID: ${trigger.id}, 触发条件: ${trigger.triggerCondition}`).join('\n')}

请按照指定的JSON格式回复，包括以下字段：
- triggerChecks: 一个数组，包含每个剧情触发器的以下信息：
    触发器列表为空的时候留空数组。
  - id: 触发器ID
  - triggerCondition: 触发条件
  - currentProgress: 当前触发进度的简单描述
  - isTriggered: 布尔值，表示该触发器是否在这个回合被触发
- collision: 角色之间行动的冲突，哪个角色做的可能让另一个角色达不到最终的效果
- summary: 一个数组，包含每个角色的名字、行动结果注释和成功可能性。
  - name: 角色名字
  - note: 对该行动的结论性判定，例如"攻击"、"防御"、"行动"等，只简单写行动类型，不写成败。
  - successProbability: 行动成功的可能性，必须是以下五个选项之一："impossible"（不可能）、"unlikely"（不太可能）、"possible"（可能）、"likely"（很可能）、"certain"（必然）
  - endReason: 判断是否满足了桥段结束条件
- endSectionFlag: 布尔值，是否结束桥段
- suggestions: 一个数组，包含1-2个对主角继续推进剧情的建议。这些建议应该考虑当前情况和桥段目标。

请只提供简短的结论性判定，不要重复原始行动描述。`;

        console.log("生成总结提示", prompt);
        const response = await this.callLargeLanguageModel(prompt, SUMMARIZE_ACTIONS_SCHEMA);
        
        // 在本地进行随机数运算，确定每个行动是否成功
        response.summary = response.summary.map(action => {
            let successRate;
            switch (action.successProbability) {
                case "impossible": successRate = 0.05; break;
                case "unlikely": successRate = 0.25; break;
                case "possible": successRate = 0.5; break;
                case "likely": successRate = 0.65; break;
                case "certain": successRate = 0.90; break;
                default: successRate = 0.5;
            }
            return {
                ...action,
                isSuccessful: Math.random() < successRate
            };
        });

        // 处理回合触发的情节
        plotTriggers.forEach(trigger => {
            if (trigger.triggerCondition.startsWith('第') && trigger.triggerCondition.endsWith('回合')) {
                const triggerTurn = parseInt(trigger.triggerCondition.replace(/[^0-9]/g, ''));
                if (turnCount === triggerTurn) {
                    response.triggerChecks.push({
                        id: trigger.id,
                        triggerCondition: trigger.triggerCondition,
                        currentProgress: `当前是第${turnCount}回合`,
                        isTriggered: true
                    });
                }
            }
        });

        // 使用新的UI函数显示建议
        if (response.suggestions && response.suggestions.length > 0) {
            displaySuggestions(response.suggestions);
        }
        
        return response;
    }

    async generateFinalResult(actionSummary, mainPlayerAction, aiActions, triggeredPlots) {
        const optimizedHistory = optimizedConversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
        
        const actionsWithResults = [
            { 
                name: selectedCharacter, 
                action: mainPlayerAction, 
                isSuccessful: actionSummary.summary.find(s => s.name === selectedCharacter)?.isSuccessful
            },
            ...Object.entries(aiActions).map(([name, action]) => {
                const summary = actionSummary.summary.find(s => s.name === name);
                return {
                    name,
                    action: action.action,
                    isSuccessful: summary?.isSuccessful
                };
            })
        ];

        const prompt = `请考虑以下背景信息、优化后的对话历史和触发的剧情触发器：

起始事件：${this.startEvent}
公共信息：${this.commonKnowledge}
主持人信息：${this.GMDetails}

过去回合历史：
${optimizedHistory}

本回合各角色的行动和结果：
${actionsWithResults.map(item => `${item.name}: ${item.action}\n判定: ${item.isSuccessful ? '成功' : '失败或有意外'}`).join('\n\n')}
行动有冲突的情况，你可自行斟酌。

本回合触发的剧情触发器：
${triggeredPlots.map(trigger => trigger.content).join('\n')}

请小说化地描述这个新的回合的结果，包括每个角色说出来的话、做的动作等。请用第三人称方式描写。请确保描述中自然地包含每个角色实际成功或失败的行动，以及触发的剧情触发器。注意你的回复会直接增量展示为小说内容，所以不要写前导后缀提示。也不要写太多内容，不要写重复了。也不要描写主角${selectedCharacter}的心理活动或主观气氛。写三个自然段就行。如果有剧情触发器的话，必须体现在你的描述里，优先级很高。`;

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