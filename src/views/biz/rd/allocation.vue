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
            @change="onQueryChange"
          >
            <el-option
              v-for="p in projectOptions"
              :key="p.projectId"
              :label="`${p.projectNo || ''} ${p.projectName || ''}`"
              :value="p.projectId"
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
            @change="onQueryChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="DataAnalysis" @click="handleCalc" v-hasPermi="['biz:rd:alloc:calc']">计算</el-button>
          <el-button type="success" icon="Check" @click="handleConfirm" v-hasPermi="['biz:rd:alloc:confirm']">确认</el-button>
          <el-button type="danger" icon="RefreshLeft" @click="handleRevoke" v-hasPermi="['biz:rd:alloc:revoke']">撤销确认</el-button>
          <el-button type="warning" plain icon="Download" @click="handleExportWorktime" v-hasPermi="['biz:rd:alloc:export']">导出工时表</el-button>
          <el-button type="warning" plain icon="Download" @click="handleExportAllocation" v-hasPermi="['biz:rd:alloc:export']">导出分摊表</el-button>
          <el-button type="info" plain icon="Folder" @click="openSummaryDialog" v-hasPermi="['biz:rd:alloc:summary']">多课题汇总导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-empty v-if="!query.projectId || !query.month" description="请选择课题与月份查看分摊信息" />

    <template v-else>
      <!-- 汇总卡 -->
      <el-card class="mb8" shadow="never" v-loading="dashboardLoading">
        <template #header>
          <div class="clearfix">
            <span class="card-title">分摊汇总</span>
            <div style="float: right">
              <el-tag v-if="dashboard.status && dashboard.status !== 'NONE'" :type="statusTagType(dashboard.status)" size="large">
                {{ statusLabel(dashboard.status) }}
              </el-tag>
              <el-tag v-if="dashboard.closed === true" type="success" size="large" style="margin-left: 6px">已闭合</el-tag>
              <el-tag v-else-if="dashboard.closed === false" type="warning" size="large" style="margin-left: 6px">未闭合</el-tag>
            </div>
          </div>
        </template>
        <el-alert
          v-if="dashboard.status === 'NONE' && dashboard.hint"
          type="info"
          :title="dashboard.hint"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-row :gutter="12">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">年度预算 B</div>
              <div class="stat-value">{{ formatAmount(dashboard.budget) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">Σ 分摊</div>
              <div class="stat-value">{{ formatAmount(dashboard.sumAlloc) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">Σ 附加费</div>
              <div class="stat-value">{{ formatAmount(dashboard.sumSurcharge) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">Σ 工资及附加费</div>
              <div class="stat-value">{{ formatAmount(dashboard.sumGrand) }}</div>
            </div>
          </el-col>
        </el-row>
        <el-alert
          v-if="allocLastNegative"
          type="warning"
          title="分摊超支警告：累计差额为负，存在超支风险"
          show-icon
          :closable="false"
          style="margin-top: 12px"
        />
      </el-card>

      <!-- 明细表 -->
      <el-card class="mb8" shadow="never" v-loading="listLoading">
        <template #header>
          <span class="card-title">分摊明细</span>
        </template>

        <el-empty v-if="!listLoading && allocList.length === 0" description="暂无分摊批次，请先确认有预算与工时，再点击「计算」生成草稿" />

        <el-table v-else :data="allocList" row-key="allocId">
          <el-table-column type="expand">
            <template #default="scope">
              <div class="surcharge-detail">
                <h4 class="detail-title">附加费明细</h4>
                <el-table :data="surchargeDetailRows(scope.row.surchargeDetail)" border size="small">
                  <el-table-column label="项目" align="center" prop="label" width="180" />
                  <el-table-column label="金额" align="right">
                    <template #default="d">{{ formatAmount(d.row.amount) }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="人员" align="center" prop="researcherName" width="140" />
          <el-table-column label="工时" align="right" width="100">
            <template #default="scope">{{ formatHours(scope.row.monthlyHours) }}</template>
          </el-table-column>
          <el-table-column label="小时费率" align="right" width="120">
            <template #default="scope">
              <span v-if="scope.row.hourlyRate != null">{{ formatAmount(scope.row.hourlyRate) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="分摊金额" align="right" width="140">
            <template #default="scope">{{ formatAmount(scope.row.allocatedAmount) }}</template>
          </el-table-column>
          <el-table-column label="附加费" align="right" width="140">
            <template #default="scope">{{ formatAmount(scope.row.surchargeTotal) }}</template>
          </el-table-column>
          <el-table-column label="合计" align="right" width="160">
            <template #default="scope">{{ formatAmount(scope.row.grandTotal) }}</template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template #default="scope">
              <dict-tag :options="rd_alloc_status" :value="scope.row.status" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <!-- 多课题汇总导出弹窗 -->
    <el-dialog title="多课题年度汇总导出" v-model="summaryDialog.open" width="420px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="年份">
          <el-date-picker v-model="summaryDialog.year" type="year" value-format="YYYY" placeholder="请选择年份" style="width: 100%" />
        </el-form-item>
        <el-form-item label="课题">
          <el-select v-model="summaryDialog.projectIds" multiple collapse-tags placeholder="不选则全部课题" filterable style="width: 100%">
            <el-option
              v-for="p in projectOptions"
              :key="p.projectId"
              :label="`${p.projectNo || ''} ${p.projectName || ''}`"
              :value="p.projectId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitSummaryExport">导出</el-button>
          <el-button @click="summaryDialog.open = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RdAllocation">
import { listProject } from "@/api/biz/project"
import {
  calcAllocation, listAllocation, confirmAllocation, revokeAllocation,
  getAllocationDashboard, exportWorktime, exportAllocation, exportSummary
} from "@/api/biz/rd"

const { proxy } = getCurrentInstance()
const { rd_alloc_status, rd_surcharge_rate } = proxy.useDict("rd_alloc_status", "rd_surcharge_rate")

const projectOptions = ref([])
const query = reactive({ projectId: undefined, month: undefined })

const dashboard = ref({})
const dashboardLoading = ref(false)
// calc 返回的负尾差标志（dashboard 不带该字段，单独维护以驱动黄条）
const allocLastNegative = ref(false)

const allocList = ref([])
const listLoading = ref(false)

// ===== 课题 =====
function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

// ===== 加载 =====
function onQueryChange() {
  allocLastNegative.value = false
  if (!query.projectId || !query.month) {
    dashboard.value = {}
    allocList.value = []
    return
  }
  loadDashboard()
  loadList()
}

function loadDashboard() {
  dashboardLoading.value = true
  getAllocationDashboard({ projectId: query.projectId, month: query.month }).then(response => {
    dashboard.value = response.data || {}
    dashboardLoading.value = false
  }).catch(() => { dashboardLoading.value = false })
}

function loadList() {
  listLoading.value = true
  listAllocation({ projectId: query.projectId, month: query.month, pageNum: 1, pageSize: 200 }).then(response => {
    allocList.value = response.rows || response.data || []
    listLoading.value = false
  }).catch(() => { listLoading.value = false })
}

// ===== 操作 =====
function handleCalc() {
  if (!query.projectId || !query.month) {
    proxy.$modal.msgError("请先选择课题与月份")
    return
  }
  proxy.$modal.confirm(
    "确认计算 " + query.month + " 的分摊批次？将重建草稿批次，已确认批次将被覆盖。"
  ).then(() => {
    return calcAllocation({ projectId: query.projectId, month: query.month })
  }).then(response => {
    const data = (response && response.data) || {}
    const summary = data.summary || null
    const msg = (response && response.msg) || (summary ? "计算完成" : "无有效工时")
    proxy.$modal.msgSuccess(msg)
    if (summary) {
      // 有批次：直接用返回数据刷新，省一次 /list + /dashboard 调用
      dashboard.value = {
        ...dashboard.value,
        budget: summary.budget,
        sumAlloc: summary.sumAlloc,
        sumSurcharge: summary.sumSurcharge,
        sumGrand: summary.sumGrand,
        memberCount: summary.memberCount,
        status: data.rows && data.rows.length > 0 ? "DRAFT" : dashboard.value.status
      }
      allocList.value = data.rows || []
      allocLastNegative.value = data.allocLastNegative === true
    } else {
      // 无有效工时：重新拉取 dashboard/list 获取权威 hint 展示
      loadDashboard()
      loadList()
    }
  }).catch(() => {})
}

function handleConfirm() {
  if (!query.projectId || !query.month) {
    proxy.$modal.msgError("请先选择课题与月份")
    return
  }
  proxy.$modal.confirm("确认提交 " + query.month + " 的分摊结果？提交后不可直接编辑。").then(() => {
    return confirmAllocation({ projectId: query.projectId, month: query.month })
  }).then(() => {
    proxy.$modal.msgSuccess("已确认")
    onQueryChange()
  }).catch(() => {})
}

function handleRevoke() {
  if (!query.projectId || !query.month) {
    proxy.$modal.msgError("请先选择课题与月份")
    return
  }
  proxy.$modal.prompt("请输入撤销原因（必填）", "撤销确认").then(({ value }) => {
    if (!value || !value.trim()) {
      proxy.$modal.msgError("请填写撤销原因")
      return Promise.reject()
    }
    return revokeAllocation({ projectId: query.projectId, month: query.month, reason: value.trim() })
  }).then(() => {
    proxy.$modal.msgSuccess("已撤销")
    onQueryChange()
  }).catch(() => {})
}

function handleExportWorktime() {
  if (!query.projectId || !query.month) {
    proxy.$modal.msgError("请先选择课题与月份")
    return
  }
  proxy.download("biz/rd/export/worktime", {
    projectId: query.projectId,
    month: query.month
  }, `worktime_${query.month}.xlsx`)
}

function handleExportAllocation() {
  if (!query.projectId || !query.month) {
    proxy.$modal.msgError("请先选择课题与月份")
    return
  }
  proxy.download("biz/rd/export/allocation", {
    projectId: query.projectId,
    month: query.month
  }, `allocation_${query.month}.xlsx`)
}

// ===== 多课题汇总导出 =====
const summaryDialog = reactive({
  open: false,
  year: undefined,
  projectIds: []
})

function openSummaryDialog() {
  summaryDialog.year = query.month ? query.month.slice(0, 4) : String(new Date().getFullYear())
  summaryDialog.projectIds = []
  summaryDialog.open = true
}

function submitSummaryExport() {
  if (!summaryDialog.year) {
    proxy.$modal.msgError("请选择年份")
    return
  }
  const payload = { year: summaryDialog.year }
  if (summaryDialog.projectIds && summaryDialog.projectIds.length > 0) {
    payload.projectIds = summaryDialog.projectIds
  }
  exportSummary(payload).then(response => {
    const blob = new Blob([response], { type: response.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `rd_summary_${summaryDialog.year}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
    summaryDialog.open = false
  })
}

// ===== 附加费明细解析 =====
function surchargeDetailRows(raw) {
  if (!raw) return []
  let parsed
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw
  } catch (e) {
    return []
  }
  if (!parsed || typeof parsed !== "object") return []
  return Object.keys(parsed).map(key => {
    const dict = rd_surcharge_rate.value.find(d => d.value === key)
    return {
      key: key,
      label: dict ? dict.label : key,
      amount: parsed[key]
    }
  })
}

// ===== 状态映射 =====
function statusTagType(status) {
  if (status === "CONFIRMED") return "success"
  if (status === "DRAFT") return "info"
  if (status === "REVOKED") return "warning"
  return ""
}

function statusLabel(status) {
  const dict = rd_alloc_status.value.find(d => d.value === status)
  return dict ? dict.label : (status || "-")
}

function formatAmount(val) {
  if (val == null || val === "") return "0.00"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatHours(val) {
  if (val == null || val === "") return "-"
  return Number(val).toFixed(1)
}

onMounted(() => {
  loadProjectOptions()
})
</script>

<style scoped>
.card-title { font-weight: 600; }
.stat-card { text-align: center; padding: 14px 0; background: #f5f7fa; border-radius: 4px; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; color: #303133; }
.surcharge-detail { padding: 0 24px 12px; }
.detail-title { margin: 8px 0; font-size: 13px; color: #606266; font-weight: 600; }
</style>