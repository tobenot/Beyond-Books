import re
import os
import cssutils
import logging

# 禁用cssutils的警告日志
cssutils.log.setLevel(logging.CRITICAL)

def split_css(input_file, output_dir):
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 定义新的CSS文件分类
    css_files = {
        'reset.css': ['body', 'html', '*'],
        'layout.css': ['#app', '.container', '.text-container', '.image-container', '.controls', '.menu-controls', '.control-pair'],
        'typography.css': ['h1', 'h2', 'p', '.footer'],
        'components.css': ['.button', '.message', '.loader', '#loadingBar', '#progress', '.loaderSpin', '.modal', '.special-term', '#term-tooltip'],
        'forms.css': ['input', 'select', 'textarea', '.settings-input'],
        'utilities.css': ['.hidden', '.visible', '.clearfix'],
        'animations.css': ['@keyframes'],
        'responsive.css': ['@media'],
        'sections.css': ['#sectionsContainer', '#sections', '.section', '.chapter', '.storyContainer'],
        'settings.css': ['#settings', '#settingsContainer'],
        'review.css': ['#reviewContainer', '#reviewDetailContainer'],
        'interaction.css': ['.interaction-stage', '.suggestions-container', '.suggestion']
    }

    # 读取CSS文件
    with open(input_file, 'r', encoding='utf-8') as f:
        css_content = f.read()

    # 解析CSS
    stylesheet = cssutils.parseString(css_content)

    # 处理每个CSS文件
    for file_name, selectors in css_files.items():
        content = []
        for rule in stylesheet.cssRules:
            if isinstance(rule, cssutils.css.CSSStyleRule):
                if any(selector.selectorText.startswith(tuple(selectors)) for selector in rule.selectorList):
                    content.append(rule.cssText)
            elif isinstance(rule, cssutils.css.CSSMediaRule) and file_name == 'responsive.css':
                content.append(rule.cssText)
            elif file_name == 'animations.css' and rule.cssText.strip().startswith('@keyframes'):
                content.append(rule.cssText)

        if content:
            with open(os.path.join(output_dir, file_name), 'w', encoding='utf-8') as f:
                f.write('\n\n'.join(content))

    # 处理剩余的CSS内容
    remaining_content = []
    for rule in stylesheet.cssRules:
        if not any(rule.cssText in open(os.path.join(output_dir, f), 'r', encoding='utf-8').read() for f in css_files.keys() if os.path.exists(os.path.join(output_dir, f))):
            remaining_content.append(rule.cssText)

    if remaining_content:
        with open(os.path.join(output_dir, 'remaining.css'), 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(remaining_content))

    print("CSS拆分完成。")

# 使用脚本
split_css('css/base.css', 'css/split')