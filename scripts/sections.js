// scripts/sections.js

let sectionsIndex = {};
let currentSectionId = null;
let completedSections = [];
let unlockedSections = [];
let globalInfluencePoints = [];

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
    const timestamp = new Date().getTime();
    fetch(`sections/sections.bbs?v=${timestamp}`)
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
            checkUnlockConditions(); // 检查桥段解锁情况
        })
        .catch(error => console.error('加载或解密章节索引时出错:', error));
}

function setupSections() {
    const sectionsList = document.getElementById('sections');
    sectionsList.innerHTML = '';

    if (!sectionsIndex.sections || sectionsIndex.sections.length === 0) {
        console.error('章节索引无效或空');
        return;
    }

    sectionsIndex.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';

        if (completedSections.some(item => item.sectionId === section.id)) {
            sectionDiv.className += ' completed';
            const replayButton = document.createElement('button');
            replayButton.className = 'button';
            replayButton.innerText = `${section.title}（已完成） - 重玩`;
            replayButton.onclick = () => chooseSection(section.file, true);
            sectionDiv.appendChild(replayButton);
        } else if (unlockedSections.includes(section.id)) {
            const button = document.createElement('button');
            button.className = 'button';
            button.innerText = section.title;
            button.onclick = () => chooseSection(section.file, false);

            const image = document.createElement('img');
            image.src = section.image;
            image.alt = `${section.title} 缩略图`;

            sectionDiv.appendChild(image);
            sectionDiv.appendChild(button);
        } else {
            sectionDiv.className += ' locked';
            sectionDiv.innerText = `${section.title}（未解锁）`;
        }

        sectionsList.appendChild(sectionDiv);
    });
}

function returnToMenu() {
    document.getElementById('sectionsContainer').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}

function chooseSection(fileName, isReplay = false) {
    // 添加时间戳来避免缓存
    const timestamp = new Date().getTime();
    fetch(`sections/${fileName}?v=${timestamp}`)
        .then(response => response.text())
        .then(encryptedText => {
            const secretKey = 'ReadingThisIsASpoilerForYourself';
            const sectionContent = decryptJSONText(encryptedText, secretKey);

            if (isCarrotTest()) console.log("Debug: 桥段剧本：", sectionContent);

            enableInput()

            displaySection(sectionContent, isReplay);
        })
        .catch(error => console.error('加载或解密章节数据时出错:', error));
}

function displaySection(section, isReplay = false) {
    const storyContainer = document.getElementById('storyContainer');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const storyTitle = document.getElementById('storyTitle');
    const storyContent = document.getElementById('storyContent');

    storyTitle.innerHTML = section.title; // 设置桥段名称
    storyContent.innerHTML = ''; // 清空之前的故事内容

    sectionsContainer.style.display = 'none'; // 隐藏章节选择
    storyContainer.style.display = 'flex';  // 显示故事内容

    initializeConversation(section, isReplay);
    currentSection = section;
}

async function handleOutcome(sectionId, summary, section, isReplay = false) {
    const { objective, influencePoints, objective_judge } = summary;

    // 获取默认的影响点
    const defaultInfluencePoints = section.influencePoints.map(point => point.default);
    let changedInfluencePoints = 0;

    // 检查影响点是否与默认值不同
    influencePoints.forEach((point, index) => {
        if (point.influence !== defaultInfluencePoints[index]) {
            changedInfluencePoints += 1;
        }
    });

    if (objective) {
        changedInfluencePoints += 1;
        
        // 只有在非重玩模式下更新游戏状态
        if (!isReplay) {
            updateGameState(sectionId, {
                objectiveAchieved: objective,
                influencePoints
            });
        }

        const resultText = isReplay ? `
            <p>${objective_judge}</p>
            <p>桥段目标完成</p>
            <p>原本应造成后续影响数量：${changedInfluencePoints}</p>
            <p>此次为重玩，默认不改变存档</p>
        ` : `
            <p>${objective_judge}</p>
            <p>桥段目标达成</p>
            <p>造成后续影响数量：${changedInfluencePoints}</p>
        `;

        document.getElementById('storyContent').innerHTML += resultText;

        // 保存HTML内容和完整记录
        const storyHtmlContent = document.getElementById('storyContent').innerHTML;

        disableInput();

        // 添加返回桥段选择按钮
        const completeButton = document.createElement('button');
        completeButton.className = 'button';
        completeButton.innerText = '返回桥段选择';
        completeButton.onclick = () => returnToSectionSelection();
        document.getElementById('storyContent').appendChild(completeButton);

        // 判断是否需要显示覆盖影响选项
        if (isReplay) {
            const overwriteButton = document.createElement('button');
            overwriteButton.className = 'button';
            overwriteButton.innerText = '覆盖原影响（不会锁后面的桥段）';
            overwriteButton.onclick = async () => {
                completeButton.style.display = 'none';
                overwriteButton.style.display = 'none';
                updateGameState(sectionId, {
                    objectiveAchieved: objective,
                    influencePoints
                });
                returnToSectionSelection();
            };
            document.getElementById('storyContent').appendChild(overwriteButton);
        }
        await storeSectionReview(sectionId, conversationHistory, storyHtmlContent);
    } else {
        // 当目标未达成时显示重新开始按钮
        const resultText = `
            <p>${objective_judge}</p>
            <p>桥段目标未达成</p>
            <p>造成后续影响数量：${changedInfluencePoints}</p>
            <p>因未达成目标，影响未产生</p>
        `;
        document.getElementById('storyContent').innerHTML += resultText;

        // 保存HTML内容和完整记录
        const storyHtmlContent = document.getElementById('storyContent').innerHTML;

        disableInput();

        const retryButton = document.createElement('button');
        retryButton.className = 'button';
        retryButton.innerText = '重新开始桥段';
        retryButton.onclick = () => restartSection(sectionId);
        document.getElementById('storyContent').appendChild(retryButton);

        // 存储桥段回顾记录
        await storeSectionReview(sectionId, conversationHistory, storyHtmlContent);
    }
}

