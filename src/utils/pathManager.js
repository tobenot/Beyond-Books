export const getBasePath = () => {
  return process.env.NODE_ENV === 'development' ? '/assets' : '/vue/assets'
}
