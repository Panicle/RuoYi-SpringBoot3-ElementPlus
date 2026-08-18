<template>
  <div class="app-container dashboard">
    <!-- 欢迎行 -->
    <el-card shadow="never" class="mb12">
      <div class="welcome-row">
        <div>
          <div class="welcome-title">{{ greeting }}，{{ userStore.name }}</div>
          <div class="welcome-sub">{{ todayStr }} · 科研管理平台工作台</div>
        </div>
        <el-tag v-for="r in roleLabels" :key="r" class="role-tag" effect="plain">{{ r }}</el-tag>
      </div>
    </el-card>

    <!-- 统计卡片行 -->
    <el-row :gutter="12" class="mb12" v-loading="loading">
      <el-col :xs="12" :sm="8" :md="4" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" class="stat-card" @click="card.path && $router.push(card.path)">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <!-- 待办事项 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel-card">
          <template #header><span class="panel-title">待办事项</span></template>
          <el-empty v-if="todos.length === 0" description="暂无待办" :image-size="60" />
          <div
            v-for="(todo, i) in todos"
            :key="i"
            class="todo-item"
            @click="$router.push(todo.path)"
          >
            <el-icon class="todo-icon"><Bell /></el-icon>
            <span class="todo-title">{{ todo.title }}</span>
            <el-icon class="todo-arrow"><ArrowRight /></el-icon>
          </div>
        </el-card>
      </el-col>

      <!-- 预警信息 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">预警信息</span>
              <el-link type="primary" :underline="false" @click="$router.push('/biz/notify')">全部</el-link>
            </div>
          </template>
          <el-empty v-if="alerts.length === 0" description="暂无预警信息" :image-size="60" />
          <div v-for="a in alerts" :key="a.notifyId" class="alert-item" @click="$router.push('/biz/notify')">
            <el-tag :type="levelTagType(a.alertLevel)" size="small" class="alert-tag">{{ a.alertLevel || '预警' }}</el-tag>
            <span class="alert-title">{{ a.title }}</span>
          </div>
        </el-card>
      </el-col>

      <!-- 课题预算执行 TOP5 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel-card">
          <template #header><span class="panel-title">课题预算执行 TOP5（万元）</span></template>
          <div ref="chartRef" class="budget-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="mt12">
      <!-- 研究领域分布 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel-card">
          <template #header><span class="panel-title">研究领域分布</span></template>
          <div ref="fieldChartRef" class="dist-chart"></div>
        </el-card>
      </el-col>
      <!-- 专业分类分布 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel-card">
          <template #header><span class="panel-title">专业分类分布</span></template>
          <div ref="specialtyChartRef" class="dist-chart"></div>
        </el-card>
      </el-col>
      <!-- 在研课题进度 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">在研课题进度</span>
              <el-link type="primary" :underline="false" @click="$router.push('/biz/project')">全部</el-link>
            </div>
          </template>
          <el-empty v-if="activeProjects.length === 0" description="暂无在研课题" :image-size="60" />
          <div v-for="p in activeProjects" :key="p.projectId" class="prog-item">
            <div class="prog-head">
              <span class="prog-name" :title="p.projectName">{{ p.projectName }}</span>
              <span class="prog-pct">{{ p.progress }}%</span>
            </div>
            <el-progress :percentage="Number(p.progress)" :stroke-width="8" />
            <div class="prog-meta">组长 {{ p.leaderName || '-' }} · 已用 {{ wan(p.budgetUsed) }} 万 / 总额 {{ wan(p.budgetTotal) }} 万</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
import * as echarts from 'echarts'
import { getDashboardSummary } from '@/api/biz/dashboard'
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()
const loading = ref(false)
const summary = ref({})
const todos = ref([])
const alerts = ref([])
const chartRef = ref()
const fieldChartRef = ref()
const specialtyChartRef = ref()
const activeProjects = ref([])
let chart = null
let fieldChart = null
let specialtyChart = null

const ROLE_LABEL_MAP = {
  admin: '超级管理员', leader: '所领导', science_admin: '科研管理员',
  office: '办公人员', labor_hr: '人力科', dept_leader: '部门负责人', researcher: '科研人员'
}
const roleLabels = computed(() => (userStore.roles || []).map(r => ROLE_LABEL_MAP[r] || r))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const isResearcherOnly = computed(() => {
  const roles = userStore.roles || []
  return roles.length === 1 && roles[0] === 'researcher'
})

/** 统计卡：researcher 显示"本月工时"卡；其余角色显示"待审批"卡 */
const statCards = computed(() => {
  const s = summary.value || {}
  const cards = [
    { label: '在研课题', value: num(s.projectActive) + ' / ' + num(s.projectTotal), color: '#409eff', path: '/biz/project' },
    { label: '预算余额（万元）', value: wan(s.budgetBalance), color: '#67c23a', path: '/biz/expense' },
    { label: '在履约合同', value: num(s.contractActive) + ' / ' + num(s.contractTotal), color: '#e6a23c', path: '/biz/contract' },
    { label: '未读预警', value: num(s.alertUnread), color: '#f56c6c', path: '/biz/notify' },
    { label: '荣誉总数', value: num(s.honorTotal), color: '#9254de', path: '/biz/honor' }
  ]
  if (isResearcherOnly.value) {
    cards.push({ label: '本月工时（h）', value: num(s.worktimeMonthHours), color: '#13c2c2', path: '/biz/rd/worktime' })
  } else {
    cards.push({ label: '待处理审批', value: num(s.approvalPending), color: '#13c2c2', path: '/biz/document' })
  }
  return cards
})

