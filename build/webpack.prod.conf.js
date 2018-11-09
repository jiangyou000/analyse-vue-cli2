'use strict'
const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const env = require('../config/prod.env')

const webpackConfig = merge(baseWebpackConfig, {
  module: {
    //配置css相关loader
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  //配置SourceMap
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  //utils.assetsPath函数输出到static文件夹下

  //这篇文章对chunkhash和hash还有contenthash的解释很清晰 https://www.cnblogs.com/ihardcoder/p/5623411.html
  //还有这篇 写的比较简单算是总结 https://juejin.im/post/5a4502be6fb9a0450d1162ed
  //另外chunkhash和HRM模块热重载功能有冲突，所以dev环境下开启HRM后就不要使用chunkhash了，prod环境使用就好
  output: {
    //这里的三个配置项需要好好看看文档中的解释，这三个是常用的还有publicPath
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    //此选项决定了非入口(non-entry) chunk 文件的名称
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      //定义生产环境
      'process.env': env
    }),

    // https://github.com/mishoo/UglifyJS2
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          //删除无法访问的代码或未使用的声明等时显示警告
          warnings: false
          //也可以增加如下配置，去掉console和debugge信息
          // drop_debugger: true,
          // drop_console: true
        }
      },
      sourceMap: config.build.productionSourceMap,
      //并发执行数，默认为 os.cpus().length - 1
      //这里多核cpu可以写高点一般true就可以，增加压缩速度，写成Number类型 数字
      parallel: true
    }),
    // extract css into its own file
    //将css单独抽离成文件
    // https://github.com/webpack-contrib/extract-text-webpack-plugin
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      // Setting the following option to `false` will not extract CSS from codesplit chunks.
      //将以下选项设置为“false”将不会从代码块中提取CSS。
      // Their CSS will instead be inserted dynamically with style-loader when the codesplit chunk has been loaded by webpack.
      // It's currently set to `true` because we are seeing that sourcemaps are included in the codesplit bundle as well when it's `false`, 
      // increasing file size: https://github.com/vuejs-templates/webpack/issues/1110
      allChunks: true,
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    // 压缩提取出的css，并解决ExtractTextPlugin分离出的js重复问题(多个文件引入同一css文件)
    //该插件有可能会有兼容性问题，会删除某些css厂商前缀导致打包后样式错乱，遇到问题可以不启用

    //这有一个兼容性的相关issues https://github.com/cssnano/cssnano/issues/357
    new OptimizeCSSPlugin({
      cssProcessorOptions: config.build.productionSourceMap
        ? { safe: true, map: { inline: false } }
        : { safe: true }

      //上面提到的兼容性问题是同时使用了autoprefixer插件，这两个插件有冲突需要在该插件中关闭autoprefixer
      //比如下面这样配置
      // cssProcessorOptions: {
      //   safe: true,
      //   // 禁用此插件的autoprefixer功能，因为要使通过postcss来使用autoprefixer
      //   //optimize-css-assets-webpack-plugin与autoprefixer有冲突需要在该插件中关闭autoprefixer
      //   autoprefixer: false
      // }
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: config.build.index,
      template: 'index.html',
      inject: true,
      minify: {//对html进行压缩，下面是压缩配置项
        //此处的具体配置项在这里 https://github.com/kangax/html-minifier
        //删除注释
        removeComments: true,
        //删除空格啥的
        collapseWhitespace: true,
        //尽可能删除属性周围的引号
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      //默认auto； 允许指定的thunk在插入到html文档前进行排序，dependency是排序规则，按照不同文件的依赖关系来排序
      chunksSortMode: 'dependency'
    }),
    // keep module.id stable when vendor modules does not change
    //根据模块的相对路径生成一个四位数的hash作为模块id
    //与开发环境中NamedModulesPlugin相对应
    new webpack.HashedModuleIdsPlugin(),
    // enable scope hoisting
    //打包时打包成变量提升的形式，使打包后的代码更小运行更快
    //这个插件是webpack3新功能，webapck4中该插件已经取消可以直接在optimization中配置
    //这里有一篇文章解释的不错 https://zhuanlan.zhihu.com/p/27980441
    new webpack.optimize.ModuleConcatenationPlugin(),
    // split vendor js into its own file

    //下面是一个代码分割的插件，webpack4中换成SplitChunksPlugin了，具体见文档
    //下面分别进行了三种代码的分割

    /**
     关于CommonsChunkPlugin的理解这篇文章写的比较能理解 https://segmentfault.com/a/1190000012828879
     children和async部分解释的不是太清晰，应该是如果只设置children情况下，
     true时二级子模块会被打包到主模块中，
     false时或者不设置时二级子模块会打包到各自的以及子模块中
     设置async后 true的情况会将二级公共的子模块单独抽离出来
     */
    //第一种将用到的node_modules中的包打包到vendor中
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      //给minChunks传入函数 这里有函数参数的解释 https://webpack.docschina.org/plugins/commons-chunk-plugin/#给-minchunks-配置传入函数
      //解释如下
      /**
        module.context: The directory that stores the file. For example: '/my_project/node_modules/example-dependency'
        module.resource: The name of the file being processed. For example: '/my_project/node_modules/example-dependency/index.js'
        count 参数表示 module 被使用的 chunk 数量。
       */
      minChunks (module) {
        // any required modules inside node_modules are extracted to vendor
        return (
          //所以这里的意思是，遍历入口文件和依赖如果文件路径存在并且是.js文件并且该文件在../node_modules中，就提取出来打包到vendor
          //这里的写法有好几种目的一样，webpack官网上提供了另一种写法
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    //这里是提取manifest等运行时文件到单独文件夹中
    //运行时文件解释 https://webpack.docschina.org/concepts/manifest
    /**
     https://webpack.docschina.org/plugins/commons-chunk-plugin/#manifest-file
     把manifest提取出来下面name中取一个entry中没有的name就可以，一般是manifest

     下面这个Infinity是无穷的意思也就是不抽取文件，这里暂时如下理解
     下面这篇文章中写到 minChunks: Infinity - create a chunk with only webpack bootstrapping code. ，也就是至打包manifest文件，就能解释通了
     https://akwuh.me/t/30/
     */
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity
    }),
    // This instance extracts shared chunks from code splitted chunks and bundles them
    // in a separate chunk, similar to the vendor chunk
    // see: https://webpack.js.org/plugins/commons-chunk-plugin/#extra-async-commons-chunk
    new webpack.optimize.CommonsChunkPlugin({
      /**
       name 可以是已经存在的 chunk 的 name （一般是入口文件），那么共用模块代码会合并到这个已存在的 chunk；否则，创建名字为 name 的 commons chunk 来合并。
       */
      name: 'app',
      //这里配合下面合起来的意思是把子模块共同引用的二级子模块单独抽离出来打包成一个vendor-async.js文件
      async: 'vendor-async',
      //这里是如果一个模块的几个子模块引用了相同的二级子模块就把子模块中引用的相同模块打包进主模块中，配合上面设置有其他优化效果
      children: true,
      minChunks: 3
    }),

    // copy custom static assets
    //拷贝文件
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

//如果打算在build时开启gzip压缩，提供gzip压缩后的文件,该包compression-webpack-plugin在package.json中并没有安装，使用的话需要自己装一下

//这里需要安装1.x的包,2.x的包不是下面这样配置配置有变化，而且2.x的包需要webpack4 https://github.com/webpack-contrib/compression-webpack-plugin
//下面把compression-webpack-plugin换成v1.1.12版本的,就能成功使用了
if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

//babel打包分析工具
if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
