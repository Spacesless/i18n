const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const translate = require('@vitalets/google-translate-api');
const cheerio = require('cheerio')

/**
 * planA 调用谷歌翻译Api (限频次，可能会被封IP)
 * planB 抓取谷歌翻译网页
 * @sumary 建议自己换成百度翻译Api
 */
const mode = 'fetchApi'
const handleTranslate = mode === 'fetchApi' ? fetchApi : cheerioPage

const expectList = [
  { lang: 'en', filename: 'en-US' }
] // 期望生成的语言文件

async function setup() {
  const sourceLang = fs.readJSONSync(path.join(__dirname, 'dist/language-files/zh-CN.json'))
  
  let taskList = []

  const lastGroup = Object.keys(sourceLang).pop()
  const lastKey = Object.keys(sourceLang[lastGroup]).pop()

  for(const item of expectList) {
    item.result = {}

    for(const i in sourceLang) {
      for(const j in sourceLang[i]) {
        taskList.push(
          handleTranslate({
            source: sourceLang[i][j], 
            group: i,
            key: j,
            to: item.lang
          })
        )

        if (taskList.length === 10 || (i === lastGroup && j === lastKey)) {
          await Promise.allSettled(taskList).then(res => {
            res.forEach(d => {
              if (d.status === 'fulfilled') {
                const { group, key, to, text } = d.value

                if (to === item.lang) {
                  if (!item.result[group]) {
                    item.result[group] = {}
                  }
                  item.result[group][key] = text
                }
              }
            })
          }).catch(() => {})
          taskList = []
        }
      }
    }

    fs.writeJSON(path.join(__dirname, `dist/translate-files/${item.filename}.json`), item.result, { spaces: 2 })
  }
 }

/**
 * @param {String} source 要翻译的文本
 * @param {Number} index 下标
 * @param {String} to 目标语言
 * @param {String} from 源语言
 * @returns {Promise}
 */
function fetchApi({ source, group, key, to = 'en', from = 'zh-CN' }) {
  return translate(source, {from, to: 'es', tld: 'cn'}).then(res => {
    let text = res.text
    text = text.replace(text[0], text[0].toLocaleUpperCase())
    console.log(group, key, to, source, text)

    return { group, key, to, text }
  }).catch(err => {
    console.error(err.statusCode);
  });
}


async function cheerioPage({ source, group, key, to = 'en', from = 'zh-CN' }) {
  return axios({
    url: `https://translate.google.cn/m?sl=${from}&tl=${to}&q=${encodeURI(source)}`,
    method: 'get'
  }).then(async res => {
    const html = res.data
    const $ = cheerio.load(html)

    let text = $('.result-container').text()
    text = text.replace(text[0], text[0].toLocaleUpperCase())
    console.log(group, key, to, source, text)

    return { group, key, to, text }
  }).catch(err => {
    console.error(err);
  })
}

setup()