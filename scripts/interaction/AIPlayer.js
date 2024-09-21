class AIPlayer {
    constructor(character, commonKnowledge) {
        this.name = character.name;
        this.role = character.role;
        this.description = character.description;
        this.personality = character.personality;
        this.goals = character.goals;
        this.memory = [];
        this.debugMode = isCarrotTest();
        this.commonKnowledge = commonKnowledge;
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG AI ${this.name}] ${message}`, data);
        }
    }

    createPrompt(situation) {
        const recentMemory = this.memory.slice(-5).map(m => `${m.situation}\n${m.response}`).join('\n');
        const prompt = `你是${this.name}，${this.role}。${this.description}
性格：${this.personality}
目标：${this.goals.join(', ')}
公共信息：${this.commonKnowledge}

最近的记忆：
${recentMemory}

当前情况：
${situation}

请根据你的角色、性格、目标、公共信息和记忆，对当前情况做出反应。用json格式回复：
{
  "thoughts": "你的内心想法",
  "action": "你的行动或对话"
}`;
        this.log("创建提示", { prompt });
        
        return prompt;
    }

    updateMemory(situation, response) {
        this.memory.push({ situation, response });
        if (this.memory.length > 5) {
            this.memory.shift(); // 保持最近的5条记忆
        }
        this.log("更新记忆", { situation, response, currentMemory: this.memory });
    }
}