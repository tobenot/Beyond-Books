export const loadHtml2Canvas = async () => {
  if (typeof html2canvas === 'undefined') {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
}

export const showExportAlert = () => {
  const warningMessage = `
    注意：
    桌上剧团（跑团）中，玩家和主持人一样都是创作者。

    您正在导出游戏中的桥段记录。由于游戏中涉及的对话是由玩家输入和大语言模型生成的，开发者无法完全控制或监控所有生成的内容。如果您在正常游戏中发现任何不适当的内容，请随时与我们联系（B站私信或者找QQ群群主）。

    1. 大模型生成的内容不代表开发者的立场。
    2. 请尽量避免在对话中输入不符合设定的内容。
    
    感谢您的理解与合作，祝您游戏愉快！
  `
  return warningMessage
}
