// 重构时需要参考的文件:
// - scripts/interaction/Moderator.js

// 主持人类
import { getModel, ModelType } from '@/store/modules/settings'
import { handleApiResponse } from '@/utils/apiHandler'
import StreamHandler from '@/utils/streamHandler'

export default class Moderator {
  constructor(startEvent, commonKnowledge, GMDetails, playerInfo, sectionObjective, endConditions) {
    this.startEvent = startEvent;
    this.commonKnowledge = commonKnowledge;
    this.GMDetails = GMDetails;
    this.playerInfo = playerInfo;
    this.sectionObjective = sectionObjective;
    this.endConditions = endConditions;
    this.streamHandler = new StreamHandler()
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
- suggestion: 如果行动不可行，给出的建议。如果可行，则留空。
- isValid: 玩家行动是否可行的结论（布尔值）
- specificAction: 请具体描述玩家实际做的事情和说得话，避免歧义，同时也尽量保留原话，最重要的是具体化对象。例如，如果玩家说'你好'，可以描述为'向在场的人问好'，或者判断到是向谁问好。如果不可行，可以留空。如果玩家使用了特殊能力或技能，请具体说明使用的是哪个能力，对能力的效果至少要有一句描写。注意，使用能力必须要是玩家主动发动，因为会消耗灵力的，如果玩家没有明说，就不要发动能力。`;

    return await this.callLargeLanguageModel(prompt, VALIDATE_ACTION_SCHEMA);
  }

  async summarizeActions(mainPlayerAction, aiActions, plotTriggers, turnCount) {
    // ... (保持原有的summarizeActions方法不变)
  }

  async generateFinalResult(actionSummary, mainPlayerAction, aiActions, triggeredPlots) {
    // ... 生成prompt的代码

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VUE_APP_API_KEY}`,
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
    await this.streamHandler.fetchStream(process.env.VUE_APP_API_URL, options, (partialResponse) => {
      finalResult = partialResponse;
      // 这里可以触发一个事件或调用回调函数来更新UI
    });

    return finalResult;
  }

  async callLargeLanguageModel(prompt, schema) {
    const response = await fetch(process.env.VUE_APP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VUE_APP_API_KEY}`,
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
        'Authorization': `Bearer ${process.env.VUE_APP_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        model: getModel(ModelType.BASIC),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        stream: true
      }),
      credentials: 'include'
    };

    return await this.streamHandler.fetchStream(process.env.VUE_APP_API_URL, options);
  }

  getLastRound() {
    // 这个方法需要从Vuex store中获取最后一轮的对话历史
    // 在实际实现中,你需要通过Vuex getter来获取这个信息
    return ''; // 暂时返回空字符串,后续需要实现
  }
}
