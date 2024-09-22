async function initializeGame(section, isReplay = false) {
  // 重置全局状态
  resetGlobalState();
  
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
  
  setCurrentSection(section);
  setCurrentIsReplay(isReplay);
  
  gameManager.moderator = new Moderator(
    section.startEvent,
    section.commonKnowledge,
    section.GMDetails,
    gameManager.playerInfo,
    section.objective // 添加这一行
  );
}

function initializeSettings() {
  const settings = JSON.parse(localStorage.getItem('settings'));
  const apiUrl = window.getApiUrl() + 'chat/completions';
  setApiSettings(apiUrl, settings.apiKey, settings.model);
}

async function handleAutoCompleteSection(section, isReplay) {
  const summary = createAutoCompleteSummary(section);
  await handleOutcome(section.id, summary, section, isReplay);
  disableInput();
  const completeButton = createCompleteButton();
  document.getElementById('storyContent').appendChild(completeButton);
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