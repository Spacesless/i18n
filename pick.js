const fs = require('fs-extra');
const path = require('path');

const filePath = path.join(__dirname, 'src/vue-files')
const blacklist = ['api','assets','icons','locales','styles', 'vendor', 'linkage', 'combined-alarm'] // 忽略的文件夹
// const blacklist = ['assets','styles','vendor', 'w-picker']
const fileExtReg = /\.(js|json|vue)$/
const i18n = {}

/**
 * 提取中文，导出excel
 */
async function setup() {
  await readdir(filePath)

  const distPath = path.join(__dirname, `dist/pick-files/zh-CN.json`)
  
  fs.writeJSON(distPath, i18n, { spaces: 2 })
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
 * 读取文件，记录中文
 * @param {String} filedir 文件路径
 */
async function readFile(filedir) {
  console.log(filedir)
  const dataStr = await fs.readFile(filedir,'utf-8').catch(err => {
    console.error('Error:(readFile)', err)
  })
  // /.*[\u4e00-\u9fa5]+.*/gi 匹配一整行
  // /[\u4e00-\u9fa5]+{{ \w+ }}[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+\${\w+}[\u4e00-\u9fa5]+|(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi  匹配${}、{{ }}
  // /(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi
  const matchArr = dataStr.match(/[\u4e00-\u9fa5]+\s?{{ \w+ }}\s?[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+\${.*}[\u4e00-\u9fa5]+|(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi)
  const uniqArr = Array.from(new Set(matchArr))

  const result = {}
  uniqArr.forEach(item => {
    result[item] = item
  })

  i18n[filedir.replace(filePath, '')] = result
}

setup()
