class AIPlayer {
    constructor(character, commonKnowledge, startEvent, sectionGuidance) {
        this.name = character.name;
        this.role = character.role;
        this.description = character.description;
        this.personality = character.personality;
        this.goals = character.goals;
        this.sectionGuidance = sectionGuidance;
        this.memory = [];
        this.debugMode = isCarrotTest();
        this.commonKnowledge = commonKnowledge;
        this.startEvent = startEvent;
        this.privateMemory = []; // AI自己的想法
        this.maxPrivateMemoryLength = 5; // 保留最近5条私有记忆
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG AI ${this.name}] ${message}`, data);
        }
    }

    createPrompt(situation) {
        const recentPublicMemory = optimizedConversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
        const recentPrivateMemory = this.privateMemory.map(m => `想法: ${m}`).join('\n');
        
        const prompt = `你是${this.name}，${this.role}。${this.description}
性格：${this.personality}
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
  "thoughts": "你的私人想法",
  "action": "你的行动和说的话"
}`;
        this.log("创建提示", { prompt });
        
        return prompt;
    }

    updateMemory(situation, response) {
        // 更新私有记忆
        this.privateMemory.push(response.thoughts);
        if (this.privateMemory.length > this.maxPrivateMemoryLength) {
            this.privateMemory.shift(); // 保持最近的5条私有记忆
        }
        this.log("更新私有记忆", { situation, response, currentPrivateMemory: this.privateMemory });
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
                model: MODEL, 
                messages: aiConversationHistory, 
                response_format: { type: "json_object" }, 
                max_tokens: 500 
            }),
            credentials: 'include'
        });

        const responseData = await handleApiResponse(response);
        const parsedResponse = JSON.parse(responseData.choices[0].message.content);
        
        this.updateMemory(action, parsedResponse);
        this.log(`AI 响应`, parsedResponse);
        return parsedResponse;
    }
}