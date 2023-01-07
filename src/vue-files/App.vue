<template>
  <div class="home">
    <!-- 这是html注释 -->
    <h1>这是父组件</h1>
    <a href="//www.baidu.com" title="这是链接"></a>

    <HelloWorld />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld'

export default {
  components: {
    HelloWorld
  },
  methods: {
    /**
     * @summary 控制台打印
     * 多行注释
     */
    handleConsole() {
      // 这是JS注释
      console.log('这是控制台信息')
    }
  }
}
</script>

<style>
/* 这是CSS注释 */
.home {
  font-size: 16px;
}
</style>