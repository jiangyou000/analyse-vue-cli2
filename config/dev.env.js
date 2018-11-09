'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')
//这里虽然将prod和dev merge，但是prod会被dev覆盖
module.exports = merge(prodEnv, {
  //这里'"development"'需要写两层引号的原因是后面这个值会被DefinePlugin直接识别成变量所以要再加一层引号
  //可以使用JSON.stringify("development")这种写法
  NODE_ENV: '"development"'
})
