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

// 显示特定名词的解释浮框
function showTermDescription(event, description) {
    const termTooltip = document.getElementById('term-tooltip');
    
    // 高亮浮框内的文字
    const highlightedDescription = highlightSpecialTerms(description);
    termTooltip.innerHTML = `<span>${highlightedDescription}</span>`;
    
    // 计算浮框的位置
    let top = event.clientY + 10;
    let left = event.clientX + 10;
    
    // 获取视窗的宽度和高度
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 设置浮框的最小宽度
    termTooltip.style.minWidth = '150px';  // 可以根据需要调整
    
    // 浮框的宽度和高度
    const tooltipWidth = termTooltip.offsetWidth;
    const tooltipHeight = termTooltip.offsetHeight;
    
    // 调整浮框的位置，确保不会超出视窗边界
    if (left + tooltipWidth > viewportWidth) {
        // 设置一个最大左边界，确保浮框不会太窄
        left = Math.max(10, viewportWidth - tooltipWidth - 10);
    }
    if (top + tooltipHeight > viewportHeight) {
        top = viewportHeight - tooltipHeight - 10;
    }
    
    termTooltip.style.top = `${top}px`;
    termTooltip.style.left = `${left}px`;
    termTooltip.style.display = 'block';

    // 点击浮框外部自动关闭
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
        const description = termsConfig.terms[term].description;
        showTermDescription(event, description);
    }
});