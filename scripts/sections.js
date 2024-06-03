// scripts/sections.js

let sectionsIndex = {};

// Decryption function
function decryptJSONText(encryptedText, secretKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
}

// Load and decrypt sections.bbs
function loadSectionsIndex() {
    fetch('sections/sections.bbs')
        .then(response => response.text())
        .then(encryptedText => {
            const secretKey = 'ReadingThisIsASpoilerForYourself';
            const sectionsData = decryptJSONText(encryptedText, secretKey);
            sectionsIndex = sectionsData;
            setupSections();
        })
        .catch(error => console.error('Error loading or decrypting sections index:', error));
}

function setupSections() {
    const sectionsContainer = document.getElementById('sections');
    sectionsContainer.innerHTML = '<h2>选择章节</h2>';

    sectionsIndex.sections.forEach(section => {
        const button = document.createElement('button');
        button.className = 'button';
        button.innerText = section.title;
        button.onclick = () => chooseSection(section.file);

        const image = document.createElement('img');
        image.src = section.image;
        image.alt = `${section.title} 缩略图`;

        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.appendChild(image);
        sectionDiv.appendChild(button);

        sectionsContainer.appendChild(sectionDiv);
    });
}

// Function to choose and decrypt section
function chooseSection(fileName) {
    fetch(`sections/${fileName}`)
        .then(response => response.text()) // Ensure to read as text instead of directly as JSON
        .then(encryptedText => {
            const secretKey = 'ReadingThisIsASpoilerForYourself';  // Use the same key as used in encryption
            const sectionContent = decryptJSONText(encryptedText, secretKey);
            displaySection(sectionContent);
        })
        .catch(error => console.error('Error loading or decrypting section data:', error));
}

function displaySection(section) {
    document.getElementById('sections').style.display = 'none';
    const storyContent = section.content.map(paragraph => `<p>${paragraph}</p>`).join('');
    document.getElementById('storyContent').innerHTML = storyContent;
    document.getElementById('sectionImage').src = section.image;
    document.getElementById('story').style.display = 'flex';
}

// Initialization function to be called once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupInitialView();

    // Load language file
    loadLanguageFile('zh-CN');

    // Load and decrypt sections index
    loadSectionsIndex();
});

function loadLanguageFile(lang) {
    fetch(`lang/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            updateUIWithLanguage(data);
        })
        .catch(error => console.error('加载语言文件时出错:', error));
}

function setupInitialView() {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';
}

function updateUIWithLanguage(data) {
    document.title = data.title;
    document.getElementById('mainTitle').innerText = data.mainTitle;
    document.getElementById('subTitle').innerText = data.subTitle;
    document.querySelector('button[onclick="startGame()"]').innerText = data.startButton;
    document.getElementById('sections').innerHTML = `<h2>${data.chooseSection}</h2>`;
    document.querySelector('button[onclick="readMore()"]').innerText = data.readMore;
    document.getElementById('freeChoice').placeholder = data.inputPlaceholder;
}