async function endSection() {
  alert("桥段已超出20轮，自动结算结果。");
  disableInput();
  const summary = await getSectionSummary(currentSection);
  await handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
}

async function handleSectionEnd() {
  disableInput();
  const summary = await getSectionSummary(currentSection);
  await handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
}

async function getSectionSummary(section) {
  const influencePointsText = formatInfluencePointsText(section.influencePoints);
  const prompt = createSectionSummaryPrompt(section, optimizedConversationHistory, influencePointsText);

  if (isCarrotTest()){
    // 模型参数等信息
    console.log("Debug getSectionSummary提交给模型:", prompt);
    console.log("Debug getSectionSummary提交给模型:", getModel(ModelType.ADVANCED));
  }


  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: getModel(ModelType.ADVANCED), // 使用进阶模型
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4096
    }),
    credentials: 'include'
  };

  try {
    const response = await fetch(API_URL, options);
    const responseData = await handleApiResponse(response);
    return parseSectionSummaryResponse(responseData);
  } catch (error) {
    console.error("请求总结失败:", error);
    alert("生成总结请求失败。");
    return null;
  }
}

function createSectionSummaryPrompt(section, optimizedConversationHistory, influencePointsText) {
  return `
    请基于以下对话历史，对完成度做出总结。
    对话历史：
    ${optimizedConversationHistory.map(message => `${message.role}: ${message.content}`).join('\n')}
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

function parseSectionSummaryResponse(responseData) {
  const summaryResponse = responseData.choices[0].message.content;
  if (isCarrotTest()) console.log("Debug 大模型的总结回复:", summaryResponse);

  try {
    return fixAndParseJSON(summaryResponse);
  } catch (error) {
    console.error("解析总结回复时出错:", error);
    alert("总结回复解析失败。");
    return null;
  }
}

function formatInfluencePointsText(influencePoints) {
  return influencePoints.map(point => 
    `${point.name}（${point.alias}）：${point.description}`
  ).join('\n');
}