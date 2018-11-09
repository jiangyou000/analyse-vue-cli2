'use strict'
require('./check-versions')()
//这个是build命令的入口文件，上面先引入了一个文件


/**
 * 该文件主要是build时删除旧的build文件和打印一些log
 */


//设置当前环境为生产环境
process.env.NODE_ENV = 'production'

//该模块显示命令行中的loding效果 https://github.com/sindresorhus/ora
const ora = require('ora')

//以包的形式包装rm -rf命令，这是个unix命令，该包可以让windows下也支持该命令
const rm = require('rimraf')
const path = require('path')
//命令行中字体颜色颜色
const chalk = require('chalk')
const webpack = require('webpack')
const config = require('../config')
const webpackConfig = require('./webpack.prod.conf')

const spinner = ora('building for production...')
//显示loading
spinner.start()

//清空dist下面的static文件夹
rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
  // rimraf模块回掉是个错误，如果有错误就抛出
  if (err) throw err
  //运行webpack命令，这里使用了webpack的nodejs api具体见文档
  //第一个参数为webpack配置对象
  //https://webpack.docschina.org/api/node/
  //stats是webpack编译过程中的有用信息
  webpack(webpackConfig, (err, stats) => {
    //停止loading
    spinner.stop()
    //如果错误就抛出
    if (err) throw err
    //在命令行中打印
    process.stdout.write(stats.toString({
      //这里有说明 https://segmentfault.com/q/1010000012747497 或者看node和webpack的文档相关部分
      colors: true,
      modules: false,
      children: false, // If you are using ts-loader, setting this to true will make TypeScript errors show up during build.
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    //如果有错误，打印然后退出
    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    // 打印信息
    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
