import html2canvas from 'html2canvas'

export function exportAsHTML(content, filename) {
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportAsImage(element, filename) {
  const canvas = await html2canvas(element)
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export async function exportAsMultipleImages(element, filename, maxHeight = 1000) {
  const fullCanvas = await html2canvas(element)
  const fullHeight = fullCanvas.height
  const width = fullCanvas.width

  for (let i = 0; i < fullHeight; i += maxHeight) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = Math.min(maxHeight, fullHeight - i)
    const context = canvas.getContext('2d')
    context.drawImage(fullCanvas, 0, i, width, canvas.height, 0, 0, width, canvas.height)
    
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${i / maxHeight + 1}.png`
    a.click()
  }
}
