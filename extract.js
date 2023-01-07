const VueI18NExtract = require("vue-i18n-extract");

// @see https://github.com/Spittal/vue-i18n-extract
VueI18NExtract.createI18NReport({
  vueFiles: "./dist/vue-files/**/*.?(js|vue)",
  languageFiles: "./dist/language-files/*.?(json|yml|yaml)",
  output: "./dist/extract-output.json",
  // add: true, // 是否添加缺失的词条
  // remove: true, // 是否移除没有用到的词条
  exclude: [ // remove忽略的key
    "all.",
    "example.go"
  ],
});
