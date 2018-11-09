'use strict'
const path = require('path')//引入node中path模块
const utils = require('./utils')
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')


//这有一篇vue-cli配置分析的文章写得非常好 https://github.com/lxchuan12/analyse-vue-cli


function resolve (dir) {
  //将传入的路径变为上一级路径
  return path.join(__dirname, '..', dir)
}
module.exports = {
  //context用来配置entry(只控制entry)的基础路径，如果不配置默认为执行该文件命令的执行路径(注意不是该文件的存放路径)
  context: path.resolve(__dirname, '../'),
  entry: {
    //app为自定义入口名字，默认为main
    app: './src/main.js'
  },
  output: {
    //输出目录的绝对路径，config文件中定义的变量 ../dist
    path: config.build.assetsRoot,
    //base配置文件中没做hash处理，name为entry的入口名字'app'
    filename: '[name].js',
    //publicPath打包后的静态资源访问路径(相对于index.html文件)，可以修改publicPath查看打包后index.html中引入js css等文件路径的变化
    //这个选项指定 HTML 文件中资源文件 (字体、图片、JS文件等) 的文件名的公共 URL 部分
    //publicPath相关文章 https://juejin.im/post/5ae9ae5e518825672f19b094

    //process.env.NODE_ENV这个变量用来根据当前环境切换具体不同配置,使用DefinePlugin插件定义的，具体在定义处写
    //process.env应该node中的返回用户环境信息 http://nodejs.cn/api/process.html#process_process_env
    //DefinePlugin中定义process.env或许只是用来切换

    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  //resolve解析配置import require模块时的行为
  resolve: {
    //自定义扩展这样定义之后，代码中import这些后缀的文件不用加后缀，如导入main.js直接写import main from 'main'
    extensions: ['.js', '.vue', '.json'],
    //设置别名用来简化import或者require时的路径
    alias: {
      //在后面加一个$表示精准匹配，import xxx form vue则导入vue.esm.js(ES Module下的完整版)，import xxx form vue/xxx 则触发普通解析
      //默认不配置为运行时版本，具体见这里 https://cn.vuejs.org/v2/guide/installation.html#对不同构建版本的解释
      'vue$': 'vue/dist/vue.esm.js',
      //@代替路径，由resolve函数可知变为../src
      '@': resolve('src'),
    }
  },
  module: {
    rules: [
      {
        // 详见 https://webpack.docschina.org/configuration/module/#条件
        //Rule.resource.test的缩写，匹配特定条件。一般是提供一个正则表达式或正则表达式的数组，但这不是强制的。
        test: /\.vue$/,
        //Rule.use:[{loader}]的简写，具体路径和context配置有关，具体见文档
        loader: 'vue-loader',
        //Rule.use:[{options}]的简写，具体路径和context配置有关，具体见文档
        //vueLoaderConfig
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        //将js文件都通过babel-loader转为浏览器支持的语法
        loader: 'babel-loader',
        //匹配特定条件。一般是提供一个字符串或者字符串数组，但这不是强制的。只在下面三个文件夹中使用babel
        include: [resolve('src'), resolve('test'), resolve('node_modules/webpack-dev-server/client')]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        //和file-loader类似，大于limit时默认使用file-loader，所以装url-loader一般要同时安装file-loader，配置也要使用file-loader的配置
        // 小于10000字节时返回DataUrl，即data:协议的url 如base64之类 https://developer.mozilla.org/zh-CN/docs/Web/HTTP/data_URIs
        options: {
          limit: 10000,
          //配置参考 https://webpack.docschina.org/loaders/file-loader/#placeholders
          //ext是扩展名,该utils函数为了将loader处理后的文件处理成static路径开头的
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          //同上，为啥不写一起，因为这个输出到了static下的media路径
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          //同上
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  node: {
    //为浏览器环境提供node中默写模块的polyfill，默认值 https://webpack.docschina.org/configuration/node/#node
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
