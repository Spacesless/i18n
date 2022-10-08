用机器做重复繁杂的工作

## 目录结构

├── dist                   // 构建相关  
│   ├── web
│   |   ├── code           // 替换vue-i18n后的代码
│   |   ├── i18n.xlsx      // 提前中文生成的excel文件
│   |   ├── xx.json        // 读取excel词条生成的vue-i18n字典
├── src                    // 源代码
│   ├── web                // web src源码
│   ├── app                // app 源码
├── pick.js                // 提取源代码中的中文，生成excel
├── replace.js             // 读取excel词条生成[语言].json，替换源代码中的中文为vue-i18n的语法

## 使用方法

1. 拷贝源代码到src中对应的目录
2. pnpm i 或 npm i安装依赖

3. node pick.js 提取web的中文，不带参数，默认执行web端
   node pick.js app 提取app的中文

4. node replace.js 读取excel词条生成字典，并替换源代码
   node replace.js app  持续app端的