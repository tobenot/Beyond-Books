// 部署相关的全局配置
export const DEPLOY_CONFIG = {
  // 部署的基础路径，与分支名保持一致
  BASE_PATH: '/vue/',  // 根据实际部署的分支名修改
  
  // 资源路径前缀
  ASSETS_PREFIX: '/vue/',  // 与 BASE_PATH 保持一致
  
  // API 基础路径（如果有的话）
  API_BASE_URL: process.env.NODE_ENV === 'development' 
    ? '/' 
    : '/vue/'
}
