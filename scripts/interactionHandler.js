let isSubmitting = false;
let conversationHistory = [];
let selectedCharacter = '罗伯特';

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
    if (isSubmitting) return;

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

    loadingDiv.style.display = 'block';
    userInputField.style.display = 'none';
    submitButton.style.display = 'none';
    
    try {
        // 现在这样子会触发跨域，直接写网址先
        // const correctApiUrl = ensureCorrectApiUrl(settings.apiUrl);
        const response = await fetch("https://openkey.cloud/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages
            })
        }).then(res => res.json());

        document.getElementById('userInput').value = '';
        const modelResponse = response.choices[0].message['content'];

        console.log("模型的回复:", modelResponse);

        // 记录并显示大模型的回复
        conversationHistory.push({
            role: "assistant",
            content: modelResponse
        });

        updateDisplay('assistant', modelResponse); 

    } catch (error) {
        console.error("Failed to fetch:", error);
    } finally {
        loadingDiv.style.display = 'none';
        userInputField.style.display = 'block';
        submitButton.style.display = 'block';
        isSubmitting = false;
    }
}

function updateDisplay(role, messageContent) {
    const storyContentDiv = document.getElementById('storyContent');
    const messageElement = document.createElement('p');
    
    if (role === 'user') {
        messageElement.innerHTML = `<i>${messageContent}</i>`;
    } else if (role === 'assistant') {
        messageElement.textContent = messageContent;
    } else if (role === 'info') { // 新 role 用于显示额外信息
        messageElement.innerHTML = messageContent;
    }

    storyContentDiv.appendChild(messageElement);
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