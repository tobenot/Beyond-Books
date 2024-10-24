// 重构时需要参考的文件:
// - scripts/interaction/Moderator.js

// 主持人类
import { getModel, ModelType } from '@/store/modules/settings'
import { handleApiResponse } from '@/utils/apiHandler'
import StreamHandler from '@/utils/streamHandler'
import store from '@/store' // 引入 Vuex store
import mitt from 'mitt' // 引入 mitt

export default class Moderator {
  constructor(startEvent, commonKnowledge, GMDetails, playerInfo, sectionObjective, endConditions) {
    this.startEvent = startEvent;
    this.commonKnowledge = commonKnowledge;
    this.GMDetails = GMDetails;
    this.playerInfo = playerInfo;
    this.sectionObjective = sectionObjective;
    this.endConditions = endConditions;
    this.streamHandler = new StreamHandler();
    this.endSectionFlag = false;
    this.store = store; // 直接使用导入的 store
    this.eventBus = mitt(); // 使用 mitt 创建事件总线
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
${this.getLastRound()}

本回合玩家行动：${action}
注意，玩家的行为可以胡闹，你主要判断可行性，只要有能力做到，就可以做。
请用JSON格式回答，包含以下字段：
- reason: 解释玩家行动是否可行的原因
- suggestion: 果行动不可行，给出的建议。如果可行，则留空。
- isValid: 玩家行动是否可行的结论（布尔值）
- specificAction: 请具体描述玩家实际做的事情和说得话，避免歧义，同时也尽量保留原话，最重要的是具体化对象。例如，如果玩家说'你好'，可以描述为'向在场的人问好'，或者判断到是向谁问好。如果不可行，可以留空。如果玩家使用了特殊能力或技能，请具体说明使用的是哪个能力，对能力的效果至少要有一句描写。注意，使用能力必须要是玩家主动发动，因为会消耗灵力的，如果玩家没有明说，就不要发动能力。`;

    return await this.callLargeLanguageModel(prompt, VALIDATE_ACTION_SCHEMA);
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
        endReasons: {
          type: "array",
          items: {
            type: "object",
            properties: {
              condition: { type: "string" },
              isMet: { type: "boolean" }
            },
            required: ["condition", "isMet"],
            additionalProperties: false
          }
        },
        endSectionFlag: { type: "boolean" },
        suggestions: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["triggerChecks", "endReasons", "endSectionFlag", "collision", "summary", "suggestions"],
      additionalProperties: false
    };

    const optimizedHistory = this.getOptimizedHistory();
    
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
${plotTriggers.filter(trigger => !trigger.consumed && !trigger.triggerCondition.startsWith('第')).map(trigger => 
  `- ID: ${trigger.id}, 触发条件: ${trigger.triggerCondition}`).join('\n')}

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
  - successProbability: 行动成功的可能性，必须是以下五个选项之一："impossible"（不可能）、"unlikely"（不太可能）、"possible"（可能）、"likely"（很可能）、"certain"（必然）。如果异能用对了方式，那就是certain。
- endReasons: 一个数组,包含每个结束条件及其是否满足的布尔值:
  - condition: 结束条件
  - isMet: 布尔值,表示该条件是否满足
- endSectionFlag: 布尔值,是否结束该桥段
- suggestions: 一个数组，包含1-2个对主角继续推进剧情的建议。这些建议应该考虑当前情况和桥段目标。`;

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
    
    // 强制设置endSectionFlag
    response.endSectionFlag = response.endReasons.some(reason => reason.isMet);
    this.endSectionFlag = response.endSectionFlag;
    
    return response;
  }

  async generateFinalResult(actionSummary, mainPlayerAction, aiActions, triggeredPlots) {
    const optimizedHistory = this.getOptimizedHistory();
    
    const actionsWithResults = [
      { 
        name: this.getSelectedCharacter(), 
        action: mainPlayerAction, 
        isSuccessful: actionSummary.summary.find(s => s.name === this.getSelectedCharacter())?.isSuccessful
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

请小说化地描述这个新的回合的结果，包括每个角色说出来的话、做的动作等。请用第三人称方式描写。请确保描述中自然地包含每个角色实际成功或失败的行���，以及触发的剧情触发器。注意你的回复会直接增量展示为小说内容，所以不要写前导后缀提示。也不要写太多内容，不要写重复了。也不要描写主角${this.getSelectedCharacter()}的心理活动或主观气氛。写三个自然段就行。如果有剧情触发器的话，必须体现在你的描述里，优先级很高。`;

    return await this.callLargeLanguageModelStream(prompt);
  }

  // 辅助方法
  getOptimizedHistory() {
    const history = this.store.state.interaction.optimizedConversationHistory;
    if (!history || !Array.isArray(history)) {
      return ''; // 如果历史记录未定义或不是数组，返回空字符串
    }
    return history.map(entry => `${entry.role}: ${entry.content}`).join('\n') || '';
  }

  getSelectedCharacter() {
    return this.store.state.game.selectedCharacter || ''
  }

  // API调用方法
  async callLargeLanguageModel(prompt, schema) {
    const response = await fetch(store.state.settings.apiUrl + 'chat/completions', { // 使用 Vuex 状态中的 apiUrl
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.state.settings.apiKey}`, // 使用 Vuex 状态中的 apiKey
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        model: getModel(ModelType.BASIC),
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
      })
    });

    const responseData = await handleApiResponse(response);
    return JSON.parse(responseData.choices[0].message.content);
  }

  async callLargeLanguageModelStream(prompt) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.state.settings.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        model: getModel(ModelType.BASIC),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        stream: true
      })
    };

    let finalResult = '';
    await this.streamHandler.fetchStream(store.state.settings.apiUrl + 'chat/completions', options, (partialResponse) => {
      finalResult = partialResponse;
      // 使用事件总线触发事件
      this.eventBus.emit('streamUpdate', partialResponse); // 使用 emit 而不是 $emit
    });

    return finalResult;
  }

  getLastRound() {
    // 这个方法需要从Vuex store中获取最后一轮的对话历史
    // 在实际实现中,你需要通过Vuex getter来获取这个信息
    return ''; // 暂时返回空字符串,后续需要实现
  }
}
