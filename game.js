document.addEventListener('DOMContentLoaded', () => {
    // Initial display settings
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';
});

function startGame() {
    // Show section selection menu, hide others
    document.getElementById('menu').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}

function chooseSection(sectionNumber) {
    // Show story content based on section number
    document.getElementById('sections').style.display = 'none';
    
    let storyContent = '';
    let imageUrl = '';
    if (sectionNumber === 1) {
        storyContent = "This is the beginning of your journey...\n\nYou have entered a mysterious forest...";
        imageUrl = "path/to/forest-image.jpg";  // Replace with actual image path
    } else if (sectionNumber === 2) {
        storyContent = "In the bustling city, you find yourself lost...\n\nThe city lights shimmer around you as you navigate through the streets...";
        imageUrl = "path/to/city-image.jpg";  // Replace with actual image path
    }
    
    document.getElementById('storyContent').innerText = storyContent;
    document.getElementById('sectionImage').src = imageUrl;
    document.getElementById('story').style.display = 'flex';
}

function readMore() {
    // Hide story content, show section selection menu
    document.getElementById('story').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}