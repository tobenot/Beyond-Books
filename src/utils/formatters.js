import { highlightSpecialTerms } from '@/utils/termsHandler'

export function formatContent(role, content) {
  if (!content) {
    console.error('formatContent 内容为空')
    return ''
  }
  
  if (role === 'user') {
    return `<br><i>${content}</i><br><br>`
  } else if (role === 'centered') {
    return content
  } else {
    const formattedContent = content.replace(/\n/g, '<br>')
    return highlightSpecialTerms(formattedContent)
  }
}
