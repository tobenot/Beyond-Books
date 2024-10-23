import { ref } from 'vue'

// 状态管理
const termsConfig = ref({})
const colorsConfig = ref({})

// 加载配置
export async function loadTermsConfig() {
  try {
    const response = await fetch('lang/terms_explanations_zh-CN.json?v=' + new Date().getTime())
    termsConfig.value = await response.json()
    if (process.env.NODE_ENV === 'development') {
      console.log('Loaded terms config:', termsConfig.value)
    }
  } catch (error) {
    console.error('加载名词配置文件时出错:', error)
  }
  preloadTermsImages()
}

export async function loadColorsConfig() {
  try {
    const response = await fetch('config/colors.json?v=' + new Date().getTime())
    colorsConfig.value = await response.json()
    console.log('Loaded colors config:', colorsConfig.value)
  } catch (error) {
    console.error('加载色盘配置文件时出错:', error)
  }
}

// 工具函数
function isColorDark(color) {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
  return brightness < 128
}

// 高亮处理
export function highlightSpecialTerms(text, excludeTerm = '') {
  const terms = termsConfig.value.terms
  const colors = colorsConfig.value.colors
  const replacements = []
  const cooldownLimit = 2
  const termOccurrences = {}

  Object.keys(terms).forEach(term => {
    if (term === excludeTerm) return

    const color = colors[terms[term].color] || terms[term].color
    const regex = new RegExp(term, 'g')
    let match
    while ((match = regex.exec(text)) !== null) {
      termOccurrences[term] = (termOccurrences[term] || 0) + 1

      if (termOccurrences[term] <= cooldownLimit) {
        const isDark = isColorDark(color)
        const textShadow = isDark ? 
          '-1px -1px 2px #222, 1px -1px 2px #222, -1px 1px 2px #222, 1px 1px 2px #222' : 
          '-1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 1px 1px 2px #000'
        replacements.push({
          term: term,
          start: match.index,
          end: match.index + term.length,
          color: color,
          textShadow: textShadow
        })
      }
    }
  })

  replacements.sort((a, b) => b.start - a.start)
  replacements.forEach(replacement => {
    text = text.slice(0, replacement.start) + 
      `<span class="special-term" style="font-weight: bold; color: ${replacement.color}; text-shadow: ${replacement.textShadow};" data-term="${replacement.term}">${replacement.term}</span>` + 
      text.slice(replacement.end)
  })

  return text
}

// 图片预加载
async function preloadTermsImages(batchSize = 5, delay = 1000) {
  const imageUrls = []

  Object.values(termsConfig.value.terms).forEach(term => {
    if (term.imageUrl) {
      imageUrls.push(term.imageUrl)
    }
  })

  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize)
    const loadPromises = batch.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(url)
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      })
    })

    try {
      await Promise.all(loadPromises)
      console.log(`Batch ${Math.floor(i / batchSize) + 1} preloaded successfully`)
    } catch (error) {
      console.error('Error preloading images:', error)
    }

    await new Promise(resolve => setTimeout(resolve, delay))
  }

  console.log('All images preloaded successfully')
}
