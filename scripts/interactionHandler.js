let isSubmitting = false;
let isCooldown = false;
let conversationHistory = [];
let selectedCharacter = '罗伯特';
let currentSection = null;
let currentIsReplay = false;
let optimizedConversationHistory = [];

const COOLDOWN_TIME = 1000; // 冷却时间，单位为毫秒

let API_URL;
let API_KEY;
let MODEL;

// 主持人类
class Moderator {
  async validateAction(action, context) {
    const prompt = `
作为游戏主持人，请评估以下玩家行动的可行性：

玩家行动：${action}

当前情境：${context}

请回答以下问题：
1. 这个行动是否可行？（是/否）
2. 为什么？（简要解释）
3. 如果不可行，有什么建议？

请用JSON格式回答：
{
  "isValid": boolean,
  "reason": "解释",
  "suggestion": "如果不可行，给出建议"
}
`;

    const response = await this.callLargeLanguageModel(prompt);
    return JSON.parse(response);
  }

  async generateFinalResult(mainPlayerAction, aiActions) {
    const prompt = `
作为游戏主持人，请根据以下信息生成最终结果：

主玩家行动：${mainPlayerAction}

AI玩家行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action}`).join('\n')}

请生成一个综合的结果描述，包括：
1. 所有行动的结果
2. 环境的变化
3. 其他角色的反应

请用JSON格式回答：
{
  "result": "详细的结果描述",
  "environmentChanges": "环境变化的描述",
  "npcReactions": "其他角色的反应"
}
`;

    const response = await this.callLargeLanguageModel(prompt);
    return JSON.parse(response);
  }

  async callLargeLanguageModel(prompt) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        model: MODEL, 
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000
      }),
      credentials: 'include'
    });

    const responseData = await handleApiResponse(response);
    return responseData.choices[0].message.content;
  }
}

// AI玩家类
class AIPlayer {
  constructor(character) {
    this.name = character.name;
    this.role = character.role;
    this.description = character.description;
    this.personality = character.personality;
    this.goals = character.goals;
    this.memory = [];
  }

  createPrompt(situation) {
    const recentMemory = this.memory.slice(-5).map(m => `${m.situation}\n${m.response}`).join('\n');
    return `你是${this.name}，${this.role}。${this.description}
性格：${this.personality}
目标：${this.goals.join(', ')}

最近的记忆：
${recentMemory}

当前情况：
${situation}

