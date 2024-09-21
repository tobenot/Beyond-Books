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

请根据以上信息，对当前情况做出反应。用json格式回复：
{
  "checkCanAct": "你能否思考或说话，比如说遇到时间类型的能力，比如你不在场。",
  "canAct": "布尔值，上一条的结论",
  "thoughts": "作为${this.name}，你的私人想法，无法思考时，返回空字符串",
  "action": "你的行动和说的话，无法行动时，返回空字符串"
}`;
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
                response_format: { type: "json_object" }, 
                max_tokens: 1000 
            }),
            credentials: 'include'
        });
        const responseData = await handleApiResponse(response);
        const parsedResponse = JSON.parse(responseData.choices[0].message.content);
        this.log("能否行动", String(parsedResponse.checkCanAct));
        this.log("布尔：", String(parsedResponse.canAct));
        if (parsedResponse.canAct === false || parsedResponse.canAct === "false") {

            parsedResponse.action = "不能做出任何行动";
            parsedResponse.thoughts = "无法思考";
        }
        delete parsedResponse.canAct;
        delete parsedResponse.checkCanAct;
        
        this.updateMemory(action, parsedResponse);
        delete parsedResponse.thoughts;
        this.log(`AI 响应`, parsedResponse);
        return parsedResponse;
    }
}