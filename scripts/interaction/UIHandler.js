let lastMessageElement = null;
let isStreaming = false;

function updateDisplay(role, messageContent, streaming = false) {
    const storyContentDiv = document.getElementById('storyContent');
    
    if (streaming) {
        if (!isStreaming) {
            // 开始新的流式消息
            isStreaming = true;
            const messageElement = document.createElement('p');
            messageElement.setAttribute('data-role', role);
            messageElement.innerHTML = formatContent(role, messageContent);
            storyContentDiv.appendChild(messageElement);
            lastMessageElement = messageElement;
        } else {
            // 更新现有的流式消息
            lastMessageElement.innerHTML = formatContent(role, messageContent);
        }
    } else {
        // 非流式消息，总是创建新元素
        isStreaming = false;
        const messageElement = document.createElement('p');
        messageElement.setAttribute('data-role', role);
        messageElement.innerHTML = formatContent(role, messageContent);
        storyContentDiv.appendChild(messageElement);
        lastMessageElement = messageElement;
    }
    
    lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function formatContent(role, content) {
    if (!content) {
        console.error('formatContent 内容为空');
        return '';
    }
    
    if (role === 'user') {
        return `<i>${content}</i>`;
    } else {
        const formattedContent = content.replace(/\n/g, '<br>');
        return highlightSpecialTerms(formattedContent);
    }
}

function toggleSubmittingState(isSubmittingFlag, loadingDiv, userInputField, submitButton) {
    setIsSubmitting(isSubmittingFlag);
    setIsCooldown(true);

    loadingDiv.style.display = isSubmittingFlag ? 'block' : 'none';
    userInputField.style.display = isSubmittingFlag ? 'none' : 'block';
    submitButton.style.display = isSubmittingFlag ? 'none' : 'block';
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

function createPlayerInfo(playerCharacter) {
    return `<b>你的角色：</b>
    <b>${playerCharacter.name}</b> - ${playerCharacter.role}
    ${playerCharacter.description}`;
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

function toggleSectionVisibility() {
    document.getElementById('sectionsContainer').style.display = 'none';
    document.getElementById('storyContainer').style.display = 'flex';
}

// 初始化UI处理器
function initializeUIHandler() {
    console.log("UI处理器已初始化");
}