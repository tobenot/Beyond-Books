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
注意，玩家的行为可以不理智，你主要判断可行性，只要有能力做到，就可以做。

请用JSON格式回答：

{
"reason": "解释",
"suggestion": "如果不可行，给出建议",
"isValid": boolean
}
`;

    const response = await this.callLargeLanguageModel(prompt);
    return JSON.parse(response);
  }
  async generateFinalResult(mainPlayerAction, aiActions) {
    const prompt = `请你作为主持人来最终输出这个回合的结果。
背景信息：${this.currentContext}

主角行动：${mainPlayerAction}

其他角色行动：
${Object.entries(aiActions).map(([name, action]) => `${name}: ${action.action}`).join('\n')}

请按照以下JSON格式回复：
{
  "display": "单个字符串,详细描述这个回合的结果,包括环境变化、其他角色的反应、他们说出来的话等。请用第三人称方式描写。请不要代替主角做行动，只需要详细描述主角行动的过程和影响。",
  "endSectionFlag": "布尔值,是否满足了桥段结束条件？如果是,将进入桥段复盘环节"
}`;

    console.log("生成最终结果提示", prompt);

    const response = await this.callLargeLanguageModel(prompt);
    return JSON.parse(response);
  }

  async callLargeLanguageModel(prompt) {
    // 打印日志
    console.log("调用大语言模型", {
      prompt,
      API_URL,
      API_KEY,
      MODEL
    });

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
    this.log("创建提示", { 
      prompt
    });
    
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

// 游戏管理器类
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

  // 添加日志方法
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

// 使用示例
const gameManager = new GameManager();

async function initializeGame(section, isReplay = false) {
  // 初始化设置
  initializeSettings();
  
  // 初始化游戏管理器
  gameManager.initializeGame(section);
  
  // 准备UI和显示内容
  prepareUI(section);
  
  // 显示初始内容
  displayInitialContent(section);
  
  // 如果是自动完成的章节,直接处理结果
  if (section.autoComplete) {
    await handleAutoCompleteSection(section, isReplay);
  }
}

function initializeSettings() {
  const settings = JSON.parse(localStorage.getItem('settings'));
  API_URL = window.getApiUrl() + 'chat/completions';
  API_KEY = settings.apiKey;
  MODEL = settings.model;
}

function prepareUI(section) {
  document.getElementById('storyContent').innerHTML = '';
  toggleSectionVisibility();
}

function createStoryContent(section, playerCharacter) {
    return `<h2>${section.title}</h2><div class="image-container"><img src="${section.image}" alt="桥段图片"></div><p><b>目标：${section.objective}</b></p><p>${section.backgroundInfo}</p>`;
}

function displayInitialContent(section) {
  const playerCharacter = section.characters.find(char => char.name === selectedCharacter);
  const storyContent = createStoryContent(section, playerCharacter);
  const playerInfo = createPlayerInfo(playerCharacter);
  updateDisplay('info', storyContent);
  updateDisplay('info', playerInfo);
  if (section.musicUrl) {
    addMusicPlayer(section.musicUrl);
  }
  updateDisplay('assistant', section.startEvent);
  
  document.getElementById('storyContent').scrollTop = 0;
}

async function handleAutoCompleteSection(section, isReplay) {
  const summary = createAutoCompleteSummary(section);
  await handleOutcome(section.id, summary, section, isReplay);
  disableInput();
  const completeButton = createCompleteButton();
  document.getElementById('storyContent').appendChild(completeButton);
}

async function handleUserInput() {
  if (isSubmitting || isCooldown) return;

  const userInput = getUserInput();
  if (!userInput) return;

  updateConversationHistory(userInput);
  updateDisplay('user', userInput);

  if (shouldEndSection()) {
    await endSection();
    return;
  }

  await processUserInput(userInput);
}

function getUserInput() {
  const userInputField = document.getElementById('userInput');
  const userInput = userInputField.value.trim();
  
  if (userInput === "") {
    alert("输入不能为空");
    return null;
  }
  
  return `${selectedCharacter}：${userInput}`;
}

function updateConversationHistory(userInput) {
  conversationHistory.push({ role: "user", content: userInput });
  optimizedConversationHistory.push({ role: "user", content: userInput });
}

function shouldEndSection() {
  return conversationHistory.length > 40;
}

async function endSection() {
  alert("桥段已超出20轮，自动结算结果。");
  disableInput();
  const summary = await getSectionSummary(currentSection.id, gameManager.getMainPlayerHistory(), currentSection);
  await handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
}

async function processUserInput(userInput) {
  const { loadingDiv, userInputField, submitButton } = getElements();
  toggleSubmittingState(true, loadingDiv, userInputField, submitButton);

  try {
    const result = await gameManager.processMainPlayerAction(userInput);
    updateConversationWithResult(result);
    
    if (gameManager.moderator.endSectionFlag) {
      await handleSectionEnd();
    }
  } catch (error) {
    console.error("处理用户输入时出错:", error);
  } finally {
    toggleSubmittingState(false, loadingDiv, userInputField, submitButton);
    setCooldown();
  }
}

function updateConversationWithResult(result) {
  conversationHistory.push({ role: "assistant", content: result });
  optimizedConversationHistory.push({ role: "system", content: result });
  updateDisplay('assistant', result);
}

async function handleSectionEnd() {
  disableInput();
  const summary = await getSectionSummary(currentSection.id, gameManager.getMainPlayerHistory(), currentSection);
  await handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
}

function setCooldown() {
  setTimeout(() => {
    isCooldown = false;
  }, COOLDOWN_TIME);
}

function updateDisplay(role, messageContent) {
  const storyContentDiv = document.getElementById('storyContent');
  const messageElement = document.createElement('p');
  messageElement.innerHTML = formatContent(role, messageContent);
  storyContentDiv.appendChild(messageElement);
  messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function formatContent(role, content) {
  if (role === 'user') {
    return `<i>${content}</i>`;
  } else {
    const formattedContent = content.replace(/\n/g, '<br>');
    return highlightSpecialTerms(formattedContent);
  }
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

function fixAndParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("JSON 解析失败，尝试修复:", e);

    let fixedString = jsonString.replace(/"(.*?)":\s*"(.*?)"(?=\s*,|\s*})/g, function(match, p1, p2) {
      if (p2.includes('"')) {
        return `"${p1}": "${p2.replace(/"/g, '\\"')}"`;
      }
      return match;
    });

    fixedString = fixedString.replace(/}\s*{/, "},{");
    fixedString = fixedString.replace(/("\w+":.*?[^\\])"\s*("\w+":)/g, '$1, "$2');
    fixedString = fixedString.replace(/,(\s*})/g, '$1');
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

// 保留原有的其他辅助函数
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