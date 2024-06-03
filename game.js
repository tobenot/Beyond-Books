document.addEventListener('DOMContentLoaded', () => {
    // 初始显示设置
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';
    
    // 加载语言文件
    loadLanguageFile('zh-CN');
    
    // 加载章节索引
    loadSectionsIndex();
});

function loadLanguageFile(lang) {
    fetch(`lang/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            document.title = data.title;
            document.querySelector('h1').innerText = data.title;
            document.querySelector('button[onclick="startGame()"]').innerText = data.startButton;
            document.getElementById('sections').innerHTML = `<h2>${data.chooseSection}</h2>`;
            document.querySelector('button[onclick="readMore()"]').innerText = data.readMore;
            document.getElementById('freeChoice').placeholder = data.inputPlaceholder;
        })
        .catch(error => console.error('加载语言文件时出错:', error));
}

let sectionsIndex = {};

function loadSectionsIndex() {
    fetch('sections/sections.json')
        .then(response => response.json())
        .then(data => {
            sectionsIndex = data;
            setupSections();
        })
        .catch(error => console.error('加载章节索引时出错:', error));
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

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}

function chooseSection(fileName) {
    fetch(`sections/${fileName}`)
        .then(response => response.json())
        .then(section => {
            displaySection(section);
        })
        .catch(error => console.error('加载章节数据时出错:', error));
}

function displaySection(section) {
    document.getElementById('sections').style.display = 'none';
    const storyContent = section.content.map(paragraph => `<p>${paragraph}</p>`).join('');
    document.getElementById('storyContent').innerHTML = storyContent;
    document.getElementById('sectionImage').src = section.image;
    document.getElementById('story').style.display = 'flex';
}

function readMore() {
    document.getElementById('story').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}