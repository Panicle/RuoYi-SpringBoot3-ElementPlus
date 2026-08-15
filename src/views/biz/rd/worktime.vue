<template>
  <div class="app-container">
    <el-card class="mb8" shadow="never">
      <el-form :inline="true">
        <el-form-item label="课题">
          <el-select
            v-model="query.projectId"
            placeholder="请选择课题"
            clearable
            filterable
            style="width: 320px"
            @change="loadCalendar"
          >
            <el-option
              v-for="p in projectOptions"
              :key="p.projectId"
              :label="`${p.projectNo || ''} ${p.projectName || ''}`"
              :value="p.projectId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="人员">
          <el-select
            v-model="query.researcherId"
            placeholder="请选择人员"
            :disabled="lockedResearcher"
            filterable
            style="width: 220px"
            @change="loadCalendar"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.userId"
              :label="u.nickName || u.userName"
              :value="u.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-date-picker
            v-model="query.month"
            type="month"
            value-format="YYYY-MM"
            placeholder="请选择月份"
            style="width: 160px"
            @change="loadCalendar"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-empty v-if="!query.projectId || !query.researcherId || !query.month" description="请选择课题、人员、月份后查看日历" />

    <template v-else>
      <el-card class="mb8" shadow="never" v-loading="loading">
        <template #header>
          <div class="clearfix">
            <span class="card-title">工时填报 · {{ query.month }}（合计 {{ formatHours(displayMonthTotal) }} h）</span>
            <div style="float: right">
              <el-button type="warning" plain icon="DocumentCopy" @click="handleCopyLast" v-hasPermi="['biz:rd:worktime:copy']">复制上月</el-button>
              <el-button type="primary" icon="Check" @click="handleSave" v-hasPermi="['biz:rd:worktime:save']">保存</el-button>
            </div>
          </div>
        </template>

        <table class="cal-grid">
          <thead>
            <tr>
              <th v-for="w in weekHeaders" :key="w" :class="{ 'weekend-head': w === '六' || w === '日' }">{{ w }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(week, wi) in calendarWeeks" :key="wi">
              <td
                v-for="(cell, ci) in week"
                :key="ci"
                :class="cellClass(cell)"
              >
                <template v-if="cell.date">
                  <div class="day-head">
                    <span class="day-num">{{ cell.dayNum }}</span>
                    <span v-if="cell.dayTotalAcrossProjects > cell.rdHours" class="other-tip">
                      他课题 {{ formatHours(cell.dayTotalAcrossProjects - cell.rdHours) }} h
                    </span>
                  </div>
                  <el-input-number
                    v-model="cell.rdHours"
                    :min="0"
                    :max="24"
                    :step="0.5"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    style="width: 100%"
                  />
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </el-card>

      <el-collapse v-model="monthlyActive" class="alert-collapse">
        <el-collapse-item name="monthly">
          <template #title>
            <span class="card-title">月度汇总</span>
          </template>
          <el-table v-loading="monthlyLoading" :data="monthlyList">
            <el-table-column label="月份" align="center" prop="month" width="110" />
            <el-table-column label="人员" align="center" prop="researcherName" width="140" />
            <el-table-column label="工时合计" align="right" width="120">
              <template #default="scope">{{ formatHours(scope.row.monthlyHours) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="100">
              <template #default="scope">
                <dict-tag :options="rd_alloc_status" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
          </el-table>
          <pagination
            v-show="monthlyTotal > 0"
            :total="monthlyTotal"
            v-model:page="monthlyQuery.pageNum"
            v-model:limit="monthlyQuery.pageSize"
            @pagination="loadMonthly"
          />
        </el-collapse-item>
      </el-collapse>
    </template>
  </div>
</template>

<script setup name="RdWorktime">
import { listProject } from "@/api/biz/project"
import { listUser } from "@/api/system/user"
import { getWorktimeCalendar, saveWorktime, copyWorktimeLastMonth, listWorktimeMonthly } from "@/api/biz/rd"
import { checkPermi } from "@/utils/permission"
import useUserStore from "@/store/modules/user"

const { proxy } = getCurrentInstance()
const { rd_alloc_status } = proxy.useDict("rd_alloc_status")

const weekHeaders = ["一", "二", "三", "四", "五", "六", "日"]

const projectOptions = ref([])
const userOptions = ref([])
const currentUserId = computed(() => Number(useUserStore().id) || undefined)
// 普通用户（无 biz:rd:salary:save）锁定本人
const lockedResearcher = computed(() => !checkPermi(['biz:rd:salary:save']))

const query = reactive({
  projectId: undefined,
  researcherId: undefined,
  month: undefined
})

const loading = ref(false)
const calendarWeeks = ref([])
const monthTotal = ref(0)
// 底部展示用：编辑过程中实时求和优先；服务端 monthTotal 仅在未编辑前作为基线
const displayMonthTotal = computed(() => {
  const live = monthTotalComputed.value
  // 若前端网格尚未构造（days 为空），沿用服务端值
  const hasCell = calendarWeeks.value.some(week => week.some(cell => cell && cell.date))
  if (!hasCell) return monthTotal.value
  return live
})
// 保存原始服务端天数快照（按 workDate 索引），用于识别"被清零的原有天"
const originalDays = ref({})

const monthlyActive = ref([])
const monthlyLoading = ref(false)
const monthlyList = ref([])
const monthlyTotal = ref(0)
const monthlyQuery = reactive({ pageNum: 1, pageSize: 10 })

// ===== 课题 / 人员 =====
function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

function loadUserOptions() {
  listUser({ pageNum: 1, pageSize: 1000 }).then(response => {
    userOptions.value = response.rows || []
    if (lockedResearcher.value && currentUserId.value) {
      query.researcherId = currentUserId.value
    }
  })
}

// ===== 日历 =====
function loadCalendar() {
  if (!query.projectId || !query.researcherId || !query.month) {
    calendarWeeks.value = []
    monthTotal.value = 0
    originalDays.value = {}
    return
  }
  loading.value = true
  getWorktimeCalendar({
    projectId: query.projectId,
    researcherId: query.researcherId,
    month: query.month
  }).then(response => {
    const data = response.data || {}
    buildCalendar(data.days || [], data.monthTotal || 0)
    loading.value = false
  }).catch(() => { loading.value = false })
}

/** 按月份构造 7 列日历网格（周一为首列）；日数据填入对应格 */
function buildCalendar(days, total) {
  const [y, m] = query.month.split("-").map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0).getDate()
  // JS getDay: 0=Sun..6=Sat；映射到周一为首：Mon=0..Sun=6
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const dayMap = {}
  const originalMap = {}
  let sum = 0
  days.forEach(d => {
    const dateStr = d.workDate
    if (!dateStr) return
    const rd = Number(d.rdHours) || 0
    dayMap[dateStr] = { rdHours: rd, dayTotalAcrossProjects: Number(d.dayTotalAcrossProjects) || 0 }
    originalMap[dateStr] = rd
    sum += rd
  })
  const weeks = []
  let row = []
  for (let i = 0; i < firstWeekday; i++) row.push({ date: null })
  for (let day = 1; day <= lastDay; day++) {
    const dd = String(day).padStart(2, "0")
    const dateStr = `${y}-${m.toString().padStart(2, "0")}-${dd}`
    row.push({
      date: dateStr,
      dayNum: day,
      rdHours: dayMap[dateStr] ? dayMap[dateStr].rdHours : 0,
      dayTotalAcrossProjects: dayMap[dateStr] ? dayMap[dateStr].dayTotalAcrossProjects : 0
    })
    if (row.length === 7) {
      weeks.push(row)
      row = []
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push({ date: null })
    weeks.push(row)
  }
  calendarWeeks.value = weeks
  originalDays.value = originalMap
  // monthTotal 优先取后端，缺则前端求和
  monthTotal.value = total > 0 ? total : sum
}

const monthTotalComputed = computed(() => {
  let total = 0
  calendarWeeks.value.forEach(week => {
    week.forEach(cell => {
      if (cell.date) total += Number(cell.rdHours) || 0
    })
  })
  return total
})

function cellClass(cell) {
  if (!cell.date) return "cal-cell empty"
  const d = new Date(cell.date).getDay()
  return d === 0 || d === 6 ? "cal-cell weekend" : "cal-cell"
}

function formatHours(val) {
  const n = Number(val) || 0
  return n.toFixed(1)
}

// ===== 保存 / 复制上月 =====
function handleSave() {
  if (!query.projectId || !query.researcherId || !query.month) {
    proxy.$modal.msgError("请先选择课题 / 人员 / 月份")
    return
  }
  // 白名单 payload：所有有值的格 + 被清零的原有天（rdHours:0 且服务端原值>0）
  const days = []
  calendarWeeks.value.forEach(week => {
    week.forEach(cell => {
      if (!cell.date) return
      const rd = Number(cell.rdHours) || 0
      const original = originalDays.value[cell.date]
      if (rd > 0) {
        days.push({ workDate: cell.date, rdHours: rd })
      } else if (original && original > 0) {
        days.push({ workDate: cell.date, rdHours: 0 })
      }
    })
  })
  if (days.length === 0) {
    proxy.$modal.msgWarning("无可保存的工时")
    return
  }
  saveWorktime({
    projectId: query.projectId,
    researcherId: query.researcherId,
    month: query.month,
    days: days
  }).then(() => {
    proxy.$modal.msgSuccess("保存成功")
    loadCalendar()
  })
}

function handleCopyLast() {
  if (!query.projectId || !query.researcherId || !query.month) {
    proxy.$modal.msgError("请先选择课题 / 人员 / 月份")
    return
  }
  proxy.$modal.confirm(
    "确认复制上月工时到 " + query.month + "？已有记录的日期将跳过。"
  ).then(() => {
    return copyWorktimeLastMonth({
      projectId: query.projectId,
      researcherId: query.researcherId,
      month: query.month
    })
  }).then(response => {
    const msg = (response && response.msg) || "复制成功"
    proxy.$modal.msgSuccess(msg)
    loadCalendar()
  }).catch(() => {})
}

// ===== 月度汇总 =====
function loadMonthly() {
  if (!query.projectId) return
  monthlyLoading.value = true
  listWorktimeMonthly({
    projectId: query.projectId,
    month: query.month,
    pageNum: monthlyQuery.pageNum,
    pageSize: monthlyQuery.pageSize
  }).then(response => {
    monthlyList.value = response.rows || []
    monthlyTotal.value = response.total || 0
    monthlyLoading.value = false
  }).catch(() => { monthlyLoading.value = false })
}

watch(() => query.projectId, () => { loadMonthly() })

onMounted(() => {
  loadProjectOptions()
  loadUserOptions()
})
</script>

<style scoped>
.card-title { font-weight: 600; }
.cal-grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
.cal-grid th, .cal-grid td { border: 1px solid #ebeef5; padding: 6px; vertical-align: top; height: 90px; }
.cal-grid th { background: #f5f7fa; font-weight: 500; text-align: center; height: 36px; }
.weekend-head { color: #f56c6c; }
.cal-cell.empty { background: #fafafa; }
.cal-cell.weekend { background: #fef0f0; }
.day-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.day-num { font-size: 13px; color: #606266; }
.other-tip { font-size: 11px; color: #909399; }
.alert-collapse { background: #fff; border: 1px solid #ebeef5; border-radius: 4px; margin-top: 12px; }
</style>