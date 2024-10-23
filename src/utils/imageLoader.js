class ImageLoader {
  constructor() {
    this.loadedImages = new Set()
    this.loading = new Map()
  }

  async preloadImage(url) {
    if (this.loadedImages.has(url)) {
      return url
    }

    if (this.loading.has(url)) {
      return this.loading.get(url)
    }

    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.loadedImages.add(url)
        this.loading.delete(url)
        resolve(url)
      }
      img.onerror = () => {
        this.loading.delete(url)
        reject(new Error(`Failed to load image: ${url}`))
      }
      img.src = url
    })

    this.loading.set(url, loadPromise)
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
        console.error('Error preloading batch:', error)
      }
    }
  }

  isImageLoaded(url) {
    return this.loadedImages.has(url)
  }
}

export const imageLoader = new ImageLoader()
