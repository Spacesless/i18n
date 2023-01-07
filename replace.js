const fs = require('fs-extra');
const path = require('path');

const filePath = path.join(__dirname, 'src/vue-files')
const blacklist = ['api','assets','icons','locales','styles', 'vendor', 'linkage', 'combined-alarm']
// const blacklist = ['assets','styles','vendor', 'w-picker']
const fileExtReg = /\.(js|json|vue)$/
let i18nData = []

/**
 * 提取excel，导出josn，替换源代码
 */
async function setup() {
  const sourceLang = fs.readJSONSync(path.join(__dirname, 'dist/language-files/zh-CN.json'))

  for(const i in sourceLang) {
    for(const j in sourceLang[i]) {
      i18nData.push({
        group: i,
        key: j,
        value: sourceLang[i][j]
      })
    }
  }
  
  // 替换源代码
  readdir(filePath)
}

/**
 * 递归读取文件
 * @param {String} filePath 目录
 */
async function readdir(filePath) {
  const files = await fs.readdir(filePath).catch(err => {
    console.error('Error:(readdir)', err)
  })

  for(let i = 0; i < files.length; i ++) {
    const filename = files[i]
    if(blacklist.includes(filename)) {
      continue
    }
    //获取当前文件的绝对路径
    const filedir = path.join(filePath, filename)

    const stats = await fs.stat(filedir).catch(err => {
      console.error('Error:(stat)', err)
    })
    // 是否是文件
    const isFile = stats.isFile()
    // 是否是文件夹
    const isDir = stats.isDirectory()
    if (isFile) {
      if(fileExtReg.test(filename)) {
        await readFile(filedir).catch(() => {})
      }
    }
    // 如果是文件夹
    if (isDir) {
      await readdir(filedir)
    }
  }
}

/**
 * 读取文件，替换$t
 * @param {String} filedir 文件路径
 */
async function readFile(filedir) {
  const targetPath = filedir.replace('src', 'dist')
  console.log(targetPath)
  const dataStr = await fs.readFile(filedir,'utf-8').catch(err => {
    console.error('Error:(readFile)', err)
  })
  // /.*[\u4e00-\u9fa5]+.*/gi 匹配一整行
  // /[\u4e00-\u9fa5]+{{ \w+ }}[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+\${\w+}[\u4e00-\u9fa5]+|(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi  匹配${}、{{ }}
  // /(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi
  const content = dataStr.replace(/(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi, (re) => {
    const findLocale = i18nData.find(item => item.value === re)
    if(findLocale) {
      const key = findLocale.key.replace(/\./g, '').trim()
      const result = `$t('${findLocale.group}.${key}')`
      return result
    }
    return re
  }).replace(/>(\$t\(.*\))</gi, (match, re) => {
    // 替换标签内容
    return `>{{ ${re} }}<`
  }).replace(/ (title|label|alt|placeholder)="\$/gi, (re) => { 
    // 替换属性
    return ` :${re.trimStart()}`
  }).replace(/'(\$t\(.*\))'/gi, (match, re) => {
    // 替换JS
    return 'this.' + re
  })

  await fs.ensureFile(targetPath) // 先创建目录
  await fs.writeFile(targetPath, content)
}

setup()
