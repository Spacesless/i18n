const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');

const args = process.argv.slice(2);
const env = args[0] || 'web'

const filePath = path.join(__dirname, `src/${env}`)
const blacklist = env === 'web' ? 
  ['api','assets','icons','locales','styles', 'vendor', 'linkage', 'combined-alarm'] :
  ['assets','styles','vendor', 'w-picker']
const fileExtReg = /\.(js|json|vue)$/
let excelData = []

/**
 * 提取excel，导出josn，替换源代码
 */
async function setup() {
  const { columns, data } = await readExcelToJson(path.join(__dirname, `dist/${env}/translate.xlsx`))
  excelData = data

  const i18n = []
  columns.forEach(item => {
    if(item !== '页面') {
      i18n.push({
        lang: item,
        locals: {}
      })
    }
  })

  data.forEach((item,index) => {
    i18n.forEach(i => {
      // let key = item['英文'] ? item['英文'].replace(/[ |-]+(\w)/g, (match, re) => {
      //   return re.trim().toUpperCase()
      // }).replace(/\W/g, '') : index
      // if(key[1] && key[1] !== key[1].toUpperCase()) {
      //   key = key.replace(key[0], key[0].toLowerCase())
      // }
      const key = item['中文'].replace(/\./g, '').trim()

      const value = item[i.lang] ? item[i.lang].trim() : ''
      if(i.locals[item['页面']]) {
        i.locals[item['页面']][key] = value
      } else {
        i.locals[item['页面']] = {
          [key]: value
        }
      }
    })
  })

  // 生成JSON字典
  // i18n.forEach(i => {
  //   console.log('generate:', i.lang)
  //   fs.writeJSON(path.join(__dirname, `dist/${env}/${i.lang}.json`), i.locals, { spaces: 2 })
  // })
  
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
  const targetPath = filedir.replace('src', 'dist').replace(env, `${env}\\code`)
  console.log(targetPath)
  const dataStr = await fs.readFile(filedir,'utf-8').catch(err => {
    console.error('Error:(readFile)', err)
  })
  // /.*[\u4e00-\u9fa5]+.*/gi 匹配一整行
  // /[\u4e00-\u9fa5]+{{ \w+ }}[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+\${\w+}[\u4e00-\u9fa5]+|(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi  匹配${}、{{ }}
  // /(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi
  const content = dataStr.replace(/(?<!\/\/\s.*|<!--\s.*|\*.*)[\u4e00-\u9fa5]+/gi, (re) => {
    const findLocale = excelData.find(item => item['中文'] === re)
    if(findLocale) {
      const key = findLocale['中文'].replace(/\./g, '').trim()
      const result = `$t('${findLocale['页面']}.${key}')`
      return result
    }
    return re
  }).replace(/>(\$t\(.*\))</gi, (match, re) => {
    return `>{{ ${re} }}<`
  }).replace(/ (title|label|alt|placeholder)="\$/gi, (re) => {
    return ` :${re.trimStart()}`
  }).replace(/'(\$t\(.|[\u4e00-\u9fa5]+\))'/gi, (match, re) => {
    return 'this.' + re
  })

  await fs.ensureFile(targetPath)
  await fs.writeFile(targetPath, content)
}

async function readExcelToJson(filename) {
  let columns = []
  const data = []

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filename)

  const worksheet = workbook.getWorksheet(1) // 获取第一个worksheet
  worksheet.eachRow(function(row, rowNumber) {
    const rowValues = row.values
    rowValues.shift()
    if (rowNumber === 1) {
      columns = rowValues
    } else {
      const sheetToJson = {}
      rowValues.forEach((item, index) => {
        sheetToJson[columns[index]] = item
      })
      if(sheetToJson['页面'] === '') {
        const last = data[data.length - 1]
        sheetToJson['页面'] = last ? last['页面'] : ''
      }
      data.push(sheetToJson)
    }
  })

  return { columns, data }
}

setup()
