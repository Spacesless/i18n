const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const ExcelJS = require('exceljs');
const translate = require('@vitalets/google-translate-api');
const cheerio = require('cheerio')

const mode = 'b'
const handleTranslate = mode === 'a' ? fetchApi : cheerioPage

/**
 * planA 调用谷歌翻译Api
 * @sumary 限频次，可能会被封IP
 * planB 抓取谷歌翻译网页
 */
async function setup() {
  const { columns, data } = await readExcelToJson(path.join(__dirname, `dist/web/i18n.xlsx`))
  
  let taskList = []
  for(let i = 0; i < data.length; i++) {
    const item = data[i]
    if(!item['英文']) {
      taskList.push(
        handleTranslate({
          source: item['中文'], 
          index: i
        })
      )
    }
    if(!item['西班牙语']) {
      taskList.push(
        handleTranslate({
          source: item['中文'], 
          index: i,
          to: 'es'
        })
      )
    }

    if(taskList.length === 10 || i === data.length - 1) {
      await Promise.allSettled(taskList).then(res => {
        res.forEach(d => {
          if(d.status === 'fulfilled') {
            const value = d.value
            const lang = value.to === 'es' ? '西班牙语' : '英文'
            data[value.index][lang] = value.text
          }
        })
      }).catch(() => {})
      taskList = []
    }
  }

  exportJsonToExcel(data)
 }

/**
 * @param {String} source 要翻译的文本
 * @param {Number} index 下标
 * @param {String} to 目标语言
 * @param {String} from 源语言
 * @returns {Promise}
 */
function fetchApi({ source, index, to = 'en', from = 'zh-CN' }) {
  return translate(source, {from, to: 'es', tld: 'cn'}).then(res => {
    const text = res.text
    console.log(index, to, source, text)
    return {
      index,
      to,
      text: text.replace(text[0], text[0].toLocaleUpperCase())
    }
  }).catch(err => {
    console.error(err.statusCode);
  });
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

async function cheerioPage({ source, index, to = 'en', from = 'zh-CN' }) {
  return axios({
    url: `https://translate.google.cn/m?sl=${from}&tl=${to}&q=${encodeURI(source)}`,
    method: 'get'
  }).then(async res => {
    const html = res.data
    const $ = cheerio.load(html)

    const text = $('.result-container').text()

    console.log(index, to, source, text)
    return {
      index,
      to,
      text: text.replace(text[0], text[0].toLocaleUpperCase())
    }
  }).catch(err => {
    console.error(err);
  })
}

function exportJsonToExcel(data) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('My Sheet')

  const columns = [
    { header: '页面', key: '页面', width: 60},
    { header: '中文', key: '中文', width: 50},
    { header: '英文', key: '英文', width: 50},
    { header: '西班牙语', key: '西班牙语', width: 50}
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

  workbook.xlsx.writeFile(`dist/web/translate-base-5.xlsx`);
}

setup()