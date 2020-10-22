/*
 * Use this one when building for GitHub Pages
*/
// module.exports = {
//   publicPath: process.env.NODE_ENV === 'production'
//     ? '/beyond-academy/'
//     : '/',
//   outputDir: 'docs'
// }

/*
 * Use this one when building for Flywire hosting
*/
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? ''
    : '/',
  outputDir: 'flywire-output'
}