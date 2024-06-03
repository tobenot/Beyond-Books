document.addEventListener('DOMContentLoaded', () => {
    // Initial display settings
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';

    // Load sections index
    loadSectionsIndex();
});

let sectionsIndex = {};

function loadSectionsIndex() {
    fetch('sections/sections.json')
        .then(response => response.json())
        .then(data => {
            sectionsIndex = data;
            setupSections();
        })
        .catch(error => console.error('Error loading sections index:', error));
}

function setupSections() {
    const sectionsContainer = document.getElementById('sections');
    sectionsContainer.innerHTML = '<h2>Select a Section</h2>';

    sectionsIndex.sections.forEach(section => {
        const button = document.createElement('button');
        button.className = 'button';
        button.innerText = section.title;
        button.onclick = () => chooseSection(section.file);

        const image = document.createElement('img');
        image.src = section.image;
        image.alt = `${section.title} thumbnail`;
        
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
        .catch(error => console.error('Error loading section data:', error));
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