请根据你的角色、性格、目标和记忆，对当前情况做出反应。回复格式：
{
  "thoughts": "你的内心想法",
  "action": "你的行动或对话"
}`;
  }

  updateMemory(situation, response) {
    this.memory.push({ situation, response });
    if (this.memory.length > 5) {
      this.memory.shift(); // 保持最近的5条记忆
    }
  }
}

// 游戏管理器类
class GameManager {
  constructor() {
    this.moderator = new Moderator();
    this.aiPlayers = {};
    this.mainPlayer = null;
    this.currentContext = "";
    this.publicHistory = []; // 所有角色可见的历史
    this.mainPlayerHistory = []; // 主玩家的个人历史
  }

  initializeGame(section) {
    this.aiPlayers = {};
    section.characters.forEach(character => {
      if (character.isAI) {
        this.aiPlayers[character.name] = new AIPlayer(character);
      } else {
        this.mainPlayer = character;
      }
    });
    this.currentContext = section.backgroundInfo;
  }

  async processMainPlayerAction(action) {
    const validationResult = await this.moderator.validateAction(action, this.currentContext);
    
    if (!validationResult.isValid) {
      const feedback = `操作不可行。原因：${validationResult.reason}\n建议：${validationResult.suggestion}`;
      this.mainPlayerHistory.push({ role: "system", content: feedback });
      return feedback;
    }

    const aiResponses = await this.getAIPlayersResponses(action);
    const finalResult = await this.moderator.generateFinalResult(action, aiResponses);

    this.updateContext(finalResult);
    this.updateHistories(action, finalResult);

    return finalResult.result;
  }

  updateContext(finalResult) {
    this.currentContext += `\n${finalResult.result}\n${finalResult.environmentChanges}`;
  }

  updateHistories(action, finalResult) {
    // 更新公共历史
    this.publicHistory.push({ role: "system", content: finalResult.result });
    
    // 更新主玩家历史
    this.mainPlayerHistory.push({ role: "user", content: action });
    this.mainPlayerHistory.push({ role: "system", content: finalResult.result });

    // 更新AI玩家的记忆
    for (const aiPlayer of Object.values(this.aiPlayers)) {
      aiPlayer.updateMemory(action, finalResult.result);
    }
  }

  getVisibleHistoryForAI(aiPlayer) {
    // 返回AI玩家可见的历史（公共历史 + 自己的记忆）
    return [...this.publicHistory, ...aiPlayer.memory];
  }

  getMainPlayerHistory() {
    return this.mainPlayerHistory;
  }

  async getAIPlayersResponses(action) {
    const responses = {};
    for (const [name, aiPlayer] of Object.entries(this.aiPlayers)) {
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
    }
    return responses;
  }
}

// 使用示例
const gameManager = new GameManager();

async function initializeConversation(section, isReplay = false) {
    const settings = JSON.parse(localStorage.getItem('settings'));
    API_URL = window.getApiUrl() + 'chat/completions';
    API_KEY = settings.apiKey;
    MODEL = settings.model;

    currentSection = section; // 存储当前章节
    currentIsReplay = isReplay; // 存储是否重玩
    const playerCharacter = section.characters.find(char => char.name === selectedCharacter);

    document.getElementById('storyContent').innerHTML = '';

    let otherCharactersDescriptions = formatOtherCharactersDescriptions(section.characters);
    let influencePointsText = formatInfluencePointsText(section.influencePoints);

    const systemPrompt = createSystemPrompt(section, playerCharacter, otherCharactersDescriptions, influencePointsText);

    conversationHistory = [];
    optimizedConversationHistory = [];

    conversationHistory.push({ role: "system", content: systemPrompt });
    optimizedConversationHistory.push({ role: "system", content: systemPrompt });

    const firstAssistantMessage = `${section.startEvent}`;
    conversationHistory.push({ role: "assistant", content: firstAssistantMessage });
    optimizedConversationHistory.push({ role: "system", content: firstAssistantMessage });

    if (isCarrotTest()) console.log("Debug 对话初始化:", conversationHistory);

    const storyContent = createStoryContent(section, playerCharacter);

    updateDisplay('info', storyContent);

    // 检查并添加音乐播放器
    if (section.musicUrl) {
        addMusicPlayer(section.musicUrl);
    }

    // 生成玩家角色信息
    const playerInfo = createPlayerInfo(playerCharacter);
    updateDisplay('info', playerInfo);

    toggleSectionVisibility();

    // 在页面上显示启动事件
    updateDisplay('assistant', firstAssistantMessage);

    // 检测桥段是否应该立即结束
    if (section.autoComplete) {
        const summary = createAutoCompleteSummary(section);
        handleOutcome(section.id, summary, section, isReplay).then(() => {
            disableInput();

            const completeButton = createCompleteButton();
            document.getElementById('storyContent').appendChild(completeButton);
        });
    }

    document.getElementById('storyContent').scrollTop = 0;

    gameManager.initializeGame(section);
}

async function submitUserInput() {
    if (isSubmitting || isCooldown) return;

    const { submitButton, userInputField, loadingDiv } = getElements();

    let userInput = userInputField.value;

    if (userInput.trim() === "") {
        alert("输入不能为空");
        return;
    }

    userInput = `${selectedCharacter}：${userInput}`;
    conversationHistory.push({ role: "user", content: userInput });
    optimizedConversationHistory.push({ role: "user", content: userInput });

    updateDisplay('user', userInput);

    if (isCarrotTest()){
        console.log("Debug 提交给模型的对话:", optimizedConversationHistory);
        console.log("Debug 优化前的对话:", conversationHistory);
    }

    // Check if conversationHistory length exceeds 40
    if (conversationHistory.length > 40) {
        alert("桥段已超出20轮，自动结算结果。");
        userInputField.style.display = 'none';
        submitButton.style.display = 'none';
        userInputField.disabled = true;
        submitButton.disabled = true;
        getSectionSummary(currentSection.id, gameManager.getMainPlayerHistory(), currentSection).then(summary => {
            handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
        });
        return;
    }

    toggleSubmittingState(true, loadingDiv, userInputField, submitButton);

    try {
        const result = await gameManager.processMainPlayerAction(userInput);
        
        // 更新对话历史和显示
        conversationHistory.push({ role: "assistant", content: result });
        optimizedConversationHistory.push({ role: "system", content: result });
        updateDisplay('assistant', result);

        // 检查是否需要结束桥段
        if (gameManager.moderator.endSectionFlag) {
            // 桥段结束后禁用输入框和提交按钮
            disableInput();
            const summary = await getSectionSummary(currentSection.id, gameManager.getMainPlayerHistory(), currentSection);
            handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
        }
    } catch (error) {
        console.error("处理用户输入时出错:", error);
    } finally {
        toggleSubmittingState(false, loadingDiv, userInputField, submitButton);

        setTimeout(() => {
            isCooldown = false;
        }, COOLDOWN_TIME);
    }    
}

async function getSectionSummary(sectionId, mainPlayerHistory, section) {
    const influencePointsText = formatInfluencePointsText(section.influencePoints);

    const systemPrompt = createSectionSummaryPrompt(section, mainPlayerHistory, influencePointsText);

    if (isCarrotTest()) console.log("Debug getSectionSummary提交给模型:", systemPrompt);

    return fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: systemPrompt }], response_format: { type: "json_object" }, max_tokens: 4096 }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(response => parseSectionSummaryResponse(response))
    .catch(error => handleSummaryRequestError(error));
}

function updateDisplay(role, messageContent) {
    const storyContentDiv = document.getElementById('storyContent');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = formatContent(role, messageContent);
    storyContentDiv.appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function formatOtherCharactersDescriptions(characters) {
    return characters
        .filter(char => char.name !== selectedCharacter)
        .map(char => `${char.name}：${char.role}，${char.description || ''} ${char.details?.join(' ') || ''}`.trim())
        .join('\n');
}

function formatInfluencePointsText(influencePoints) {
    return influencePoints.map((point, index) => `${index + 1}. ${point.description}`).join('\n');
}

function createSystemPrompt(section, playerCharacter, otherCharactersDescriptions, influencePointsText) {
    // 检查是否需要带上 GMDetails_count
    const GMDetailsCountText = section.enableCount ? `,"GMDetails_count": "单个字符串，如果GMDetails有规定回合数的特殊事件，写倒计时事情+倒计时回合数。倒计时结束后触发事件，再看看有没有下一个倒计时。"` : '';

    // influencePointsText 不使用在系统prompt里
    return `请你做主持人来主持一场游戏的一个桥段。
