// 重构时需要参考的文件:
// - scripts/interaction/GameManager.js

// 游戏管理器
import AIPlayer from './aiPlayer'
import StreamHandler from './streamHandler'
import { getBasePath } from './pathManager'

export default class GameManager {
  constructor(gameState, sectionData) {
    this.gameState = gameState
    this.aiPlayers = {}
    this.streamHandler = new StreamHandler()
    this.characterTagBase = null
    this.playerInfo = null
    this.turnCount = 0
    this.plotTriggers = []
    this.sectionData = sectionData
  }

  async loadCharacterTagBase() {
    try {
      const basePath = getBasePath()
      const response = await fetch(`${basePath}/config/characterTagBase.json?v=${new Date().getTime()}`)
      this.characterTagBase = await response.json()
    } catch (error) {
      console.error('加载角色标签库时出错:', error)
      throw error
    }
  }

  async setupGame() {
    if (!this.characterTagBase) {
      await this.loadCharacterTagBase()
    }

    const section = this.sectionData
    if (!section) {
      throw new Error('无法获取章节数据')
    }

    this.aiPlayers = {}
    section.characters.forEach(character => {
      if (character.isAI) {
        this.aiPlayers[character.name] = new AIPlayer(
          character, 
          section.commonKnowledge, 
          section.startEvent,
          character.sectionGuidance,
          this.characterTagBase
        )
      } else {
        this.mainPlayer = character
      }
    })

    this.initializePlotTriggers(section.plotTriggers)

    this.currentContext = section.backgroundInfo
    if (!this.mainPlayer.isAI) {
      this.playerInfo = this.createPlayerInfo(this.mainPlayer)
    }
  }

  initializePlotTriggers(triggers) {
    this.plotTriggers = triggers.map(trigger => ({
      ...trigger,
      consumed: false,
      memoryCharacter: trigger.memoryCharacter || null
    }))
  }

  createPlayerInfo(playerCharacter) {
    let info = `角色：${playerCharacter.name}\n`
    info += `描述：${playerCharacter.description}\n`
    playerCharacter.characterTags.forEach(tagKey => {
      const tagValue = this.getCharacterTag(tagKey)
      if (tagValue) {
        info += `- ${tagKey}: ${tagValue}\n`
      }
    })
    return info
  }

  async processMainPlayerAction(action, moderator) {
    this.turnCount++

    // 确保 moderator 是一个有效的对象
    if (!moderator) {
      throw new Error('Moderator 未定义');
    }

    const validationResult = await moderator.validateAction(action)
    if (!validationResult.isValid) {
      return { 
        content: validationResult.reason, 
        isValid: false,
        suggestions: validationResult.suggestion ? [validationResult.suggestion] : []
      }
    }

    const specificAction = validationResult.specificAction
    const aiResponses = await this.getAIPlayersResponses(specificAction)
    const actionSummary = await moderator.summarizeActions(specificAction, aiResponses, this.plotTriggers, this.turnCount)

    const triggeredPlots = this.updateTriggeredPlots(actionSummary.triggerChecks)
    const finalResult = await moderator.generateFinalResult(actionSummary, specificAction, aiResponses, triggeredPlots)

    this.updateContext(finalResult)

    return { 
      content: finalResult,
      isValid: true,
      suggestions: actionSummary.suggestions,
      endSectionFlag: actionSummary.endSectionFlag
    }
  }

  updateContext(finalResult) {
    this.currentContext += `\n${finalResult}`
  }
  
  async getAIPlayersResponses(action) {
    const responsePromises = Object.entries(this.aiPlayers).map(async ([name, aiPlayer]) => {
      const response = await aiPlayer.getResponse(action)
      return [name, response]
    })

    const responses = await Promise.all(responsePromises)
    return Object.fromEntries(responses)
  }

  getCharacterTag(key) {
    return this.characterTagBase ? this.characterTagBase[key] : null
  }

  updateTriggeredPlots(triggerChecks) {
    const triggeredPlots = []
    triggerChecks.forEach(check => {
      const trigger = this.plotTriggers.find(t => t.id === check.id)
      if (trigger && check.isTriggered && !trigger.consumed) {
        trigger.consumed = true
        triggeredPlots.push(trigger)
        
        if (trigger.memoryCharacter && this.aiPlayers[trigger.memoryCharacter]) {
          this.aiPlayers[trigger.memoryCharacter].addPrivateThought(trigger.content)
        }
      }
    })
    return triggeredPlots
  }
}
