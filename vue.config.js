module.exports = {
  // Vue CLI 配置
  publicPath: process.env.NODE_ENV === 'production' ? '/vue/' : '/',
  outputDir: 'dist',
  assetsDir: 'assets',
  productionSourceMap: false,
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  },
  chainWebpack: config => {
    config
      .plugin('copy')
      .tap(args => {
        args[0].patterns.push({
          from: 'public/config',
          to: 'assets/config'
        })
        return args
      })
  }
}
