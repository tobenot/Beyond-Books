let isSubmitting = false;
let isCooldown = false;
let conversationHistory = [];
let selectedCharacter = '罗伯特';

const COOLDOWN_TIME = 1000; // 冷却时间，单位为毫秒

async function initializeConversation(section) {
    const playerCharacter = section.characters.find(char => char.name === selectedCharacter);

    // 生成玩家角色信息
    const playerInfo = `
        <b>你的角色：</b><br>
        <b>${playerCharacter.name}</b> - ${playerCharacter.role}<br>
        ${playerCharacter.description}
    `;
    // 显示玩家角色信息
    updateDisplay('info', playerInfo);

    let otherCharactersDescriptions = section.characters
        .filter(char => char.name !== selectedCharacter)
        .map(char => {
            return `${char.name}：${char.role}，${char.description || ''} ${char.details?.join(' ') || ''}`.trim();
        })
        .join('\n');
    
    let influencePointsText = section.influencePoints
        .map((point, index) => `${index + 1}. ${point}`)
        .join('\n');

    const systemPrompt = `请你做主持人来主持一场游戏的一个桥段。
        桥段背景介绍：${section.backgroundInfo}
        主角和剧本：
        ${playerCharacter.name}：${playerCharacter.role}，${playerCharacter.description}
        主角桥段目标：${section.objective}
        桥段人物和剧本：
        ${otherCharactersDescriptions}
        本桥段产生后续影响的点：
        ${influencePointsText}
        你需要生成非主角角色的反应和发生的事情，直到主角的决策点，到主角说话或决策的部分，你需要询问玩家，并等玩家做出决策再描绘。
        请按照以下JSON格式回复：
        {
            "analysis": "玩家是否能做到他要做的事？",
            "mechanism": "这个字段对玩家隐藏。非玩家角色的想法是什么样的？接下来他们将会做出什么行动？",
            "display": "单个字符串，玩家看到听到了什么？比如表情动作、玩家能听到的话。作为游戏主持人你有超越游戏的事要和玩家沟通吗？在这个字段请直接称呼玩家为'你'。这个字段可以描写多一点。",
            "endSceneFlag": "布尔值，是否满足了桥段结束条件？是的话将进入桥段复盘环节。"
        }
    `;

    // 初始化对话历史记录
    conversationHistory.push({
        role: "system",
        content: systemPrompt
    });

    const firstAssistantMessage = `
            ${section.startEvent}
            你要怎么做？
        `
    conversationHistory.push({
        role: "assistant",
        content: firstAssistantMessage
    });

    console.log("对话初始化:", conversationHistory);

    // 在页面上显示启动事件
    updateDisplay('assistant', firstAssistantMessage);
}

async function submitUserInput() {
    if (isSubmitting || isCooldown) return;

    const submitButton = document.getElementById('submitInputButton');
    const userInputField = document.getElementById('userInput');
    const loadingDiv = document.getElementById('loading'); 
    let userInput = userInputField.value;

    if (userInput.trim() === "") {
        alert("输入不能为空");
        return;
    }

    // 记录玩家的输入
    userInput = `${selectedCharacter}：${userInput}`;
    conversationHistory.push({
        role: "user",
        content: userInput
    });

    updateDisplay('user', userInput);

    const settings = JSON.parse(localStorage.getItem('settings'));

    // 组织对话历史作为消息
    const messages = conversationHistory;

    console.log("提交给模型的对话历史:", messages);

    isSubmitting = true;
    isCooldown = true; // 开始冷却

    loadingDiv.style.display = 'block';
    userInputField.style.display = 'none';
    submitButton.style.display = 'none';
    
    try {
        const response = await fetch(settings.apiUrl + 'chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model, // 使用选择的模型
                messages: messages
            })
        }).then(res => res.json());

        document.getElementById('userInput').value = '';
        const modelResponse = response.choices[0].message['content'];
        console.log("模型的回复:", modelResponse);

        // 处理模型的回复，试图解析 JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(modelResponse);
        } catch (error) {
            console.error("解析模型回复时出错:", error);
            alert("模型回复解析失败，请稍后再试。");
            // 显示模型的原始回复
            updateDisplay('assistant', modelResponse);
        }

        if (parsedResponse) {
            // 记录并显示大模型的回复
            conversationHistory.push({
                role: "assistant",
                content: modelResponse
            });

            // 更新显示内容
            updateDisplay('assistant', parsedResponse.display);

            // 检查桥段是否结束
            if (parsedResponse.endSceneFlag) {
                handleOutcome(currentSection.id, "目标完成");
            }
        }
    } catch (error) {
        console.error("请求失败:", error);
    } finally {
        loadingDiv.style.display = 'none';
        userInputField.style.display = 'block';
        submitButton.style.display = 'block';
        isSubmitting = false;

        // 启动定时器，解除冷却状态
        setTimeout(() => {
            isCooldown = false;
        }, COOLDOWN_TIME);
    }
}

function updateDisplay(role, messageContent) {
    const storyContentDiv = document.getElementById('storyContent');
    const messageElement = document.createElement('p');
    
    if (role === 'user') {
        messageElement.innerHTML = `<i>${messageContent}</i>`;
    } else if (role === 'assistant') {
        messageElement.textContent = messageContent;
    } else if (role === 'info') {
        messageElement.innerHTML = messageContent;
    }

    storyContentDiv.appendChild(messageElement);
    storyContentDiv.scrollTop = storyContentDiv.scrollHeight; // 自动滚动到底部
}

function ensureCorrectApiUrl(apiUrl) {
    // 确保url以http:// 或 https:// 开始
    apiUrl = apiUrl.startsWith('http://') || apiUrl.startsWith('https://') ? apiUrl : 'http://' + apiUrl;
    
    // 移除末尾多余的斜线
    apiUrl = apiUrl.replace(/\/+$/, '');
    
    // 确保url包含`v1/`
    if (!apiUrl.endsWith('/v1')) {
        apiUrl += '/v1';
    }

    // 保证`v1/`后面只有一个斜线
    apiUrl += apiUrl.endsWith('/v1') ? '/chat/completions/' : 'chat/completions/';

    return apiUrl;
}

document.getElementById("submitInputButton").addEventListener("click", submitUserInput);