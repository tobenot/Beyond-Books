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

    Object.keys(terms).forEach(term => {
        const color = colors[terms[term].color] || terms[term].color; // 从色盘中获取颜色，如果找不到则使用原始颜色名
        const regex = new RegExp(term, 'g');
        
        // 修改高亮词的 HTML 结构，增加 click 事件处理函数
        text = text.replace(regex, `<span class="special-term" style="font-weight: bold; color: ${color};" data-description="${terms[term].description}">${term}</span>`);
    });

    return text;
}

// 显示特定名词的解释浮框
function showTermDescription(event, description) {
    const termTooltip = document.getElementById('term-tooltip');
    
    // 高亮浮框内的文字
    const highlightedDescription = highlightSpecialTerms(description);
    termTooltip.innerHTML = `<span>${highlightedDescription}</span>`;
    
    // 设置浮框样式
    termTooltip.style.position = 'absolute';
    termTooltip.style.zIndex = '9999'; // 确保浮框在最上层
    termTooltip.style.padding = '10px';
    termTooltip.style.backgroundColor = '#fff';
    termTooltip.style.border = '1px solid #ccc';
    termTooltip.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    termTooltip.style.maxWidth = '200px'; // 限制最大宽度
    termTooltip.style.wordWrap = 'break-word'; // 自动换行
    
    // 计算浮框的位置
    let top = event.clientY + 10;
    let left = event.clientX + 10;
    
    // 获取视窗的宽度和高度
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 浮框的宽度和高度
    const tooltipWidth = termTooltip.offsetWidth;
    const tooltipHeight = termTooltip.offsetHeight;
    
    // 调整浮框的位置，确保不会超出视窗边界
    if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 10;
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
termTooltip.style.display = 'none';
document.body.appendChild(termTooltip);

// 监听特殊词汇的点击事件
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('special-term')) {
        const description = event.target.getAttribute('data-description');
        showTermDescription(event, description);
    }
});