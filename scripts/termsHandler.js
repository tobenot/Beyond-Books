let termsConfig = {};
let colorsConfig = {};

const BASE_URL = process.env.VUE_APP_BASE_URL || '';

async function loadTermsConfig() {
    try {
        const response = await fetch(`/assets/config/terms_explanations_zh-CN.json?v=${new Date().getTime()}`);
        termsConfig = await response.json();
        if (isCarrotTest()) console.log('Loaded terms config:', termsConfig);
    } catch (error) {
        console.error('加载名词配置文件时出错:', error);
    }
    preloadTermsImages();
}

async function loadColorsConfig() {
    try {
        const response = await fetch('/assets/config/colors.json?v=' + new Date().getTime());
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

function highlightSpecialTerms(text, excludeTerm = '') {
    const terms = termsConfig.terms;
    const colors = colorsConfig.colors;
    const replacements = [];
    const cooldownLimit = 2;
    const termOccurrences = {};

    Object.keys(terms).forEach(term => {
        if (term === excludeTerm) return;

        const color = colors[terms[term].color] || terms[term].color; 
        const regex = new RegExp(term, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            termOccurrences[term] = (termOccurrences[term] || 0) + 1;

            if (termOccurrences[term] <= cooldownLimit) {
                const isDark = isColorDark(color);
                const textShadow = isDark ? '-1px -1px 2px #222, 1px -1px 2px #222, -1px 1px 2px #222, 1px 1px 2px #222' : '-1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 1px 1px 2px #000';
                replacements.push({
                    term: term,
                    start: match.index,
                    end: match.index + term.length,
                    color: color,
                    textShadow: textShadow
                });
            }
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
    
    const tooltipWidth = termTooltip.offsetWidth;
    const tooltipHeight = termTooltip.offsetHeight;
    
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    
    let top = event.clientY + 10;
    let left = event.clientX + 10;

    const thirdWidth = viewportWidth / 3;
    const cursorX = event.clientX;

    if (cursorX <= thirdWidth) {
        left = event.clientX + 10;
    } else if (cursorX >= 2 * thirdWidth) {
        left = event.clientX - tooltipWidth - 10;
    } else {
        left = Math.max(10, (event.clientX - tooltipWidth / 2));
    }

    if (top + tooltipHeight > viewportHeight) {
        top = viewportHeight - tooltipHeight - 10;
    }

    if (left < 0) {
        left = 10;
    } else if (left + tooltipWidth > viewportWidth) {
        left = viewportWidth - tooltipWidth - 10;
    }

    termTooltip.style.top = `${top}px`;
    termTooltip.style.left = `${left}px`;
}

const termTooltip = document.createElement('div');
termTooltip.id = 'term-tooltip';
document.body.appendChild(termTooltip);

document.addEventListener('click', function (event) {
    if (event.target.classList.contains('special-term')) {
        const term = event.target.getAttribute('data-term');
        const { description, imageUrl } = termsConfig.terms[term];
        showTermDescription(event, description, imageUrl, term);
    }
});

async function preloadTermsImages(batchSize = 5, delay = 1000) {
    const imageUrls = [];

    Object.values(termsConfig.terms).forEach(term => {
        if (term.imageUrl) {
            imageUrls.push(term.imageUrl);
        }
    });

    for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);
        const loadPromises = batch.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(url);
                img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            });
        });

        try {
            await Promise.all(loadPromises);
            console.log(`Batch ${Math.floor(i / batchSize) + 1} preloaded successfully`);
        } catch (error) {
            console.error('Error preloading images:', error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log('All images preloaded successfully');
}
