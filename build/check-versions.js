'use strict'
const chalk = require('chalk')//该模块修改控制台中字符串样式，如字体颜色，加粗隐藏，背景颜色等
const semver = require('semver')//语义化版本的小工具

//这里引入package.json，可以在代码中使用一些package.json中的配置
const packageConfig = require('../package.json')
const shell = require('shelljs')//在node中使用类似shell的语法实现功能

/**
 * 该文件是判断运行环境中的node和npm版本是否符合要求
 */



function exec (cmd) {
  //获取node中child_process(子进程)模块
  //创建一个同步子进程（即该进程运行完才返回）运行传入的命令
  return require('child_process').execSync(cmd).toString().trim()
}

const versionRequirements = [
  {
    name: 'node',
    // https://github.com/npm/node-semver
    //获取当前node版本号，直接获取process.version会是v10.13.0这样滴，语义化一下变成10.13.0这样
    currentVersion: semver.clean(process.version),
    versionRequirement: packageConfig.engines.node
  }
]
//shelljs一个中文的说明 https://cloud.tencent.com/developer/article/1351852
//判断npm命令是否可执行
if (shell.which('npm')) {
  // 如果npm存在的话设置一下npm的一些值
  versionRequirements.push({
    name: 'npm',
    //通过运行该命令获取当前npm版本号
    currentVersion: exec('npm --version'),
    versionRequirement: packageConfig.engines.npm
  })
}

//主体函数
module.exports = function () {
  const warnings = []


  for (let i = 0; i < versionRequirements.length; i++) {
    const mod = versionRequirements[i]

    //如果前面的版本mod.currentVersion满足后面的mod.versionRequirement范围则返回true
    //这里是不满足往下运行
    if (!semver.satisfies(mod.currentVersion, mod.versionRequirement)) {
      //不满足说明当前环境中的node或者npm版本不符合package.json中定义的要求
      //设置一个警告当前版本显示红色，要求版本显示绿色
      warnings.push(mod.name + ': ' +
        chalk.red(mod.currentVersion) + ' should be ' +
        chalk.green(mod.versionRequirement)
      )
    }
  }

  if (warnings.length) {
    console.log('')
    console.log(chalk.yellow('To use this template, you must update following to modules:'))
    console.log()

    //循环打印warning数组
    for (let i = 0; i < warnings.length; i++) {
      const warning = warnings[i]
      console.log('  ' + warning)
    }

    console.log()
    //退出当前进程也就是运行该文件的命令进程，1表示执行失败，0表示执行成功
    process.exit(1)
  }
}
