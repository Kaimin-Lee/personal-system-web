<template>
  <div class="geometry-container">
    <el-row :gutter="24">
      <el-col :xs="24" :md="12">
        <el-card class="calc-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">📐 多功能几何推导器</span>
            </div>
          </template>

          <el-tabs v-model="activeTab" class="custom-tabs">
            <el-tab-pane label="🔴 圆形" name="circle">
              <el-alert title="输入半径，自动推导全属性" type="info" :closable="false" class="mb-3" />
              <el-form label-width="100px">
                <el-form-item label="半径 (r)">
                  <el-input-number v-model="circle.r" :min="0" :step="1" style="width: 100%" />
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="🔺 三角形" name="triangle">
              <el-alert title="智能推导：根据你的已知条件选择模式" type="success" :closable="false" class="mb-3" />
              
              <el-radio-group v-model="triangleMode" class="mb-3" style="display: flex; justify-content: center;">
                <el-radio-button label="right">直角三角形 (知二推一)</el-radio-button>
                <el-radio-button label="any">任意三角形 (知三求角)</el-radio-button>
              </el-radio-group>

              <div v-show="triangleMode === 'right'">
                <el-form label-width="100px">
                  <el-form-item label="直角边 (a)">
                    <el-input-number v-model="rightTriangle.a" :min="0" :step="1" style="width: 100%" :disabled="isRtDisabled('a')" />
                  </el-form-item>
                  <el-form-item label="直角边 (b)">
                    <el-input-number v-model="rightTriangle.b" :min="0" :step="1" style="width: 100%" :disabled="isRtDisabled('b')" />
                  </el-form-item>
                  <el-form-item label="斜边 (c)">
                    <el-input-number v-model="rightTriangle.c" :min="0" :step="1" style="width: 100%" :disabled="isRtDisabled('c')" />
                  </el-form-item>
                  <div style="text-align: right; margin-top: -10px;">
                    <el-button link type="primary" @click="resetRightTriangle">↻ 重新输入</el-button>
                  </div>
                </el-form>
              </div>

              <div v-show="triangleMode === 'any'">
                <el-form label-width="100px">
                  <el-form-item label="边长 (a)">
                    <el-input-number v-model="anyTriangle.a" :min="0" :step="1" style="width: 100%" />
                  </el-form-item>
                  <el-form-item label="边长 (b)">
                    <el-input-number v-model="anyTriangle.b" :min="0" :step="1" style="width: 100%" />
                  </el-form-item>
                  <el-form-item label="边长 (c)">
                    <el-input-number v-model="anyTriangle.c" :min="0" :step="1" style="width: 100%" />
                  </el-form-item>
                  <div style="text-align: right; margin-top: -10px;">
                    <el-button link type="primary" @click="resetAnyTriangle">↻ 重新输入</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>

            <el-tab-pane label="📦 长方体" name="cuboid">
              <el-alert title="空间几何：计算体积与表面积" type="warning" :closable="false" class="mb-3" />
              <el-form label-width="100px">
                <el-form-item label="长 (l)"><el-input-number v-model="cuboid.l" :min="0" style="width: 100%" /></el-form-item>
                <el-form-item label="宽 (w)"><el-input-number v-model="cuboid.w" :min="0" style="width: 100%" /></el-form-item>
                <el-form-item label="高 (h)"><el-input-number v-model="cuboid.h" :min="0" style="width: 100%" /></el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="🍦 圆锥" name="cone">
              <el-alert title="推导体积、侧面积、全面积及母线长" type="warning" :closable="false" class="mb-3" />
              <el-form label-width="100px">
                <el-form-item label="底面半径 (r)"><el-input-number v-model="cone.r" :min="0" style="width: 100%" /></el-form-item>
                <el-form-item label="高 (h)"><el-input-number v-model="cone.h" :min="0" style="width: 100%" /></el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="🪣 圆台" name="frustum">
              <el-alert title="推导圆台体积及表面积" type="warning" :closable="false" class="mb-3" />
              <el-form label-width="110px">
                <el-form-item label="顶面半径 (r1)"><el-input-number v-model="frustum.r1" :min="0" style="width: 100%" /></el-form-item>
                <el-form-item label="底面半径 (r2)"><el-input-number v-model="frustum.r2" :min="0" style="width: 100%" /></el-form-item>
                <el-form-item label="高 (h)"><el-input-number v-model="frustum.h" :min="0" style="width: 100%" /></el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>

          <div class="action-bar">
            <el-button type="primary" size="large" @click="doCalculate" class="w-100">
              ⚡ 立即推导计算
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card class="history-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">☁️ 云端推导纪要</span>
              <el-popconfirm title="确定要清空所有记录吗？" @confirm="clearHistory">
                <template #reference>
                  <el-button type="danger" link>🗑️ 清空</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>

          <el-empty v-if="historyList.length === 0" description="暂无云端历史数据" />
          
          <el-scrollbar height="500px" v-else>
            <el-timeline style="padding-left: 10px; padding-top: 10px;">
              <el-timeline-item
                v-for="(item, index) in historyList"
                :key="item.id"
                :timestamp="item.createTime"
                placement="top"
                :color="index === 0 ? '#409EFF' : '#E4E7ED'"
              >
                <el-card shadow="never" class="timeline-inner-card">
                  <div class="record-header">
                    <el-tag effect="light" round>{{ item.shapeName }}</el-tag>
                    <span class="params-text">输入: {{ item.params }}</span>
                  </div>
                  <el-divider border-style="dashed" style="margin: 10px 0;" />
                  <div class="result-text" v-html="formatResult(item.result)"></div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const activeTab = ref('triangle') // 默认直接打开三角形面板
