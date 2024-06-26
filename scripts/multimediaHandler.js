function addMusicPlayer(sourceUrl) {
    const storyContentDiv = document.getElementById('storyContent');
    const playerContainer = document.createElement('div');
    playerContainer.style.width = '100%';
    let iframeSrc;

    if (sourceUrl.includes('bilibili.com')) {
        iframeSrc = sourceUrl;
        playerContainer.innerHTML = `<iframe src="${iframeSrc}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="false" style="width:100%; height:100%;"></iframe>`;
    } else if (sourceUrl.includes('music.163.com')) {
        iframeSrc = sourceUrl;
        playerContainer.innerHTML = `<iframe src="${iframeSrc}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="false" style="width:330px; height:86px;"></iframe>`;
    } else {
        console.error('Unsupported music source link');
        return;
    }

    storyContentDiv.appendChild(playerContainer);
    playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 调用示例
//addMusicPlayer("https://player.bilibili.com/player.html?isOutside=true&aid=515189599&bvid=BV1Gg411S78v&cid=823617666&p=1");
//addMusicPlayer("https://music.163.com/outchain/player?type=2&id=2097545136&auto=0&height=66");