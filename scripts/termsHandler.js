let termsConfig = {}; // 用于存储从配置文件加载的数据
let colorsConfig = {}; // 用于存储从色盘配置文件加载的数据

// 从配置文件中加载名词解释
async function loadTermsConfig() {
    try {
        const response = await fetch('lang/terms_explanations_zh-CN.json?v=' + new Date().getTime());
        termsConfig = await response.json();
        if (isCarrotTest()) console.log('Loaded terms config:', termsConfig);
    } catch (error) {
        console.error('加载名词配置文件时出错:', error);
    }
    preloadTermsImages();
}

// 从配置文件中加载色盘
async function loadColorsConfig() {
    try {
        const response = await fetch('config/colors.json?v=' + new Date().getTime());
        colorsConfig = await response.json();
        console.log('Loaded colors config:', colorsConfig);
    } catch (error) {
        console.error('加载色盘配置文件时出错:', error);
    }
}

// 标记并高亮需要解释的名词
function highlightSpecialTerms(text) {
    const terms = termsConfig.terms;
    const colors = colorsConfig.colors;

    // 用于存储所有需要替换的名词及其位置
    const replacements = [];

    // 遍历所有名词，记录其位置
    Object.keys(terms).forEach(term => {
        const color = colors[terms[term].color] || terms[term].color; // 从色盘中获取颜色，如果找不到则使用原始颜色名
        const regex = new RegExp(term, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            replacements.push({
                term: term,
                start: match.index,
                end: match.index + term.length,
                color: color
            });
        }
    });

    // 按照位置从后向前进行替换，避免干扰
    replacements.sort((a, b) => b.start - a.start);
    replacements.forEach(replacement => {
        text = text.slice(0, replacement.start) + 
            `<span class="special-term" style="font-weight: bold; color: ${replacement.color};" data-term="${replacement.term}">${replacement.term}</span>` + 
            text.slice(replacement.end);
    });

    return text;
}

function showTermDescription(event, description, imageUrl) {
    const termTooltip = document.getElementById('term-tooltip');
    const highlightedDescription = highlightSpecialTerms(description);
    const imageHtml = imageUrl ? `<img id="term-tooltip-image" src="${imageUrl}" class="term-tooltip-image" alt="术语图片">` : '';

    termTooltip.innerHTML = `<span>${highlightedDescription}</span> ${imageHtml}`;

    // 强制浏览器重绘，以确保 offsetWidth 和 offsetHeight 正确
    termTooltip.style.display = 'block';
    termTooltip.style.minWidth = '150px';
    
    // 初次设置位置
    setTooltipPosition(event);
    
    if (imageUrl) {
        const img = document.getElementById('term-tooltip-image');
        img.onload = () => setTooltipPosition(event);
    }
    
    document.addEventListener('click', function closeTooltip(e) {
        if (e.target !== termTooltip && !termTooltip.contains(e.target) && !e.target.classList.contains('special-term')) {
            termTooltip.style.display = 'none';
            document.removeEventListener('click', closeTooltip);
        }
    });
}

function setTooltipPosition(event) {
    const termTooltip = document.getElementById('term-tooltip');
    
    // 获取 termTooltip 的宽高
    const tooltipWidth = termTooltip.offsetWidth;
    const tooltipHeight = termTooltip.offsetHeight;
    
    // 获取 storyContainer 的位置和尺寸
    const storyContainer = document.getElementById('storyContainer');
    const containerRect = storyContainer.getBoundingClientRect();
    
    // 计算浮框的位置相对于 storyContainer
    let top = event.clientY - containerRect.top + 10;
    let left = event.clientX - containerRect.left + 10;

    const containerWidth = storyContainer.clientWidth;
    const containerHeight = storyContainer.clientHeight;

    const thirdWidth = document.documentElement.clientWidth / 3;
    const cursorX = event.clientX;

    // 判断浮框展开方向
    if (cursorX <= thirdWidth) {
        // 在屏幕的左侧三分之一
        left = event.clientX - containerRect.left + 10;
    } else if (cursorX >= 2 * thirdWidth) {
        // 在屏幕的右侧三分之一
        left = event.clientX - containerRect.left - tooltipWidth - 10;
    } else {
        // 在屏幕的中间三分之一
        left = Math.max(10, (event.clientX - containerRect.left - tooltipWidth / 2));
    }

    // 调整顶部边界
    if (top + tooltipHeight > containerHeight) {
        top = containerHeight - tooltipHeight - 10;
    }

    termTooltip.style.top = `${top}px`;
    termTooltip.style.left = `${left}px`;
}

// 初始化解释框元素并添加到文档中
const termTooltip = document.createElement('div');
termTooltip.id = 'term-tooltip';
document.body.appendChild(termTooltip);

// 监听特殊词汇的点击事件
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('special-term')) {
        const term = event.target.getAttribute('data-term');
        const { description, imageUrl } = termsConfig.terms[term]; // 获取描述和图片URL
        showTermDescription(event, description, imageUrl); // 传递描述和图片URL
    }
});

async function preloadTermsImages() {
    const imageUrls = [];

    // 遍历 termsConfig，收集所有的 imageUrl
    Object.values(termsConfig.terms).forEach(term => {
        if (term.imageUrl) {
            imageUrls.push(term.imageUrl);
        }
    });

    // 创建一个 Promise 数组，用于异步加载所有图片
    const loadPromises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        });
    });

    try {
        // 等待所有图片加载完成
        await Promise.all(loadPromises);
        console.log('All images preloaded successfully');
    } catch (error) {
        console.error('Error preloading images:', error);
    }
}