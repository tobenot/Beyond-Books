import Vue from 'vue'
import VueI18n from 'vue-i18n'
import zhCN from '@/lang/zh-CN.json'

Vue.use(VueI18n)

export default new VueI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN
  }
})

// 在现有的 zhCN 对象中添加以下内容
const zhCN = {
  // ... 其他翻译
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
    apiKeyDisabled: 'API Key 已被禁用，因为正在使用公共 Key'
  }
}

const messages = {
  'zh-CN': {
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
    close: '关闭'
    // ... 其他翻译 ...
  }
}