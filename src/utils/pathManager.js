export const getBasePath = () => {
  const basePath = process.env.NODE_ENV === 'development' ? '/assets' : '/vue/assets';
  return basePath;
}
