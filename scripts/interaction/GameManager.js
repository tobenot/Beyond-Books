class GameManager {
    constructor() {
        this.moderator = new Moderator();
        this.aiPlayers = {};
        this.mainPlayer = null;
        this.currentContext = "";
        this.publicHistory = []; // 所有角色可见的历史
        this.mainPlayerHistory = []; // 主玩家的个人历史
        this.debugMode = isCarrotTest(); // 使用 isCarrotTest() 来设置调试模式
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`, data);
        }
    }

    initializeGame(section) {
        this.aiPlayers = {};
        section.characters.forEach(character => {
            if (character.isAI) {
                this.aiPlayers[character.name] = new AIPlayer(character, section.commonKnowledge);
            } else {
                this.mainPlayer = character;
            }
        });
        this.currentContext = section.backgroundInfo;
    }

    async processMainPlayerAction(action) {
        this.log("主玩家操作:", action);

        const validationResult = await this.moderator.validateAction(action, this.currentContext);
        this.log("操作验证结果:", validationResult);
        
        if (!validationResult.isValid) {
            const feedback = `操作不可行。原因：${validationResult.reason}\n建议：${validationResult.suggestion}`;
            this.mainPlayerHistory.push({ role: "system", content: feedback });
            this.log("操作不可行，返回反馈:", feedback);
            return feedback;
        }

        this.log("开始获取AI玩家响应");
        const aiResponses = await this.getAIPlayersResponses(action);
        this.log("AI玩家响应:", aiResponses);

        this.log("生成最终结果");
        const finalResult = await this.moderator.generateFinalResult(action, aiResponses);
        this.log("最终结果:", finalResult);

        this.updateContext(finalResult);
        this.updateHistories(action, finalResult);

        // 检查是否需要结束桥段
        if (finalResult.endSectionFlag) {
            this.moderator.endSectionFlag = true;
        }

        return finalResult.display;
    }

    updateContext(finalResult) {
        this.currentContext += `\n${finalResult.display}`;
    }

    updateHistories(action, finalResult) {
        // 更新公共历史
        this.publicHistory.push({ role: "system", content: finalResult.display });
        
        // 更新主玩家历史
        this.mainPlayerHistory.push({ role: "user", content: action });
        this.mainPlayerHistory.push({ role: "system", content: finalResult.display });

        // 更新AI玩家的记忆
        for (const aiPlayer of Object.values(this.aiPlayers)) {
            aiPlayer.updateMemory(action, finalResult.display);
        }
    }

    getVisibleHistoryForAI(aiPlayer) {
        const visibleHistory = [...this.publicHistory, ...aiPlayer.memory];
        this.log(`获取 ${aiPlayer.name} 可见历史`, visibleHistory);
        return visibleHistory;
    }

    getMainPlayerHistory() {
        this.log("获取主玩家历史", this.mainPlayerHistory);
        return this.mainPlayerHistory;
    }

    async getAIPlayersResponses(action) {
        const responses = {};
        for (const [name, aiPlayer] of Object.entries(this.aiPlayers)) {
            this.log(`获取 ${name} 的响应`, { action });
            const prompt = aiPlayer.createPrompt(action);
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
                    max_tokens: 300 
                }),
                credentials: 'include'
            });

            const responseData = await handleApiResponse(response);
            const parsedResponse = JSON.parse(responseData.choices[0].message.content);
            
            aiPlayer.updateMemory(action, parsedResponse);
            responses[name] = parsedResponse;
            this.log(`${name} 的响应`, parsedResponse);
        }
        return responses;
    }
}

const gameManager = new GameManager();