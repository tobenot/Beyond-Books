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

function isColorDark(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    return brightness < 128;
}

// 标记并高亮需要解释的名词
function highlightSpecialTerms(text, excludeTerm = '') {
    const terms = termsConfig.terms;
    const colors = colorsConfig.colors;

    const replacements = [];

    Object.keys(terms).forEach(term => {
        if (term === excludeTerm) return; // 跳过不需要高亮的术语
        const color = colors[terms[term].color] || terms[term].color; 
        const regex = new RegExp(term, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            const isDark = isColorDark(color); // 判断颜色是否较深
            const textShadow = isDark ? '-1px -1px 2px #222, 1px -1px 2px #222, -1px 1px 2px #222, 1px 1px 2px #222' : '-1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 1px 1px 2px #000';
            replacements.push({
                term: term,
                start: match.index,
                end: match.index + term.length,
                color: color,
                textShadow: textShadow
            });
        }
    });

    replacements.sort((a, b) => b.start - a.start);
    replacements.forEach(replacement => {
        text = text.slice(0, replacement.start) + 
            `<span class="special-term" style="font-weight: bold; color: ${replacement.color}; text-shadow: ${replacement.textShadow};" data-term="${replacement.term}">${replacement.term}</span>` + 
            text.slice(replacement.end);
    });

    return text;
}

function showTermDescription(event, description, imageUrl, term) {
    console.log("showTermDescription",description,imageUrl,term)
    const termTooltip = document.getElementById('term-tooltip');
    const highlightedDescription = highlightSpecialTerms(description, term);
    const imageHtml = imageUrl ? `<img id="term-tooltip-image" src="${imageUrl}" class="term-tooltip-image" alt="术语图片">` : '';

    termTooltip.innerHTML = `<span>${highlightedDescription}</span> ${imageHtml}`;

    termTooltip.style.display = 'block';
    termTooltip.style.minWidth = '150px';

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
    
    // 获取视口的宽高
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    
    // 计算浮框的位置相对于视口
    let top = event.clientY + 10;
    let left = event.clientX + 10;

    const thirdWidth = viewportWidth / 3;
    const cursorX = event.clientX;

    // 判断浮框展开方向
    if (cursorX <= thirdWidth) {
        // 在屏幕的左侧三分之一
        left = event.clientX + 10;
    } else if (cursorX >= 2 * thirdWidth) {
        // 在屏幕的右侧三分之一
        left = event.clientX - tooltipWidth - 10;
    } else {
        // 在屏幕的中间三分之一
        left = Math.max(10, (event.clientX - tooltipWidth / 2));
    }

    // 调整顶部边界
    if (top + tooltipHeight > viewportHeight) {
        top = viewportHeight - tooltipHeight - 10;
    }

    // 调整左边界，防止 tooltip 跑出屏幕外
    if (left < 0) {
        left = 10;
    } else if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 10;
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
        const { description, imageUrl } = termsConfig.terms[term];
        showTermDescription(event, description, imageUrl, term); // 传递术语
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