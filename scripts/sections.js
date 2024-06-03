// scripts/sections.js

let sectionsIndex = {};

function loadLanguageFile(lang) {
    fetch(`lang/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            updateUIWithLanguage(data);
        })
        .catch(error => console.error('加载语言文件时出错:', error));
}

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