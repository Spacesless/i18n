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
const i18n = {}
const total = {}

/**
 * 提取中文，导出excel
 */
async function setup() {
  await readdir(filePath)

  const data = []
  const common = []
  let index = 0
  for(const key in total) {
    if(total[key] > 1) {
      data.push({
        page: index ? '' : '公共',
        cn: key
      })
      common.push(key)
      index++
    }
  }

  i18n.common = common

  for(const key in i18n) {
    const items = i18n[key].filter(item => !common.includes(item))
    if(key !== 'common') {
        i18n[key] = items
    }
    items.forEach((item, index) => {
      data.push({
        page: index ? '' : key,
        cn: item
      })
    })
  }

  exportJsonToExcel(data)
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
  uniqArr.forEach(item => {
    if(total[item]) {
      total[item] = total[item] + 1
    } else {
      total[item] = 1
    }
  })
  i18n[filedir.replace(filePath, '')] = uniqArr
}

function exportJsonToExcel(data) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('My Sheet')

  const columns = [
    { header: '页面', key: 'page', width: 60},
    { header: '中文', key: 'cn', width: 50},
    { header: '英文', key: 'en', width: 50}
  ]
  worksheet.columns = columns
  worksheet.addRows(data)

  const header = worksheet.getRow(1)
  columns.forEach((item, index) => {
    // 设置表头属性
    const headerCell = header.getCell(item.key)
    // 字体
    headerCell.font = {
      color: { argb: 'FFFFFFFF' }
    }
    // 对齐
    headerCell.alignment = { horizontal: 'center' }
    // 填充
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF808080' }
    }
  })

  workbook.xlsx.writeFile(`dist/${env}/i18n.xlsx`);
}

setup()
