import { getBasePath } from './pathManager'

class ImageLoader {
  constructor() {
    this.loadedImages = new Set()
    this.loading = new Map()
    this.basePath = getBasePath()
  }

  getFullUrl(url) {
    // 如果是完整的URL（以http开头）或者已经包含basePath，则直接返回
    if (url.startsWith('http') || url.startsWith(this.basePath)) {
      return url
    }
    // 确保url开头没有多余的斜杠
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url
    return `${this.basePath}/${cleanUrl}`
  }

  async preloadImage(url) {
    const fullUrl = this.getFullUrl(url)
    
    if (this.loadedImages.has(fullUrl)) {
      return fullUrl
    }

    if (this.loading.has(fullUrl)) {
      return this.loading.get(fullUrl)
    }

    const loadPromise = fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load image: ${fullUrl}`)
        }
        this.loadedImages.add(fullUrl)
        this.loading.delete(fullUrl)
        return fullUrl
      })
      .catch(error => {
        this.loading.delete(fullUrl)
        throw error
      })

    this.loading.set(fullUrl, loadPromise)
    return loadPromise
  }

  async preloadBatch(urls, batchSize = 3, delay = 1000) {
    const batches = []
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      batches.push(batch)
    }

    for (const batch of batches) {
      try {
        await Promise.all(batch.map(url => this.preloadImage(url)))
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        // 移除 console.error
      }
    }
  }

  isImageLoaded(url) {
    const fullUrl = this.getFullUrl(url)
    return this.loadedImages.has(fullUrl)
  }
}

export const imageLoader = new ImageLoader()
