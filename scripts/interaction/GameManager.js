class GameManager {
    constructor() {
        this.moderator = new Moderator();
        this.aiPlayers = {};
        this.mainPlayer = null;
        this.currentContext = "";
        this.publicHistory = []; // 所有角色可见的历史
        this.mainPlayerHistory = []; // 主玩家的个人历史
        this.debugMode = isCarrotTest(); // 使用 isCarrotTest() 来设置调试模式
        this.concurrencyLimit = 10; // 设置Agent并发上限
        this.semaphore = new Semaphore(this.concurrencyLimit);
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

        const context = {
            startEvent: currentSection.startEvent,
            commonKnowledge:currentSection.commonKnowledge,
            GMDetails: currentSection.GMDetails
        };

        const validationResult = await this.moderator.validateAction(action, context);
        this.log("操作验证结果:", validationResult);
        
        if (!validationResult.isValid) {
            const feedback = `操作不可行。原因：${validationResult.reason}\n建议：${validationResult.suggestion}`;
            this.mainPlayerHistory.push({ role: "system", content: feedback });
            this.log("操作不可行，返回反馈:", feedback);
            return feedback;
        }

        // 使用具体化过的行为描述
        const specificAction = validationResult.specificAction;
        this.log("玩家的行为:", specificAction);

        // 使用具体的行为描述来获取AI玩家响应
        const aiResponses = await this.getAIPlayersResponses(specificAction);
        this.log("AI玩家响应:", aiResponses);

        // 新增：生成行动总结
        const actionSummary = await this.moderator.summarizeActions(specificAction, aiResponses);
        this.log("行动总结:", actionSummary);

        this.log("生成最终结果");
        const finalResult = await this.moderator.generateFinalResult(actionSummary);
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

        // 更新AI玩家的记忆（只使用最终结果）
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
        const responsePromises = Object.entries(this.aiPlayers).map(async ([name, aiPlayer]) => {
            await this.semaphore.acquire(); // 获取信号量
            try {
                this.log(`获取 ${name} 的响应`, { action });
                const response = await aiPlayer.getResponse(action);
                return [name, response];
            } finally {
                this.semaphore.release(); // 释放信号量
            }
        });

        const responses = await Promise.all(responsePromises);
        return Object.fromEntries(responses);
    }
}

// 添加一个简单的信号量类
class Semaphore {
    constructor(max) {
        this.max = max;
        this.count = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.count < this.max) {
            this.count++;
            return Promise.resolve();
        }

        return new Promise(resolve => this.queue.push(resolve));
    }

    release() {
        this.count--;
        if (this.queue.length > 0) {
            this.count++;
            const next = this.queue.shift();
            next();
        }
    }
}

const gameManager = new GameManager();