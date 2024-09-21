class AIPlayer {
    constructor(character, commonKnowledge, startEvent, sectionGuidance, globalCharacterTagBase) {
        this.name = character.name;
        this.description = character.description;
        this.personality = character.personality;
        this.goals = character.goals;
        this.sectionGuidance = sectionGuidance;
        this.memory = [];
        this.debugMode = isCarrotTest();
        this.commonKnowledge = commonKnowledge;
        this.startEvent = startEvent;
        this.privateMemory = [];
        this.maxPrivateMemoryLength = 5;
        this.characterTags = this.loadCharacterTag(character.characterTags, globalCharacterTagBase);
    }

    loadCharacterTag(tagKeys, globalCharacterTagBase) {
        return tagKeys.reduce((acc, key) => {
            if (globalCharacterTagBase[key]) {
                acc[key] = globalCharacterTagBase[key];
            } else {
                console.warn(`标签键未找到: ${key}`);
            }
            return acc;
        }, {});
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG AI ${this.name}] ${message}`, data);
        }
    }

    createPrompt(situation) {
        const recentPublicMemory = optimizedConversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
        const recentPrivateMemory = this.privateMemory.map(m => `想法: ${m}`).join('\n');
        
        const characterTagText = Object.entries(this.characterTags)
            .map(([key, value]) => `${key}：${value}`)
            .join('\n');

        const prompt = `你是${this.name}。${this.description}。
性格：${this.personality}
${characterTagText}
目标：${this.goals.join(', ')}
公共信息：${this.commonKnowledge}
开始事件：${this.startEvent}
桥段指导：${this.sectionGuidance}

最近的公共记忆：
${recentPublicMemory}

你最近的私人想法：
${recentPrivateMemory}

当前情况：
${situation}
再次强调你的角色是${this.name}。
请根据以上信息，对当前情况做出反应。用json格式回复。`;
        this.log("创建提示", { prompt });
        
        return prompt;
    }

    updateMemory(situation, response) {
        if (response.canAct === true || response.canAct === "true") {
            // 更新私有记忆
            this.privateMemory.push(response.thoughts);
            if (this.privateMemory.length > this.maxPrivateMemoryLength) {
                this.privateMemory.shift(); // 保持最近的5条私有记忆
            }
            this.log("更新私有记忆", { situation, response, currentPrivateMemory: this.privateMemory });
        }
    }

    async getResponse(action) {
        const AI_RESPONSE_SCHEMA = {
            type: "object",
            properties: {
                checkCanAct: {
                    type: "string",
                    description: "解释你能否思考或说话的原因。比如说遇到时间类型的能力，比如你不在现场。"
                },
                canAct: {
                    type: "boolean",
                    description: "是否能够行动的布尔值"
                },
                thoughts: {
                    type: "string",
                    description: "作为角色的私人想法，无法思考时返回空字符串"
                },
                action: {
                    type: "string",
                    description: "角色的行动和说的话，无法行动时返回空字符串"
                }
            },
            required: ["checkCanAct", "canAct", "thoughts", "action"],
            additionalProperties: false
        };

        const prompt = this.createPrompt(action);
        const aiConversationHistory = [
            { role: "system", content: prompt },
            { role: "user", content: action }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                model: getModel(), // 使用基本模型
                messages: aiConversationHistory, 
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "ai_player_response",
                        schema: AI_RESPONSE_SCHEMA,
                        strict: true
                    }
                },
                max_tokens: 1000 
            }),
            credentials: 'include'
        });

        const responseData = await handleApiResponse(response);
        const parsedResponse = JSON.parse(responseData.choices[0].message.content);

        this.log("能否行动", parsedResponse.checkCanAct);
        this.log("布尔：", String(parsedResponse.canAct));

        if (parsedResponse.canAct === false) {
            parsedResponse.action = "不能做出任何行动";
            parsedResponse.thoughts = "无法思考";
        }

        this.updateMemory(action, parsedResponse);
        
        const finalResponse = {
            action: parsedResponse.action
        };

        this.log(`AI 响应`, finalResponse);
        return finalResponse;
    }
}