const VueI18NExtract = require('vue-i18n-extract');

const report = VueI18NExtract.createI18NReport({
  vueFiles: './extract/web/vue-files/**/*.?(js|vue)',
  languageFiles: './extract/web/language-files/*.json',
  remove: true
});