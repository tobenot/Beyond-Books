let termsConfig = {}; // 用于存储从配置文件加载的数据
let colorsConfig = {}; // 用于存储从色盘配置文件加载的数据

// 从配置文件中加载名词解释
async function loadTermsConfig() {
    try {
        const response = await fetch('lang/terms_explanations_zh-CN.json?v=' + new Date().getTime());
        termsConfig = await response.json();
        console.log('Loaded terms config:', termsConfig);
    } catch (error) {
        console.error('加载名词配置文件时出错:', error);
    }
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
    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="term-tooltip-image" alt="角色立绘">` : '';

    termTooltip.innerHTML = `<span>${highlightedDescription}</span> ${imageHtml}`;
    
    // 计算浮框的位置
    let top = event.clientY + 10;
    let left = event.clientX + 10;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    termTooltip.style.minWidth = '150px';

    const tooltipWidth = termTooltip.offsetWidth;
    const tooltipHeight = termTooltip.offsetHeight;
    
    if (left + tooltipWidth > viewportWidth) {
        left = Math.max(10, viewportWidth - tooltipWidth - 10);
    }

    // 调整浮框展开方向
    if ((event.clientX / viewportWidth) > 0.5) {
        left = event.clientX - tooltipWidth - 10;
    } else {
        left = event.clientX + 10;
    }

    if (top + tooltipHeight > viewportHeight) {
        top = viewportHeight - tooltipHeight - 10;
    }
    
    termTooltip.style.top = `${top}px`;
    termTooltip.style.left = `${left}px`;
    termTooltip.style.display = 'block';

    document.addEventListener('click', function closeTooltip(e) {
        if (e.target !== termTooltip && !termTooltip.contains(e.target) && !e.target.classList.contains('special-term')) {
            termTooltip.style.display = 'none';
            document.removeEventListener('click', closeTooltip);
        }
    });
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