const triangleMode = ref('right')
const historyList = ref([])

// 各模块动态参数
const circle = reactive({ r: 0 })
const rightTriangle = reactive({ a: 0, b: 0, c: 0 })
const anyTriangle = reactive({ a: 0, b: 0, c: 0 })
const cuboid = reactive({ l: 0, w: 0, h: 0 })
const cone = reactive({ r: 0, h: 0 })
const frustum = reactive({ r1: 0, r2: 0, h: 0 })

// --- 直角三角形交互锁逻辑 ---
const isRtDisabled = (side) => {
  let filledCount = 0;
  if (rightTriangle.a > 0) filledCount++;
  if (rightTriangle.b > 0) filledCount++;
  if (rightTriangle.c > 0) filledCount++;
  return filledCount >= 2 && rightTriangle[side] === 0;
}
const resetRightTriangle = () => {
  rightTriangle.a = 0; rightTriangle.b = 0; rightTriangle.c = 0;
}
const resetAnyTriangle = () => {
  anyTriangle.a = 0; anyTriangle.b = 0; anyTriangle.c = 0;
}

// --- 核心推导逻辑 ---
const doCalculate = async () => {
  let shapeName = ''
  let paramsStr = ''
  let resultArr = []

  if (activeTab.value === 'circle') {
    if (circle.r <= 0) return ElMessage.warning('半径必须大于 0')
    shapeName = '圆形全属性'
    paramsStr = `半径 r = ${circle.r}`
    resultArr.push(`<b>直径 (d)</b>: ${circle.r * 2}`)
    resultArr.push(`<b>周长 (C)</b>: ${(2 * Math.PI * circle.r).toFixed(2)}`)
    resultArr.push(`<b>面积 (S)</b>: ${(Math.PI * Math.pow(circle.r, 2)).toFixed(2)}`)
  } 
  else if (activeTab.value === 'triangle') {
    if (triangleMode.value === 'right') {
      let { a, b, c } = rightTriangle;
      if (!((a > 0 && b > 0) || (a > 0 && c > 0) || (b > 0 && c > 0))) {
        return ElMessage.warning('请至少输入两条边的长度！')
      }

      if (a > 0 && b > 0) {
        c = Math.sqrt(a**2 + b**2);
        shapeName = '直角三角形'
        paramsStr = `a = ${a}, b = ${b}`
        resultArr.push(`<b>推导斜边 (c)</b>: ${c.toFixed(2)}`)
      } else if (a > 0 && c > 0) {
        if (a >= c) return ElMessage.warning('直角边不能大于或等于斜边！')
        b = Math.sqrt(c**2 - a**2);
        shapeName = '直角三角形'
        paramsStr = `a = ${a}, c = ${c}`
        resultArr.push(`<b>推导直角边 (b)</b>: ${b.toFixed(2)}`)
      } else if (b > 0 && c > 0) {
        if (b >= c) return ElMessage.warning('直角边不能大于或等于斜边！')
        a = Math.sqrt(c**2 - b**2);
        shapeName = '直角三角形'
        paramsStr = `b = ${b}, c = ${c}`
        resultArr.push(`<b>推导直角边 (a)</b>: ${a.toFixed(2)}`)
      }
      
      // 反三角函数计算内角角度
      const angleA = (Math.asin(a / c) * 180 / Math.PI).toFixed(2)
      const angleB = (Math.asin(b / c) * 180 / Math.PI).toFixed(2)

      resultArr.push(`<b>面积 (S)</b>: ${(0.5 * a * b).toFixed(2)}`)
      resultArr.push(`<b>周长 (L)</b>: ${(a + b + c).toFixed(2)}`)
      resultArr.push(`<b>∠A (对a边)</b>: ${angleA}°`)
      resultArr.push(`<b>∠B (对b边)</b>: ${angleB}°`)
      resultArr.push(`<b>∠C (对斜边)</b>: 90.00°`)

    } else if (triangleMode.value === 'any') {
      let { a, b, c } = anyTriangle;
      if (a <= 0 || b <= 0 || c <= 0) return ElMessage.warning('边长必须大于 0')
      // 验证是否构成三角形
      if (a + b <= c || a + c <= b || b + c <= a) {
        return ElMessage.warning('不满足构成三角形的条件 (任意两边之和必须大于第三边)')
      }

      paramsStr = `a = ${a}, b = ${b}, c = ${c}`
      
      // 智能判定三角形具体类型
      let sides = [a, b, c].sort((x, y) => x - y)
      if (Math.abs(sides[0]**2 + sides[1]**2 - sides[2]**2) < 0.01) {
        shapeName = '直角三角形 (由三边自动判定)'
      } else if (a === b && b === c) {
        shapeName = '等边三角形'
      } else if (a === b || a === c || b === c) {
        shapeName = '等腰三角形'
      } else {
        shapeName = '普通三角形'
      }

      // 余弦定理推导三个内角
      const angleA = (Math.acos((b**2 + c**2 - a**2) / (2 * b * c)) * 180 / Math.PI).toFixed(2);
      const angleB = (Math.acos((a**2 + c**2 - b**2) / (2 * a * c)) * 180 / Math.PI).toFixed(2);
      const angleC = (180 - angleA - angleB).toFixed(2); // 保证三角和为180度

      // 海伦公式推导面积
      const p = (a + b + c) / 2;
      const area = Math.sqrt(p * (p - a) * (p - b) * (p - c)).toFixed(2);

      resultArr.push(`<b>几何判定</b>: ${shapeName}`)
      resultArr.push(`<b>面积 (S)</b>: ${area}`)
      resultArr.push(`<b>周长 (L)</b>: ${(a + b + c).toFixed(2)}`)
      resultArr.push(`<b>∠A (对a边)</b>: ${angleA}°`)
      resultArr.push(`<b>∠B (对b边)</b>: ${angleB}°`)
      resultArr.push(`<b>∠C (对c边)</b>: ${angleC}°`)
    }
  }
  else if (activeTab.value === 'cuboid') {
    if (cuboid.l <= 0 || cuboid.w <= 0 || cuboid.h <= 0) return ElMessage.warning('长宽高必须大于 0')
    shapeName = '3D 长方体'
    paramsStr = `l = ${cuboid.l}, w = ${cuboid.w}, h = ${cuboid.h}`
    resultArr.push(`<b>体积 (V)</b>: ${(cuboid.l * cuboid.w * cuboid.h).toFixed(2)}`)
    resultArr.push(`<b>表面积 (S)</b>: ${(2 * (cuboid.l*cuboid.w + cuboid.l*cuboid.h + cuboid.w*cuboid.h)).toFixed(2)}`)
    resultArr.push(`<b>空间对角线</b>: ${Math.sqrt(cuboid.l**2 + cuboid.w**2 + cuboid.h**2).toFixed(2)}`)
  }
  else if (activeTab.value === 'cone') {
    if (cone.r <= 0 || cone.h <= 0) return ElMessage.warning('底面半径和高必须大于 0')
    shapeName = '3D 圆锥'
    paramsStr = `r = ${cone.r}, h = ${cone.h}`
    let l = Math.sqrt(cone.r**2 + cone.h**2); 
    resultArr.push(`<b>母线长 (l)</b>: ${l.toFixed(2)}`)
    resultArr.push(`<b>体积 (V)</b>: ${(Math.PI * Math.pow(cone.r, 2) * cone.h / 3).toFixed(2)}`)
    resultArr.push(`<b>侧面积</b>: ${(Math.PI * cone.r * l).toFixed(2)}`)
    resultArr.push(`<b>全面积 (S)</b>: ${(Math.PI * cone.r * l + Math.PI * Math.pow(cone.r, 2)).toFixed(2)}`)
  }
  else if (activeTab.value === 'frustum') {
    if (frustum.r1 === 0 && frustum.r2 === 0) return ElMessage.warning('顶面和底面半径不能同时为 0')
    if (frustum.h <= 0) return ElMessage.warning('高必须大于 0')
    shapeName = '3D 圆台'
    paramsStr = `r1 = ${frustum.r1}, r2 = ${frustum.r2}, h = ${frustum.h}`
    let l = Math.sqrt((frustum.r2 - frustum.r1)**2 + frustum.h**2); 
    let s_lateral = Math.PI * (frustum.r1 + frustum.r2) * l;
    let s_top = Math.PI * Math.pow(frustum.r1, 2);
    let s_bottom = Math.PI * Math.pow(frustum.r2, 2);
    resultArr.push(`<b>母线长 (l)</b>: ${l.toFixed(2)}`)
    resultArr.push(`<b>体积 (V)</b>: ${(Math.PI * frustum.h * (Math.pow(frustum.r1, 2) + Math.pow(frustum.r2, 2) + frustum.r1 * frustum.r2) / 3).toFixed(2)}`)
    resultArr.push(`<b>侧面积</b>: ${s_lateral.toFixed(2)}`)
    resultArr.push(`<b>全面积 (S)</b>: ${(s_lateral + s_top + s_bottom).toFixed(2)}`)
  }

  const finalResult = resultArr.join(' | ')

  try {
    await request.post('/geometry/history', {
      shapeName: shapeName,
      params: paramsStr,
      result: finalResult
    })
    ElMessage.success('推导成功并已同步云端')
    fetchHistory()
  } catch (error) {
    ElMessage.error('云端同步失败')
  }
}

const formatResult = (resultStr) => {
  if (!resultStr) return ''
  return resultStr.replace(/ \| /g, '<br><span style="color:#909399; margin-top:4px; display:inline-block;">↳ </span>')
}

const fetchHistory = async () => {
  try {
    const res = await request.get('/geometry/history')
    if (res.code === 200) {
      historyList.value = res.data
    }
  } catch (error) {
    console.error('获取历史记录失败')
  }
}

const clearHistory = async () => {
  try {
    const res = await request.delete('/geometry/history')
    if (res.code === 200) {
      ElMessage.success('云端记录已彻底清空')
      historyList.value = []
    }
  } catch (error) {
    ElMessage.error('清空失败')
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.geometry-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header .title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}
.mb-3 {
  margin-bottom: 20px;
}
.w-100 {
  width: 100%;
}
.action-bar {
  margin-top: 30px;
}
.timeline-inner-card {
  background-color: #f8f9fa;
  border: 1px solid #ebeef5;
}
.record-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.params-text {
  font-size: 13px;
  color: #606266;
}
.result-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}
:deep(.el-tabs__item) {
  font-size: 15px;
}
</style>