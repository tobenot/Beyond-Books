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

    fetch(`sections/${fileName}`)
        .then(response => response.text())
        .then(encryptedText => {
            const secretKey = 'ReadingThisIsASpoilerForYourself';
            const sectionContent = decryptJSONText(encryptedText, secretKey);
            if (!sectionContent.outcomes) {
                sectionContent.outcomes = []; // Set to empty array if undefined
            }
            displaySection(sectionContent);
        })
        .catch(error => console.error('加载或解密章节数据时出错:', error));
}

function displaySection(section) {
    document.getElementById('sections').style.display = 'none';

    const storyContent = section.content.map(paragraph => `<p>${paragraph}</p>`).join('');
    document.getElementById('storyContent').innerHTML = storyContent;
    document.getElementById('sectionImage').src = section.image;

    const controls = document.querySelector('.controls');
    controls.innerHTML = '';

    if (section.outcomes && section.outcomes.length > 0) {
        section.outcomes.forEach(outcome => {
            const button = document.createElement('button');
            button.className = 'button';
            button.innerText = outcome.title;
            button.onclick = () => handleOutcome(section.id, outcome.result);
            controls.appendChild(button);
        });
    } else {
        const readMoreButton = document.createElement('button');
        readMoreButton.className = 'button';
        readMoreButton.innerText = "阅读完成";
        readMoreButton.onclick = () => readMore();
        controls.appendChild(readMoreButton);
    }

    document.getElementById('story').style.display = 'flex';
}

function handleOutcome(sectionId, result) {
    updateGameState(sectionId, result);
    readMore();
}

function updateGameState(sectionId, result) {
    completedSections.push({ sectionId, result });

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