module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/beyond-academy/'
      : '/',
    outputDir: 'docs'
  }