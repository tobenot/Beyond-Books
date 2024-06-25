let isSubmitting = false;
let isCooldown = false;
let conversationHistory = [];
let selectedCharacter = '罗伯特';
let currentSection = null;


const COOLDOWN_TIME = 1000; // 冷却时间，单位为毫秒

async function initializeConversation(section, isReplay = false) {
    currentSection = section; // 存储当前章节
    const playerCharacter = section.characters.find(char => char.name === selectedCharacter);

    document.getElementById('storyContent').innerHTML = '';

    let otherCharactersDescriptions = section.characters
        .filter(char => char.name !== selectedCharacter)
        .map(char => {
            return `${char.name}：${char.role}，${char.description || ''} ${char.details?.join(' ') || ''}`.trim();
        })
        .join('\n');
    
    let influencePointsText = section.influencePoints
        .map((point, index) => `${index + 1}. ${point.description}`)
        .join('\n');

    const systemPrompt = `请你做主持人来主持一场游戏的一个桥段。
        桥段背景介绍：${section.backgroundInfo}
        主角和剧本：
        ${playerCharacter.name}：${playerCharacter.role}，${playerCharacter.description}
        主角桥段目标：${section.objective}
        桥段人物和剧本：
        ${otherCharactersDescriptions}
        特别提示：
        ${section.GMDetails}
        本桥段产生后续影响的点：
        ${influencePointsText}
        你需要生成非主角角色的反应和发生的事情，直到主角的决策点，到主角说话或决策的部分，你需要询问玩家，并等玩家做出决策再描绘。
        请按照以下JSON格式回复：
        {
            "analysis": "判断玩家的角色能否做到玩家所说的事",
            "mechanism": "这个字段对玩家隐藏。描述非玩家角色的想法，接下来他们将会做出什么行动",
            "display": "单个字符串，玩家行动效果如何，玩家看到听到了什么？比如表情动作、玩家能听到的话。作为游戏主持人你有超越游戏的事要和玩家沟通吗？在这个字段请直接称呼玩家为'你'。这个字段可以描写多一点。",
            "endSectionFlag": "布尔值，是否满足了桥段结束条件？是的话将进入桥段复盘环节"
        }
    `;

    conversationHistory = [];

    // 初始化对话历史记录
    conversationHistory.push({
        role: "system",
        content: systemPrompt
    });

    const firstAssistantMessage = `${section.startEvent}`;

    conversationHistory.push({
        role: "assistant",
        content: firstAssistantMessage
    });

    console.log("对话初始化:", conversationHistory);

    const storyContent = `
        <h2>${section.title}</h2>
        <div class="image-container">
            <img src="${section.image}" alt="桥段图片">
        </div>
        <p><b>目标：${section.objective}</b></p>
        <p>${section.backgroundInfo}</p>
    `;

    updateDisplay('info', storyContent);

    // 检查并添加音乐播放器
    if (section.musicUrl) {
        addMusicPlayer(section.musicUrl);
    }

    // 生成玩家角色信息
    const playerInfo = `
        <b>你的角色：</b><br>
        <b>${playerCharacter.name}</b> - ${playerCharacter.role}<br>
        ${playerCharacter.description}
    `;
    // 显示玩家角色信息
    updateDisplay('info', playerInfo);

    // 初始化UI，隐藏章节选择页面并显示故事页面
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'flex';

    // 在页面上显示启动事件
    updateDisplay('assistant', firstAssistantMessage);

    // 检测桥段是否应该立即结束
    if (section.autoComplete) {
        const summary = {
            objective: true,
            influencePoints: section.influencePoints.map(point => ({
                name: point.name,
                influence: point.default
            })),
            summary: `${section.title}桥段不需要玩家参与，自动完成。`
        };
        handleOutcome(section.id, summary, section, isReplay).then(() => {
            // 桥段结束后禁用输入框和提交按钮
            document.getElementById('userInput').style.display = 'none';
            document.getElementById('submitInputButton').style.display = 'none';
            document.getElementById('userInput').disabled = true;
            document.getElementById('submitInputButton').disabled = true;

            const completeButton = document.createElement('button');
            completeButton.className = 'button';
            completeButton.innerText = '返回桥段选择';
            completeButton.onclick = returnToSectionSelection;
            document.getElementById('storyContent').appendChild(completeButton);
        });
    }

    document.getElementById('storyContent').scrollTop = 0;
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

    userInput = `${selectedCharacter}：${userInput}`;
    conversationHistory.push({
        role: "user",
        content: userInput
    });

    updateDisplay('user', userInput);

    const settings = JSON.parse(localStorage.getItem('settings'));

    const messages = conversationHistory;

    console.log("提交给模型的对话历史:", messages);

    isSubmitting = true;
    isCooldown = true;

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
                model: settings.model,
                messages: messages,
                response_format: {"type": "json_object"},
                max_tokens: 4096,
            })
        }).then(res => res.json());

        document.getElementById('userInput').value = '';
        const modelResponse = response.choices[0].message['content'];
        console.log("模型的回复:", modelResponse);

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(modelResponse);
        } catch (error) {
            console.error("解析模型回复时出错:", error);
            alert("模型回复解析失败。");
        }

        if (parsedResponse) {
            conversationHistory.push({
                role: "assistant",
                content: modelResponse
            });

            updateDisplay('assistant', parsedResponse.display);

            if (parsedResponse.endSectionFlag) {
                const summary = await getSectionSummary(currentSection.id, conversationHistory, currentSection);
                handleOutcome(currentSection.id, summary, currentSection);

                // 桥段结束后禁用输入框和提交按钮
                userInputField.style.display = 'none';
                submitButton.style.display = 'none';
                userInputField.disabled = true;
                submitButton.disabled = true;
            }
        }
    } catch (error) {
        console.error("请求失败:", error);
    } finally {
        loadingDiv.style.display = 'none';
        userInputField.style.display = 'block';
        submitButton.style.display = 'block';
        isSubmitting = false;

        setTimeout(() => {
            isCooldown = false;
        }, COOLDOWN_TIME);
    }
}

