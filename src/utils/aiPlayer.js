// 重构时需要参考的文件:
// - scripts/interaction/AIPlayer.js

// AI玩家类
import { getModel, ModelType } from '@/store/modules/settings'
import { handleApiResponse } from '@/utils/apiHandler'

export default class AIPlayer {
  constructor(character, commonKnowledge, startEvent, sectionGuidance, globalCharacterTagBase) {
    this.name = character.name;
    this.description = character.description;
    this.personality = character.personality;
    this.goals = character.goals;
    this.sectionGuidance = sectionGuidance;
    this.memory = [];
    this.debugMode = process.env.NODE_ENV === 'development';
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
    const recentPublicMemory = this.memory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
    const recentPrivateMemory = this.privateMemory.map(m => `想法: ${m}`).join('\n');
    
    const characterTagText = Object.entries(this.characterTags)
      .map(([key, value]) => `${key}：${value}`)
      .join('\n');

    return `你是${this.name}。${this.description}。
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

请用JSON格式回复，包括以下字段：
1. activeAbilities：明确当前有什么异能正在发动过程中。
2. checkCanAct：解释并判断你能否行动。比如说有人发动时间减速异能时，你不能行动。注意这是'能否行动'，而不是'要不要行动'。
3. canAct：布尔值，表示是否能够行动。
4. thoughts：数组，包含你的思考过程。每个思考步骤应包含思考阶段和内容。思考过程：
   a. 分析当前情况：仔细考虑当前的环境、其他角色的行动和可能的影响。
   b. 回顾个人目标：思考你的角色目标，以及当前情况如何影响这些目标。
   c. 考虑可能的行动：列出几个可能的行动方案，包括可能推动剧情发展的行动。
   d. 哪个行动最快：判断并选择一个能尽快结束剧情的行动，避免进入对峙。哪怕是满足敌人的目标也行。
5. action：你的最终行动和说的话。`;
  }

  updateMemory(situation, response) {
    const summarizedThoughts = response.thoughts
      .filter((t, index) => index === 1 || index === 3)
      .map(t => `${t.step}: ${t.content}`)
      .join('; ');

    this.privateMemory.push(summarizedThoughts);
    if (this.privateMemory.length > this.maxPrivateMemoryLength) {
      this.privateMemory.shift();
    }

    this.log("更新私有记忆", { situation, response, currentPrivateMemory: this.privateMemory });
  }

  addPrivateThought(thought) {
    this.privateMemory.push(thought);
    if (this.privateMemory.length > this.maxPrivateMemoryLength) {
      this.privateMemory.shift();
    }
    this.log("添加私人想法", { thought, currentPrivateMemory: this.privateMemory });
  }

  async getResponse(action) {
    const AI_RESPONSE_SCHEMA = {
      type: "object",
      properties: {
        activeAbilities: { type: "string" },
        checkCanAct: { type: "string" },
        canAct: { type: "boolean" },
        thoughts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "string" },
              content: { type: "string" }
            },
            required: ["step", "content"],
            additionalProperties: false
          }
        },
        action: { type: "string" }
      },
      required: ["activeAbilities", "checkCanAct", "canAct", "thoughts", "action"],
      additionalProperties: false
    };

    const prompt = this.createPrompt(action);
    const aiConversationHistory = [
      { role: "system", content: prompt },
      { role: "user", content: action }
    ];

    try {
      const response = await fetch(process.env.VITE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          model: getModel(ModelType.BASIC),
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

      this.log(`AI 反应`, parsedResponse);

      if (parsedResponse.canAct === false) {
        parsedResponse.action = parsedResponse.checkCanAct;
        parsedResponse.thoughts = [{ step: "无法思考", content: "来不及思考" }];
      }

      this.updateMemory(action, parsedResponse);
      
      const finalResponse = {
        action: parsedResponse.action
      };

      this.log(`AI 提交动作`, finalResponse);
      return finalResponse;
    } catch (error) {
      console.error('Error in AI response:', error);
      throw error;
    }
  }
}
