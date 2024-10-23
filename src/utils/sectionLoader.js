import CryptoJS from 'crypto-js'
import { getBasePath } from './pathManager'

const SECRET_KEY = 'ReadingThisIsASpoilerForYourself'

export async function loadSectionsIndex() {
  try {
    const basePath = getBasePath()
    const response = await fetch(`${basePath}/sections/sections.bbs?v=${new Date().getTime()}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const encryptedText = await response.text()
    return decryptJSONText(encryptedText, SECRET_KEY)
  } catch (error) {
    console.error('加载章节索引失败:', error)
    throw new Error('加载章节失败，请检查网络连接或刷新页面重试')
  }
}

export async function loadSectionData(fileName) {
  const basePath = getBasePath()
  const response = await fetch(`${basePath}/sections/${fileName}?v=${new Date().getTime()}`)
  const encryptedText = await response.text()
  return decryptJSONText(encryptedText, SECRET_KEY)
}

function decryptJSONText(encryptedText, secretKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey)
  const decryptedText = bytes.toString(CryptoJS.enc.Utf8)

  try {
    return JSON.parse(decryptedText)
  } catch (error) {
    console.error('解析JSON时出错:', error.message)
    throw error
  }
}