async function getSectionSummary(sectionId, conversationHistory, section) {
    const settings = JSON.parse(localStorage.getItem('settings'));

    const influencePointsText = section.influencePoints
        .map((point, index) => `${index + 1}. ${point.description}`)
        .join('\n');

    const systemPrompt = `
        请基于以下对话历史，对完成度做出总结。
        对话历史：
        ${conversationHistory.map(message => `${message.role}: ${message.content}`).join('\n')}
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
            "objective_judge":"只写出对于判断桥段目标是否达成的解释，不写影响点。请称玩家角色为‘你’。"
        }
        注意influencePoints要严格按照原顺序，方便系统保存。
    `;

    console.log("Debug getSectionSummary提交给模型:", systemPrompt);

    try {
        const response = await fetch(settings.apiUrl + 'chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: "system", content: systemPrompt }
                ],
                response_format: { "type": "json_object" },
                max_tokens: 4096
            })
        }).then(res => res.json());

        const summaryResponse = response.choices[0].message.content;
        console.log("大模型的总结回复:", summaryResponse);

        let summary;
        try {
            summary = JSON.parse(summaryResponse);
        } catch (error) {
            console.error("解析总结回复时出错:", error);
            alert("总结回复解析失败。");
        }

        return summary;
    } catch (error) {
        console.error("请求总结失败:", error);
        alert("生成总结请求失败。");
        return null;
    }
}

function updateDisplay(role, messageContent) {
    const storyContentDiv = document.getElementById('storyContent');
    const messageElement = document.createElement('p');

    if (role === 'user') {
        // 玩家打的字不高亮
        messageElement.innerHTML = `<i>${messageContent}</i>`;
    } else if (role === 'assistant') {
        // 用 <br> 代替换行符 \n
        const formattedMessageContent = messageContent.replace(/\n/g, '<br>');
        const highlightedContent = highlightSpecialTerms(formattedMessageContent);
        messageElement.innerHTML = highlightedContent;
    } else if (role === 'info') {
        const highlightedContent = highlightSpecialTerms(messageContent);
        messageElement.innerHTML = highlightedContent;
    }

    storyContentDiv.appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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