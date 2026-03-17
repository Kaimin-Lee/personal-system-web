<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 激活 Element Plus 原生暗黑模式
  document.documentElement.classList.add('dark')
})
</script>

<style>
/* ================== 赛博科技风 全局 UI 重构 ================== */

/* 🌟 核心修复：重写 Element Plus 的内置颜色变量，彻底解决深色模式下灰色字体看不清的问题 */
html.dark {
  --el-text-color-primary: #f8fafc;     /* 最亮的主文本 */
  --el-text-color-regular: #cbd5e1;     /* 常规文本 */
  --el-text-color-secondary: #94a3b8;   /* 次要文本（之前是发黑的暗灰，现提亮为高对比度冷灰） */
  --el-text-color-placeholder: #64748b; /* 输入框占位符 */
  
  --el-border-color-lighter: rgba(0, 243, 255, 0.15);
  --el-border-color-light: rgba(0, 243, 255, 0.25);
  --el-border-color: rgba(0, 243, 255, 0.35);
  
  --el-fill-color-blank: rgba(0, 0, 0, 0.3); /* 输入框等底层填充色 */
  --el-bg-color: rgba(13, 20, 36, 0.9);
  --el-bg-color-overlay: rgba(13, 20, 36, 0.95); /* 下拉菜单等悬浮层底色 */
}

/* 1. 科技感网格背景 */
body {
  margin: 0;
  background-color: #050a15; /* 深邃科技蓝黑 */
  background-image: 
    linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  color: #e2e8f0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 2. 全局卡片：毛玻璃与霓虹边框 */
.dark .el-card {
  background: rgba(13, 20, 36, 0.65) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(0, 243, 255, 0.15) !important;
  color: #e2e8f0 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease;
}
.dark .el-card__header {
  border-bottom: 1px solid rgba(0, 243, 255, 0.15) !important;
}

/* 3. 主按钮：赛博流光特效 */
.dark .el-button--primary {
  background: linear-gradient(90deg, #0052d4 0%, #4364f7 50%, #6fb1fc 100%) !important;
  border: none !important;
  box-shadow: 0 0 10px rgba(0, 198, 255, 0.4) !important;
  transition: all 0.3s;
}
.dark .el-button--primary:hover {
  box-shadow: 0 0 20px rgba(0, 198, 255, 0.8) !important;
  transform: translateY(-2px);
}

/* 4. 弹窗毛玻璃 */
.dark .el-dialog {
  background: rgba(13, 20, 36, 0.85) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(0, 243, 255, 0.3) !important;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.1) !important;
}

/* 5. 暴力提亮各个子页面中曾经写死的灰色文本 */
.dark .subtitle, .dark .task-desc, .dark .msg-time, .dark .params-text, 
.dark .days-count .unit, .dark .target-date, .dark .site-desc, 
.dark .text-secondary, .dark .task-status, .dark .event-name {
  color: #94a3b8 !important; 
}
.dark .task-title, .dark .record-header, .dark .result-text {
  color: #e2e8f0 !important;
}

/* 6. 修复白底页面的遗留色块，使其融入科幻主题 */
.dark .main-content { background-color: transparent !important; }
.dark .board-column { background-color: rgba(0, 0, 0, 0.25) !important; border: 1px solid rgba(0, 243, 255, 0.1) !important; }
.dark .task-card { background-color: rgba(20, 30, 50, 0.8) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important; }
.dark .project-item { background-color: rgba(0, 0, 0, 0.3) !important; }
.dark .project-name { color: #fff !important; }
.dark .timeline-inner-card { background-color: rgba(0,0,0,0.2) !important; border: 1px solid rgba(0,243,255,0.1) !important; }
</style>