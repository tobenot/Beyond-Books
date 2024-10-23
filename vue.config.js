module.exports = {
  // Vue CLI 配置
  publicPath: process.env.VITE_BRANCH_NAME ? `/${process.env.VITE_BRANCH_NAME}/` : '/',
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
