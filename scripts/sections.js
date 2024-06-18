// scripts/sections.js

let sectionsIndex = {};
let currentSectionId = null;
let completedSections = [];
let unlockedSections = [];

function decryptJSONText(encryptedText, secretKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    try {
        return JSON.parse(decryptedText);
    } catch (error) {
        console.error('解析JSON时出错:', error.message);
        throw error;
    }
}

function loadSectionsIndex() {
    fetch('sections/sections.bbs')
        .then(response => response.text())
        .then(encryptedText => {
            const secretKey = 'ReadingThisIsASpoilerForYourself';
            const sectionsData = decryptJSONText(encryptedText, secretKey);
            if (sectionsData && sectionsData.sections) {
                sectionsIndex = sectionsData;
            } else {
                console.error('加载章节索引时出错：无效的章节数据');
            }
            setupSections();
        })
        .catch(error => console.error('加载或解密章节索引时出错:', error));
}


function setupSections() {
    const sectionsContainer = document.getElementById('sections');
    sectionsContainer.innerHTML = '<h2>选择章节</h2>';

    if (!sectionsIndex.sections || sectionsIndex.sections.length === 0) {
        console.error('章节索引无效或空');
        return;
    }

    sectionsIndex.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        
        if (completedSections.some(item => item.sectionId === section.id)) {
            sectionDiv.className += ' completed';
            sectionDiv.innerText = `${section.title}（已完成）`;
        } else if (unlockedSections.includes(section.id)) {
            const button = document.createElement('button');
            button.className = 'button';
            button.innerText = section.title;
            button.onclick = () => chooseSection(section.file);

            const image = document.createElement('img');
            image.src = section.image;
            image.alt = `${section.title} 缩略图`;

            sectionDiv.appendChild(image);
            sectionDiv.appendChild(button);
        } else {
            sectionDiv.className += ' locked';
            sectionDiv.innerText = `${section.title}（未解锁）`;
        }

        sectionsContainer.appendChild(sectionDiv);
    });
}

function chooseSection(fileName) {
    if (completedSections.some(section => section.fileName === fileName)) {
        alert("此桥段已完成，不能重复进入。");
        return;
    }
    
    // 重置当前章节ID和输入框状态
    currentSectionId = null;
    document.getElementById('userInput').disabled = false;
    document.getElementById('submitInputButton').disabled = false;
  
    // 添加时间戳来避免缓存
    const timestamp = new Date().getTime();
    fetch(`sections/${fileName}?v=${timestamp}`)
        .then(response => response.text())
        .then(encryptedText => {
            const secretKey = 'ReadingThisIsASpoilerForYourself';
            const sectionContent = decryptJSONText(encryptedText, secretKey);
            console.log("桥段剧本：", sectionContent);
            displaySection(sectionContent);
        })
        .catch(error => console.error('加载或解密章节数据时出错:', error));
}

function displaySection(section) {
    document.getElementById('sections').style.display = 'none';
  
    const storyContent = `
        <h2>${section.title}</h2>
        <p><b>目标：${section.objective}</b></p>
        <p>${section.backgroundInfo}</p>
    `;
    
    document.getElementById('storyContent').innerHTML = storyContent;
  
    document.getElementById('sectionImage').src = section.image;
  
    document.querySelector('.controls').style.display = 'flex';
  
    document.getElementById('story').style.display = 'flex';
    currentSection = section; // 设定当前章节为 global 变量
    
    initializeConversation(section); // 初始化对话
  }
  
  async function handleOutcome(sectionId, summary, section) {
    const { objective, influencePoints } = summary;
    const defaultInfluencePoints = section.influencePointsDefault || [];
    let changedInfluencePoints = 0;

    influencePoints.forEach((point, index) => {
        if (point.influence !== defaultInfluencePoints[index]) {
            changedInfluencePoints += 1;
        }
    });

    if (objective) {
        // 仅在目标达成时更新游戏状态
        updateGameState(sectionId, {
            objectiveAchieved: objective,
            influencePoints
        });

        const resultText = `
            <p>桥段目标达成</p>
            <p>影响点改变数：${changedInfluencePoints}</p>
        `;
        document.getElementById('storyContent').innerHTML += resultText;

        document.getElementById('userInput').style.display = 'none';
        document.getElementById('submitInputButton').style.display = 'none';
        document.getElementById('userInput').disabled = true;
        document.getElementById('submitInputButton').disabled = true;
        const completeButton = document.createElement('button');
        completeButton.className = 'button';
        completeButton.innerText = '返回桥段选择';
        completeButton.onclick = () => returnToSectionSelection();
        document.getElementById('storyContent').appendChild(completeButton);
    } else {
        // 当目标未达成时显示重新开始按钮
        const resultText = `
            <p>桥段目标未达成</p>
            <p>影响点改变数：${changedInfluencePoints}</p>
        `;
        document.getElementById('storyContent').innerHTML += resultText;

        document.getElementById('userInput').style.display = 'none';
        document.getElementById('submitInputButton').style.display = 'none';
        document.getElementById('userInput').disabled = true;
        document.getElementById('submitInputButton').disabled = true;
        const retryButton = document.createElement('button');
        retryButton.className = 'button';
        retryButton.innerText = '重新开始桥段';
        retryButton.onclick = () => restartSection(sectionId);
        document.getElementById('storyContent').appendChild(retryButton);
    }
}

function returnToSectionSelection() {
    document.getElementById('story').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
    document.getElementById('storyContent').innerHTML = ''; // 清空故事内容用于下次显示
}

function updateGameState(sectionId, result) {
    console.log('Updating game state:', { sectionId, result });

    const completedSectionIndex = completedSections.findIndex(
        section => section.sectionId === sectionId
    );

    if (completedSectionIndex !== -1) {
        // 更新已完成部分的结果
        completedSections[completedSectionIndex].result = result;
    } else {
        // 添加新的完成记录
        completedSections.push({ sectionId, result });
    }

    sectionsIndex.sections.forEach(section => {
        if (section.preconditions.every(cond =>
            completedSections.some(comp => comp.sectionId === cond.sectionId && comp.result === cond.result))) {
            if (!unlockedSections.includes(section.id)) {
                unlockedSections.push(section.id);
            }
        }
    });

    saveGame({
        currentSectionId: sectionId,
        completedSections,
        unlockedSections
    });

    setupSections();
}

function initializeGameState(savedData = null) {
    if (savedData) {
        currentSectionId = savedData.currentSectionId;
        completedSections = savedData.completedSections;
        unlockedSections = savedData.unlockedSections;
    } else {
        currentSectionId = null;
        completedSections = [];
        unlockedSections = [1];
    }

    loadSectionsIndex();
}

function restartSection(sectionId) {
    const section = sectionsIndex.sections.find(sect => sect.id === sectionId);
    if (section) {
        chooseSection(section.file);
    } else {
        console.error('未能找到要重新开始的桥段');
        alert('重新开始桥段时出错');
    }
}