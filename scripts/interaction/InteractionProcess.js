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
  addToConversationHistory({ role: "user", content: userInput });
  addToOptimizedConversationHistory({ role: "user", content: userInput });
}

function shouldEndSection() {
  return conversationHistory.length > 40;
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

function setCooldown() {
  setTimeout(() => {
    setIsCooldown(false);
  }, COOLDOWN_TIME);
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