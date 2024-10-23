module.exports = {
  // Vue CLI 配置
  publicPath: process.env.NODE_ENV === 'production'
    ? '/' + process.env.BRANCH_NAME + '/'
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