function num(v) { return v === undefined || v === null ? '-' : Number(v) }
function wan(v) {
  if (v === undefined || v === null) return '-'
  return (Number(v) / 10000).toFixed(2)
}
function levelTagType(level) {
  if (level === 'HIGH' || level === 'URGENT') return 'danger'
  if (level === 'MEDIUM' || level === 'WARN') return 'warning'
  return 'info'
}

function loadSummary() {
  loading.value = true
  getDashboardSummary().then(response => {
    summary.value = response.data || {}
    todos.value = summary.value.todos || []
    alerts.value = summary.value.alerts || []
    activeProjects.value = summary.value.activeProjects || []
    nextTick(() => {
      renderChart(summary.value.budgetTop || [])
      renderDistCharts(summary.value.fieldStats || [], summary.value.specialtyStats || [])
    })
  }).finally(() => { loading.value = false })
}

/** 预算执行 TOP5 横向柱图：预算 vs 已用（万元） */
function renderChart(rows) {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const names = rows.map(r => r.name)
  const totals = rows.map(r => (Number(r.total) / 10000).toFixed(2))
  const useds = rows.map(r => (Number(r.used) / 10000).toFixed(2))
  chart.setOption({
    grid: { left: 8, right: 24, top: 28, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { data: ['预算', '已用'], top: 0 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names, inverse: true, axisLabel: { width: 90, overflow: 'truncate' } },
    series: [
      { name: '预算', type: 'bar', data: totals, barWidth: 10, itemStyle: { color: '#c6e2ff' } },
      { name: '已用', type: 'bar', data: useds, barWidth: 10, itemStyle: { color: '#409eff' } }
    ]
  })
}

/** 领域/专业分布饼图（V1.0.21） */
function renderDistCharts(fieldStats, specialtyStats) {
  if (fieldChartRef.value) {
    if (!fieldChart) fieldChart = echarts.init(fieldChartRef.value)
    fieldChart.setOption(pieOption(fieldStats))
  }
  if (specialtyChartRef.value) {
    if (!specialtyChart) specialtyChart = echarts.init(specialtyChartRef.value)
    specialtyChart.setOption(pieOption(specialtyStats))
  }
}

function pieOption(rows) {
  return {
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll', orient: 'vertical', right: 0, top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      data: (rows || []).map(r => ({ name: r.label || r.code, value: r.count }))
    }]
  }
}

function handleResize() {
  chart && chart.resize()
  fieldChart && fieldChart.resize()
  specialtyChart && specialtyChart.resize()
}

onMounted(() => {
  loadSummary()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) { chart.dispose(); chart = null }
  if (fieldChart) { fieldChart.dispose(); fieldChart = null }
  if (specialtyChart) { specialtyChart.dispose(); specialtyChart = null }
})
</script>

<style scoped lang="scss">
.mb12 { margin-bottom: 12px; }
.welcome-row { display: flex; align-items: center; justify-content: space-between; }
.welcome-title { font-size: 18px; font-weight: 600; color: #303133; }
.welcome-sub { font-size: 13px; color: #909399; margin-top: 4px; }
.role-tag { margin-left: 8px; }
.stat-card { cursor: pointer; text-align: center; }
.stat-value { font-size: 22px; font-weight: 700; line-height: 1.4; }
.stat-label { font-size: 13px; color: #909399; margin-top: 2px; }
.panel-card { min-height: 320px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; }
.panel-title { font-weight: 600; }
.todo-item {
  display: flex; align-items: center; padding: 10px 4px;
  border-bottom: 1px solid #f0f0f0; cursor: pointer;
  &:hover { background: #f5f7fa; }
}
.todo-icon { color: #e6a23c; margin-right: 8px; }
.todo-title { flex: 1; font-size: 13px; color: #303133; }
.todo-arrow { color: #c0c4cc; }
.alert-item {
  display: flex; align-items: center; padding: 10px 4px;
  border-bottom: 1px solid #f0f0f0; cursor: pointer;
  &:hover { background: #f5f7fa; }
}
.alert-tag { margin-right: 8px; flex-shrink: 0; }
.alert-title {
  font-size: 13px; color: #303133;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.budget-chart { height: 260px; }
.mt12 { margin-top: 12px; }
.dist-chart { height: 260px; }
.prog-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.prog-head { display: flex; justify-content: space-between; align-items: center; }
.prog-name { font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.prog-pct { font-size: 13px; color: #409eff; font-weight: 600; }
.prog-meta { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
