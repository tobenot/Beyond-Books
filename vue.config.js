module.exports = {
  // Vue CLI 配置
  // 修改为实际的分支名
  publicPath: `/${process.env.VITE_BRANCH_NAME}/`,
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
