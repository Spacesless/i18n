# Vue项目快速实现国际化
对现有的Vue项目进行国际化，需要一个个文件提取中文和替换vue-i18n的语法，炒鸡麻烦
所以开发一个解决上述问题的项目

- [Vue项目快速实现国际化](#vue项目快速实现国际化)
  - [功能特性](#功能特性)
  - [目录结构](#目录结构)
  - [使用方法](#使用方法)

## 功能特性

- 提取Vue项目中的中文词条
- 批量机器翻译
- 替换Vue项目中的中文
- 对基于 vue-i18n 的 Vue 项目执行静态分析

## 目录结构

```
i18n
├─ .gitignore
├─ dist
│  ├─ extract-output.json // 未使用的 vue-i18n 键的列表（在语言文件中找到但在项目中未使用的条目，缺失键 的列表（在项目中使用但在语言文件中不存在的条目）
│  ├─ language-files // 格式化的语言文件，翻译和替换都是基于这个
│  │  └─ zh-CN.json
│  ├─ pick-files // 提取出来的中文词条
│  │  └─ zh-CN.json
│  ├─ translate-files // 翻译好的语言文件
│  │  └─ en-US.json
│  └─ vue-files // 替换好的Vue项目文件
│     ├─ App.vue
│     └─ components
│        └─ HelloWorld.vue
├─ extract.js // 分析丢失的键和未用到的词条，丢失的键可以自动添加到给定的语言文件中，未用到的也可以自动删除
├─ package.json
├─ pick.js // 提取项目中的中文
├─ pnpm-lock.yaml
├─ REDEME.md
├─ replace.js // 替换项目中的中文
├─ src
│  └─ vue-files // 项目源文件
│     ├─ App.vue
│     └─ components
│        └─ HelloWorld.vue
└─ translate.js // 机器翻译

```

## 使用方法

用喜欢的包管理工具安装依赖
```
pnpm install/npm install
```

1. 把项目文件放到 src/vue-files
2. npm run pick 提取中文
3. 把提取到的中文格式化下放到language-files，主要是处理文件的键名
4. npm run translate 批量机器翻译，谷歌可能不可以用，这步不是必须的，可以自己人工翻译
5. npm run replace 把项目中的中文替换成 vue-i18n 的语法
6. npm run extract 分析丢失的键和未用到的词条