桥段背景介绍：${section.backgroundInfo}
主角和剧本：
${playerCharacter.name}：${playerCharacter.role}，${playerCharacter.description}
主角桥段目标：${section.objective}
桥段人物和剧本：
${otherCharactersDescriptions}
特别提示：
${section.GMDetails}
你需要生成非主角角色的反应和发生的事情，直到主角的决策点，到主角说话或决策的部分，你需要询问玩家，并等玩家做出决策再描绘。
请按照以下JSON格式回复：
{
"analysis": "判断玩家的角色能否做到玩家所说的事",
"mechanism": "这个字段对玩家隐藏。描述非玩家角色的想法，接下来他们将会做出什么行动"${GMDetailsCountText},
"display": "单个字符串，玩家行动效果如何，玩家看到听到了什么？比如表情动作、玩家能听到的话。作为游戏主持人你有超越游戏的事要和玩家沟通吗？在这个字段请直接称呼玩家为'你'。这个字段可以描写多一点。",
"endSectionFlag": "布尔值，是否满足了桥段结束条件？是的话将进入桥段复盘环节"
}`;
}

function createStoryContent(section, playerCharacter) {
    return `<h2>${section.title}</h2><div class="image-container"><img src="${section.image}" alt="桥段图片"></div><p><b>目标：${section.objective}</b></p><p>${section.backgroundInfo}</p>`;
}

function toggleSectionVisibility() {
    document.getElementById('sectionsContainer').style.display = 'none';
    document.getElementById('storyContainer').style.display = 'flex';
}

function createPlayerInfo(playerCharacter) {
    return `<b>你的角色：</b>
    <b>${playerCharacter.name}</b> - ${playerCharacter.role}
    ${playerCharacter.description}`;
}

function createAutoCompleteSummary(section) {
    return {
        objective: true,
        influencePoints: section.influencePoints.map(point => ({
            name: point.name,
            influence: point.default
        })),
        summary: `${section.title}桥段不需要玩家参与，自动完成。`
    };
}

function disableInput() {
    const userInputField = document.getElementById('userInput');
    const submitButton = document.getElementById('submitInputButton');
    userInputField.disabled = true;
    submitButton.disabled = true;
}

function enableInput() {
    const userInputField = document.getElementById('userInput');
    const submitButton = document.getElementById('submitInputButton');
    userInputField.disabled = false;
    submitButton.disabled = false;
    userInputField.style.display = "flex";
    submitButton.style.display = "flex";
}

function createCompleteButton() {
    const completeButton = document.createElement('button');
    completeButton.className = 'button';
    completeButton.innerText = '返回桥段选择';
    completeButton.onclick = returnToSectionSelection;

    return completeButton;
}

function getElements() {
    return {
        submitButton: document.getElementById('submitInputButton'),
        userInputField: document.getElementById('userInput'),
        loadingDiv: document.getElementById('loading')
    };
}

function toggleSubmittingState(isSubmittingFlag, loadingDiv, userInputField, submitButton) {
    isSubmitting = isSubmittingFlag;
    isCooldown = true;

    loadingDiv.style.display = isSubmittingFlag ? 'block' : 'none';
    userInputField.style.display = isSubmittingFlag ? 'none' : 'block';
    submitButton.style.display = isSubmittingFlag ? 'none' : 'block';
}

async function handleApiResponse(response) {
    if (!response.ok) {
        const errorResponse = await response.json();
        console.error("错误响应内容:", errorResponse);
        const errorResponseString = JSON.stringify(errorResponse);

        alert(`请求失败: ${errorResponseString}`);
        if (errorResponseString.includes("无效的令牌")) {
            alert(`如果第一次玩遇到"无效的令牌"可以尝试刷新网页或者去设置里面更新key`);
        } else if (errorResponseString.includes("额度")) {
            alert(`这个key也许没额度了呢，如果是公共key说明作者穷了QAQ`);
        }

        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

function processModelResponse(responseData, userInputField, submitButton) {
    document.getElementById('userInput').value = '';
    const modelResponse = responseData.choices[0].message['content'];
    if (isCarrotTest()) console.log("Debug 模型的回复:", modelResponse);

    let parsedResponse;
    try {
        // 使用更复杂的正则表达式提取 JSON 数据
        const jsonMatch = modelResponse.match(/{(?:[^{}]|{(?:[^{}])*})*}/s);
        if (jsonMatch) {
            parsedResponse = fixAndParseJSON(jsonMatch[0]);
        } else {
            throw new Error("未找到有效的 JSON 数据");
        }
    } catch (error) {
        console.error("解析模型回复时出错:", error);
        alert("模型回复解析失败。");
    }

    if (parsedResponse) {
        conversationHistory.push({ role: "assistant", content: modelResponse });

        optimizedConversationHistory.push({
            role: "system",
            content: `显示内容: ${parsedResponse.display}` + (parsedResponse.GMDetails_count ? `, 倒计时事件: ${parsedResponse.GMDetails_count}` : '')
        });        

        updateDisplay('assistant', parsedResponse.display);

        if (parsedResponse.endSectionFlag) {
            // 桥段结束后禁用输入框和提交按钮
            userInputField.style.display = 'none';
            submitButton.style.display = 'none';
            userInputField.disabled = true;
            submitButton.disabled = true;
            getSectionSummary(currentSection.id, optimizedConversationHistory, currentSection).then(summary => {
                handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
            });
        }
    }
}

function createSectionSummaryPrompt(section, mainPlayerHistory, influencePointsText) {
    return `
        请基于以下对话历史，对完成度做出总结。
        对话历史：
        ${mainPlayerHistory.map(message => `${message.role}: ${message.content}`).join('\n')}
        以上是对话历史。
        本桥段目标：${section.objective}
        影响点：
        ${influencePointsText}
        请按照以下JSON格式回复：
        {
            "objective": "是否达成了桥段目标，布尔值",
            "influencePoints": [
                {"name": 影响点英文别名, "influence": "是否，布尔值"}
            ],
            "summary": "总结的内容，单个字符串，可以写详细一点，包括对玩家行为的评价。",
            "objective_judge":"只写出对于判断桥段目标是否达成的解释，不写影响点。请称玩家角色为'你'。"
        }
        注意influencePoints要严格按照原顺序，方便系统保存。
    `;
}

function parseSectionSummaryResponse(response) {
    const summaryResponse = response.choices[0].message.content;
    if (isCarrotTest()) console.log("Debug 大模型的总结回复:", summaryResponse);

    try {
        // 使用更复杂的正则表达式提取 JSON 数据
        const jsonMatch = summaryResponse.match(/{(?:[^{}]|{(?:[^{}])*})*}/s);
        if (jsonMatch) {
            return fixAndParseJSON(jsonMatch[0]);
        } else {
            throw new Error("未找到有效的 JSON 数据");
        }
    } catch (error) {
        console.error("解析总结回复时出错:", error);
        alert("总结回复解析失败。");
        return null;
    }
}

function handleSummaryRequestError(error) {
    console.error("请求总结失败:", error);
    alert("生成总结请求失败。");
    return null;
}

function formatContent(role, content) {
    if (role === 'user') {
        return `<i>${content}</i>`;
    } else {
        const formattedContent = content.replace(/\n/g, '<br>');
        return highlightSpecialTerms(formattedContent);
    }
}

function fixAndParseJSON(jsonString) {
    try {
        // 首先尝试直接解析
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn("JSON 解析失败，尝试修复:", e);

        // 处理嵌套双引号的问题
        let fixedString = jsonString.replace(/"(.*?)":\s*"(.*?)"(?=\s*,|\s*})/g, function(match, p1, p2) {
            if (p2.includes('"')) {
                // 对包含双引号的值进行转义
                return `"${p1}": "${p2.replace(/"/g, '\\"')}"`;
            }
            return match;
        });

        // 在每个换行符和字符之间添加逗号
        fixedString = fixedString.replace(/}\s*{/, "},{");

        // 检查最常见的错误：缺少逗号
        fixedString = fixedString.replace(/("\w+":.*?[^\\])"\s*("\w+":)/g, '$1, "$2');
        fixedString = fixedString.replace(/,(\s*})/g, '$1');

        // 删除不必要的换行符
        fixedString = fixedString.replace(/\r\n\r\n/g, "<br><br>");
        fixedString = fixedString.replace(/\n\n/g, "<br><br>");

        try {
            return JSON.parse(fixedString);
        } catch (error) {
            console.error("修复后解析 JSON 仍然失败:", error);
            throw new Error("无法修复 JSON 字符串");
        }
    }
}