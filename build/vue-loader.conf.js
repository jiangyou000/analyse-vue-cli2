'use strict'
const utils = require('./utils')
const config = require('../config')
const isProduction = process.env.NODE_ENV === 'production'
//是生产环境的话就使用前面的配置，这里这两种都是true，而且因为上面的配置这里一定是生产环境
const sourceMapEnabled = isProduction
  ? config.build.productionSourceMap
  : config.dev.cssSourceMap

//这里是vue-loader的配置具体见vue-loader的文档这里采用的是13.3的版本
//下面这些配置是旧版本的最新版的已经不是这样配置了
//没找到13版的文档，这里有个14版的做参考 https://vue-loader-v14.vuejs.org/zh-cn/
module.exports = {
  loaders: utils.cssLoaders({
    sourceMap: sourceMapEnabled,
    //这个extract是utils.cssLoaders函数中配置的抽取css
    extract: isProduction
  }),
  cssSourceMap: sourceMapEnabled,

  cacheBusting: config.dev.cacheBusting,

  //{ [tag: string]: string | Array<string> }  文档上有
  transformToRequire: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    // 默认配置会转换 <img> 标签上的 src 属性和 SVG 的 <image> 标签上的 xlink：href 属性。
    image: 'xlink:href'
  }
}
