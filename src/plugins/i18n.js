import { createI18n } from 'vue-i18n'

const zhCN = {
  settings: {
    title: '设置',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: '输入你的API Key',
    apiUrlLabel: 'API URL',
    apiUrlPlaceholder: '输入API URL',
    advancedModelLabel: '进阶模型 (用于桥段总结)',
    basicModelLabel: '基本模型 (用于其他操作)',
    saveButton: '保存设置',
    publicKeyButton: '获取公共key',
    resetButton: '恢复默认设置',
    helpButton: '这是什么？',
    savedMessage: '设置已保存',
    publicKeyFetched: '公共 Key 已成功获取并保存',
    resetMessage: '设置已恢复默认',
    helpTitle: '帮助信息',
    helpContent: `
      <p>本游戏<strong>基于</strong>可访问<strong>大语言模型</strong>的接口API进行，您可自行寻找相关API服务，默认API地址不构成推荐建议</p>
      <p>第一次打开游戏网页时会自动尝试获取公共key，所以您可能直接开始游戏就可以游玩了。</p>
      <p>公共key是作者买来给大家玩的</p>
      <p>如遇无法输入API KEY，可以刷新网页</p>
    `,
    publicKeyFetchFailed: '获取公共 Key 失败，请检查网络连接或稍后再试',
    apiKeyDisabled: 'API Key 已被禁用，因为正在使用公共 Key',
    text: '设置' // 添加菜单项的翻译
  },
  reviewTitle: '桥段回顾',
  returnToMenu: '返回主菜单',
  noReviewRecords: '暂无桥段回顾记录。',
  rename: '重命名',
  delete: '删除',
  viewDetails: '查看详情',
  reviewDetails: '回顾详情',
  exportAsHTML: '导出为HTML',
  exportAsImage: '导出为长图',
  exportAsMultipleImages: '导出为多图',
  enterNewTitle: '请输入新的标题',
  confirmDelete: '您确定要删除这条回顾记录吗？',
  close: '关闭',
  newGame: '开始新游戏',
  continueGame: '继续游戏',
  reviewRecords: '回顾记录',
  importSave: '导入存档',
  exportSave: '导出存档',
  deleteSave: '删除存档',
  confirmImport: '您确定要导入并覆盖存档吗？此操作无法撤销。您可以先导出自己的存档进行备份。',
  success: '成功',
  error: '错误',
  importSuccess: '存档已成功导入',
  tutorial: {
    title: '游戏教程',
    close: '关闭',
    understand: '我明白了',
    // 将HTML内容移到专门的raw对象中
    raw: {
      content: `
        <p>你可以把本游戏理解为<strong>跑团（DND或COC）</strong>、<strong>语C</strong>、<strong>剧本杀</strong>或<strong>过家家</strong>🧑‍🤝‍🧑。本游戏制作时面向的玩家是<strong>喜欢剧情向游戏</strong>，愿意<strong>认真扮演角色</strong>🎭  的语C、跑团玩家👥。</p>
        <ol>
          <li>📝 <strong>目标</strong>：在每一个桥段里，你需要完成<strong>桥段目标</strong>🎯，目标可能是<strong>沟通</strong>💬、<strong>战斗</strong>⚔️、<strong>解密</strong>🧩等。</li>
          <li>🎮 <strong>操作</strong>：根据你的人设和起始事件，在对话框中打字输入以<strong>你的角色的角度</strong>进行的行动、说的话🗣️。比如输入"我挥起武器说，与我何干！"，不需要特别注意格式</li>
          <li>💡 <strong>技巧</strong>：很多角色有<strong>超能力</strong>🔮，比如银月篇主角罗伯特，可以<strong>减缓时间流速</strong>🕰️，你可以接住敌方扔来的飞刀扔回去🗡️，也能准确地瞄准你要攻击的物件🎯，只要你能想到。</li>
        </ol>
        <ul>
          <li>⚠️ <strong>注意</strong>：如果出现输入之后无回复，可以回<strong>主菜单-设置</strong>⚙️里面点"<strong>恢复默认设置</strong>🔄"。一般是初始化的网络问题🌐。</li>
          <li>🔍 <strong>注意</strong>：高亮有颜色的文字可以点🔗。</li>
          <li>📜 <strong>注意</strong>：在<strong>桥段剧本</strong>之外，主持人给出的信息不完全保真（比如问队友问题，可能会得到不正确的回复🤔），可以完全取信的是非大模型的<strong>桥段剧本</strong>、<strong>初始事件</strong>、<strong>词条解释</strong>。</li>
        </ul>
      `
    }
  },
  "exportHTML": "导出HTML",
  "exportImage": "导出长图",
  "exportMultipleImages": "导出多图"
}

// 添加英文版本示例
const enUS = {
  tutorial: {
    title: 'Game Tutorial',
    close: 'Close',
    understand: 'I Understand',
    raw: {
      content: `
        <p>You can think of this game as <strong>TRPG (DND/COC)</strong>, <strong>Role-playing</strong>, or <strong>Murder Mystery</strong> 🧑‍🤝‍🧑...</p>
        <!-- 英文版的HTML内容 -->
      `
    }
  }
  // ... 其他英文翻译
}

export default createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})
