class GameManager {
    constructor() {
        this.moderator = null;
        this.aiPlayers = {};
        this.mainPlayer = null;
        this.currentContext = "";
        this.debugMode = isCarrotTest();
        this.concurrencyLimit = 10;
        this.semaphore = new Semaphore(this.concurrencyLimit);
        this.characterTagBase = null;
        this.playerInfo = null;
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`, data);
        }
    }

    async loadCharacterTagBase() {
        try {
            const response = await fetch('data/characterTagBase.json?v=' + new Date().getTime());
            this.characterTagBase = await response.json();
            console.log('加载角色标签库:', this.characterTagBase);
        } catch (error) {
            console.error('加载角色标签库时出错:', error);
            throw error;
        }
    }

    async initializeGame(section) {
        if (!this.characterTagBase) {
            await this.loadCharacterTagBase();
        }

        this.aiPlayers = {};
        section.characters.forEach(character => {
            if (character.isAI) {
                this.aiPlayers[character.name] = new AIPlayer(
                    character, 
                    section.commonKnowledge, 
                    section.startEvent,
                    character.sectionGuidance,
                    this.characterTagBase
                );
            } else {
                this.mainPlayer = character;
            }
        });
        this.currentContext = section.backgroundInfo;
        if (!this.mainPlayer.isAI) {
            this.playerInfo = this.createPlayerInfo(this.mainPlayer);
        }
        this.moderator = new Moderator(
            section.startEvent,
            section.commonKnowledge,
            section.GMDetails,
            this.playerInfo
        );
    }

    createPlayerInfo(playerCharacter) {
        let info = `角色：${playerCharacter.name}\n`;
        info += `描述：${playerCharacter.description}\n`;
        playerCharacter.characterTags.forEach(tagKey => {
            const tagValue = this.getCharacterTag(tagKey);
            if (tagValue) {
                info += `- ${tagKey}: ${tagValue}\n`;
            }
        });
        return info;
    }

    async processMainPlayerAction(action, updateOptimizedHistoryCallback) {
        this.log("主玩家操作:", action);

        const validationResult = await this.moderator.validateAction(action);
        this.log("操作验证结果:", validationResult);
        
        if (!validationResult.isValid) {
            const feedback = `操作不可行。原因：${validationResult.reason}\n建议：${validationResult.suggestion}`;
            this.log("操作不可行，返回反馈:", feedback);
            return feedback;
        }

        const specificAction = validationResult.specificAction;
        this.log("玩家的行为:", specificAction);

        updateOptimizedHistoryCallback(specificAction);

        const aiResponses = await this.getAIPlayersResponses(specificAction);
        this.log("AI玩家响应:", aiResponses);

        const actionSummary = await this.moderator.summarizeActions(specificAction, aiResponses);
        this.log("行动总结:", actionSummary);

        this.log("生成最终结果");
        const finalResult = await this.moderator.generateFinalResult(actionSummary);
        this.log("最终结果:", finalResult);

        this.updateContext(finalResult);

        if (actionSummary.endSectionFlag) {
            this.moderator.endSectionFlag = true;
        }

        return finalResult;
    }

    updateContext(finalResult) {
        this.currentContext += `\n${finalResult.display}`;
    }

    async getAIPlayersResponses(action) {
        const responsePromises = Object.entries(this.aiPlayers).map(async ([name, aiPlayer]) => {
            await this.semaphore.acquire();
            try {
                this.log(`获取 ${name} 的响应`, { action });
                const response = await aiPlayer.getResponse(action);
                return [name, response];
            } finally {
                this.semaphore.release();
            }
        });

        const responses = await Promise.all(responsePromises);
        return Object.fromEntries(responses);
    }

    getCharacterTag(key) {
        return this.characterTagBase ? this.characterTagBase[key] : null;
    }
}

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