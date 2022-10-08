const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');
const iconv = require("iconv-lite");

async function setup() {
  const dataStr = await fs.readFile(path.join('src/bluetooth.txt'))
  const content = iconv.decode(dataStr, 'GB2312').toString();
  const contentArr = content.split('\r\n').filter(item => item && !/(tools|.js|.vue|\t)/.test(item))

  const result = {}
  for(let i = 0;i<contentArr.length;i+=2) {
    const cnArr = contentArr[i] ? contentArr[i].split('、').filter(item => item) : []
    const enArr = contentArr[i + 1] ? contentArr[i + 1].split(', ').filter(item => item) : []
    if(cnArr.length !== enArr.length) {
      console.log(i, cnArr, enArr)
    }
    cnArr.forEach((cn, index) => {
      result[cn] = enArr[index] || ''
    })
  }

  fs.writeJSONSync(path.join(__dirname, 'dist/app/bluetooth.json'), result, { spaces: 2 })
}

setup()