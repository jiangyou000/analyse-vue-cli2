'use strict'
const path = require('path')
const config = require('../config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const packageConfig = require('../package.json')

exports.assetsPath = function (_path) {
  //两个环境下都是static
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory
    //path.posix介绍http://nodejs.cn/api/path.html#path_windows_vs_posix
    //posix介绍 https://zh.wikipedia.org/wiki/POSIX
    //POSIX是unix系统上一种标准，这里path.posix可以在任何操作系统上把POSIX 文件路径处理成一致的结果
    //也就是返回static/_path
  return path.posix.join(assetsSubDirectory, _path)
}

exports.cssLoaders = function (options) {

  //如果没有传入options就设置为{}
  options = options || {}

  const cssLoader = {
    loader: 'css-loader',
    options: {
      //是否启用sourceMap，接受Boolean值
      sourceMap: options.sourceMap
    }
  }

  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      //同上
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    //函数接收两个参数一个是loader类型字符串，一个是loader配置{}对象
    //dev.config中utils.styleLoaders函数options中传入了一个usePostCSS: true
    //故这里loader为包含了两个loader配置对象的数组
    const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

    if (loader) {
      //该函数默认只配置了cssloader和postcssLoader其他loader需要传入配置
      loaders.push({
        loader: loader + '-loader',
        //传入配置
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    //配置css是否需要抽离出来，生产环境中需要这项配置
    //这里是ExtractTextPlugin的配置
    if (options.extract) {
      //如果options.extract为真该函数返回的是一个对象数组，用于use后面的配置
      return ExtractTextPlugin.extract({
        //这里的配置不太明白
        fallback: 'vue-style-loader',//当css没有被抽取时使用该loader，该loader类似style-loader
        use: loaders//必填,将资源转换成一个css导出块
      })
    }else{
      //这里返回的是一个数组，该数组第一个值为vue-style-loader
      return ['vue-style-loader'].concat(loaders)
    }
  }
  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    // 返回的是一个象{css:[],postcss:[],less:[]...}这种样子
    //将各种css相关loader单独分离出来，通过调用函数配置
    css: generateLoaders(),
    postcss: generateLoaders(),
    //比如下面less会返回
    /**
     * 不抽离css情况下
    [
      'vue-style-loader',
      { loader: 'css-loader', options: { sourceMap: true} },
      { loader: 'postcss-loader', options: { sourceMap: true} },
      { loader: 'less-loader', options: { sourceMap: true} },
    ]
    抽离css情况下
    其实返回的是一个use配置，打印出来如下
    [ 
      { loader:'C:\\Users\\lipf3\\Desktop\\vueclioldsimple\\node_modules\\extract-text-webpack-plugin\\dist\\loader.js',options: { omit: 1, remove: true } },
      { loader: 'vue-style-loader' },
      { loader: 'css-loader', options: { sourceMap: true } },
      { loader: 'postcss-loader', options: { sourceMap: true } },
      { loader: 'less-loader', options: { sourceMap: true } } 
    ]
     */
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  /**
   * 由返回值可知该函数是module中的rules，故应该返回一个数组
   */
  //先定义一个空数组
  const output = []
  //loaders是cssLoaders返回的rules loader配置数组
  const loaders = exports.cssLoaders(options)

  //循环出来添加规则
  for (const extension in loaders) {
    // console.log(extension)
    const loader = loaders[extension]
    //将loader数组中的每一个use配置添加test匹配规则后push到output中
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }

  //输出配置完成的rules
  return output
}

exports.createNotifierCallback = () => {
  //操作系统的原生消息提示，比如win10的消息提示
  const notifier = require('node-notifier')

  //severity, errors是由onErrors传入的两个参数
  return (severity, errors) => {
    //severity可以是错误和警告，如果不是错误则不提示信息
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    // 如果有错误则提示信息
    notifier.notify({
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}
