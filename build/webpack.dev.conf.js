'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')//命令工具中有好的日志输出
const portfinder = require('portfinder')//选择可用端口的工具

/**
 * 关于webpack中的path、publicPath和contentBase
 * 这里还有一篇介绍 https://juejin.im/post/5bb085dd6fb9a05cd24da5cf
 * 
 * output里面的path表示的是output目录对应的一个绝对路径。
 * output里面的publicPath表示的是打包生成的index.html文件里面引用资源的前缀
 * devServer里面的publicPath表示的是打包生成的静态文件所在的位置（若是devServer里面的publicPath没有设置，则会认为是output里面设置的publicPath的值）
 * devServer里面的contentBase表示的是告诉服务器从哪里提供内容。（只有想提供静态文件时才需要）
 */



//dev环境配置
//设置HOST 和 POST的值
const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)
//这里使用webpack-merge将分离的通用配置和dev配置合并
//https://github.com/survivejs/webpack-merge
const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    //css以及相关的一些loader配置
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // cheap-module-eval-source-map is faster for development
  //开发模式下的sourceMap方式
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  //这里提到devServer配置应该在config/index.js中指定
  devServer: {
    clientLogLevel: 'warning',//日志输出等级
    //如果只是将404转到index.html直接配置true即可
    //下面这种是自定义配置如多页面应用或者不转到index.html
    historyApiFallback: {
      rewrites: [
        //这个配置规则在这里 https://github.com/bripkens/connect-history-api-fallback#rewrites
        //这里将所有请求都转到了/index.html
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    //启用模块热替换功能（无需刷新页面更新），必须配置HotModuleReplacementPlugin
    hot: true,
    // 这里因为使用了CopyWebpackPlugin插件故关闭该功能
    //默认webpack dev server是从项目的根目录提供服务，如果要从不同的目录提供服务，可以通过contentBase来配置，比如rails中可以把contentBase配置成'./public'
    //contentBase和两个publicPath的区别见这里 https://www.jianshu.com/p/a026d30a3385
    //devServer.contentBase 告诉服务器从哪里提供内容。只有在你想要提供静态文件时才需要。
    contentBase: false, // since we use CopyWebpackPlugin.
    //启用gzip压缩
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    //自动打开浏览器，这里配置成了false
    open: config.dev.autoOpenBrowser,
    //当出现编译器错误或警告时，在浏览器中显示全屏覆盖层。默认禁用。这里配置成了true
    overlay: config.dev.errorOverlay
      ? { warnings: false, errors: true }
      : false,
    //此路径下的文件可在devServer中访问，相当于devServer根目录？
    //webpack-dev-server打包的内容是放在内存中的，这些打包后的资源对外的的根目录就是publicPath，换句话说，这里我们设置的是打包后资源存放的位置
    // https://juejin.im/post/5ae9ae5e518825672f19b094 这篇基本吧两个publicPath的区别以及各自的作用解释清楚了
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    //启用后命令窗口中除了第一次保存代码后面不会再输出log信息，好像没有用，这里因为使用了FriendlyErrorsPlugin必须开启该功能
    quiet: true, // necessary for FriendlyErrorsPlugin，错误信息由该插件输出
    watchOptions: {
      //监听文件更改，因为再某些系统上因为文件系统的原因不适用所以这里传入poll，开启固定时间检查变动
      //Watch 在 NFS 和 VirtualBox 机器上不适用。
      //这里关闭了该功能
      poll: config.dev.poll,
    }
  },
  plugins: [
    //这是一个简单的字符串替换插件，将我们所有经过webpack打包的js文件的对应的字符串都替换为我们在这个插件中指定的字符串
    new webpack.DefinePlugin({
      //require('../config/dev.env')输出{ NODE_ENV: '"development"' }，定义当前环境为开发环境
      'process.env': require('../config/dev.env')
    }),
    //模块热加载插件
    new webpack.HotModuleReplacementPlugin(),
    //在热加载时直接返回更新文件名，而不是文件的id。这个插件貌似有固定id的作用，与生产环境中的HashedModuleIdsPlugin相对应 见 https://loveky.github.io/2017/03/29/webpack-module-ids/
    //这个插件webpack4中已经没有了换到optimization.namedModules这里配置，开发环境下默认开启
    //具体效果见这里 https://www.jianshu.com/p/8499842defbe
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    // optimization.noEmitOnErrors webpack4在这里配置，生产模式默认开启
    //编译错误时不会输出错误的bundle文件，主要作用是使编译后运行时的包不出错
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    //该插件可将link script等插入到html中，生成html
    //开发环境中的index.html输出
    new HtmlWebpackPlugin({
      filename: 'index.html',//输出文件
      template: 'index.html',//以此为模板
      //注入位置，为true时script标签注入到body底部
      inject: true
    }),
    // copy custom static assets
    //拷贝文件
    // 将static文件夹和里面的内容拷贝到开发模式下的路径,比如static下有个img文件夹，里面有张图片
    // 我们可以这样访问：localhost:8080/static/img/logo.png 
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']//忽视.*文件，如.idea .git .gitkeep这种
      }
    ])
  ]
})
//dev配置结束，该配置赋值给了一个变量


//这里返回导出一个Promise的好处不太清楚？
module.exports = new Promise((resolve, reject) => {
  //设置基础端口，portfinder从基础端口开始扫描可用端口
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      
      // publish the new Port, necessary for e2e tests
      //设置下process.env.PORT
      process.env.PORT = port
      // add port to devServer config
      //如果有可用端口，把该端口赋值给devServer
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      // 向webpack配置插件中pushFriendlyErrorsPlugin的配置
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))
      //成功后调用该方法
      resolve(devWebpackConfig)
    }
  })
})
