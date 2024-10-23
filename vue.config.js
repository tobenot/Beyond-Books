module.exports = {
  // Vue CLI 配置
  publicPath: process.env.NODE_ENV === 'production'
    ? '/beyond-books-pages/'
    : '/',
  outputDir: 'dist',
  assetsDir: 'assets',
  productionSourceMap: false,
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  }
}
