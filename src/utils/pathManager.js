export const getBasePath = () => {
  const basePath = process.env.NODE_ENV === 'development' ? '/assets' : '/vue/assets';
  console.log('当前基础路径:', basePath);
  return basePath;
}