function returnToSectionSelection() {
    document.getElementById('storyContainer').style.display = 'none';
    document.getElementById('sectionsContainer').style.display = 'flex';
    document.getElementById('storyContent').innerHTML = ''; // 清空故事内容用于下次显示
}

function checkUnlockConditions() {
    console.log('Checking Unlock Conditions');
    sectionsIndex.sections.forEach(section => {
        const allPreconditionsMet = section.preconditions.every(precondition => {
            const globalConditionMet = globalInfluencePoints.some(globalPoint => {
                const met = globalPoint.name === precondition.condition && globalPoint.influence === precondition.result;
                return met;
            });
            const sectionConditionMet = completedSections.some(comp => {
                const met = comp.sectionId === precondition.sectionId && comp.result.some(point => point.name === precondition.condition && point.influence === precondition.result);
                return met;
            });

            return globalConditionMet || sectionConditionMet;
        });

        if (allPreconditionsMet && !unlockedSections.includes(section.id)) {
            unlockedSections.push(section.id);
        }
    });

    console.log('Unlocked Sections:', unlockedSections);

    saveGame({
        currentSectionId: currentSectionId,
        completedSections,
        unlockedSections,
        globalInfluencePoints
    });

    setupSections();
}

function updateGameState(sectionId, result) {
    console.log('Updating game state:', { sectionId, result });

    const originalNameMapping = {};

    result.influencePoints.forEach((point, index) => {
        // 确保索引在currentSection.influencePoints的范围内
        if (index < currentSection.influencePoints.length) {
            const originalPointName = currentSection.influencePoints[index].name;
            originalNameMapping[point.name] = originalPointName;
        } else {
            // 当索引超出范围时，直接使用point.name作为映射的值
            originalNameMapping[point.name] = point.name;
        }
    });

    // 使用映射转换影响点别名
    const remappedInfluencePoints = result.influencePoints.map(point => ({
        name: originalNameMapping[point.name] || point.name,
        influence: point.influence
    }));

    const completedSectionIndex = completedSections.findIndex(section => section.sectionId === sectionId);

    if (completedSectionIndex !== -1) {
        completedSections[completedSectionIndex].result = remappedInfluencePoints;
    } else {
        completedSections.push({ sectionId, result: remappedInfluencePoints });
    }

    console.log('Completed Sections after update:', completedSections);

    remappedInfluencePoints.forEach(point => {
        if (point.global) {
            const globalPointIndex = globalInfluencePoints.findIndex(globalPoint => globalPoint.name === point.name);
            if (globalPointIndex !== -1) {
                if (!globalInfluencePoints[globalPointIndex].influence) {
                    globalInfluencePoints[globalPointIndex].influence = point.influence;
                }
            } else {
                globalInfluencePoints.push(point);
            }
        } else {
            let targetPoints = completedSections[completedSectionIndex]?.result;
            if (targetPoints) {
                const localPointIndex = targetPoints.findIndex(localPoint => localPoint.name === point.name);
                if (localPointIndex !== -1) {
                    targetPoints[localPointIndex].influence = point.influence;
                } else {
                    targetPoints.push(point);
                }
            }
        }
    });

    checkUnlockConditions();

    saveGame({
        currentSectionId: sectionId,
        completedSections,
        unlockedSections,
        globalInfluencePoints
    });

    setupSections();
}


function initializeGameState(savedData = null) {
    if (savedData) {
        currentSectionId = savedData.currentSectionId;
        completedSections = savedData.completedSections;
        unlockedSections = savedData.unlockedSections;
        globalInfluencePoints = savedData.globalInfluencePoints || [];
    } else {
        currentSectionId = null;
        completedSections = [];
        unlockedSections = [1];
        globalInfluencePoints = [];
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