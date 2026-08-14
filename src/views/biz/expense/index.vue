<template>
  <div class="app-container">
    <!-- 顶部课题选择器 -->
    <el-card class="mb8" shadow="never">
      <el-form :inline="true">
        <el-form-item label="当前课题">
          <el-select
            v-model="selectedProjectId"
            placeholder="请选择课题"
            clearable
            filterable
            style="width: 360px"
            @change="onProjectChange"
          >
            <el-option
              v-for="p in projectOptions"
              :key="p.projectId"
              :label="`${p.projectNo || ''} ${p.projectName || ''}`"
              :value="p.projectId"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-empty v-if="!selectedProjectId" description="请先选择课题查看经费信息" />

    <template v-else>
      <!-- 上区：预算概览 -->
      <el-card class="mb8" shadow="never" v-loading="budgetLoading">
        <template #header>
          <div class="clearfix">
            <span class="card-title">预算概览</span>
            <div style="float: right">
              <el-button type="primary" icon="Edit" @click="handleAdjustBudget" v-hasPermi="['biz:expense:budget']">调整预算</el-button>
            </div>
          </div>
        </template>

        <el-row :gutter="12" class="mb8">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">预算总额</div>
              <div class="stat-value">{{ formatAmount(summaryBudgetTotal) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">已用金额</div>
              <div class="stat-value">{{ formatAmount(summaryUsedTotal) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">预算余额</div>
              <div class="stat-value">{{ formatAmount(summaryBalanceTotal) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">预警数</div>
              <div class="stat-value" :class="{ 'stat-danger': summaryAlertCount > 0 }">{{ summaryAlertCount }}</div>
            </div>
          </el-col>
        </el-row>

        <el-table :data="budgetRows" border :row-class-name="budgetRowClassName">
          <el-table-column label="科目" align="center" prop="category" width="140">
            <template #default="scope">
              <dict-tag :options="budget_category" :value="scope.row.category" />
            </template>
          </el-table-column>
          <el-table-column label="预算金额" align="right" width="140">
            <template #default="scope">{{ formatAmount(scope.row.budgetAmount) }}</template>
          </el-table-column>
          <el-table-column label="已用金额" align="right" width="140">
            <template #default="scope">{{ formatAmount(scope.row.usedAmount) }}</template>
          </el-table-column>
          <el-table-column label="余额" align="right" width="140">
            <template #default="scope">{{ formatAmount(scope.row.balance) }}</template>
          </el-table-column>
          <el-table-column label="进度" align="center" min-width="160">
            <template #default="scope">
              <el-progress
                :percentage="progressPercent(scope.row)"
                :color="progressColor(scope.row)"
                :stroke-width="12"
              />
            </template>
          </el-table-column>
          <el-table-column label="预警" align="center" width="100">
            <template #default="scope">
              <dict-tag v-if="scope.row.warnLevel" :options="alert_level" :value="scope.row.warnLevel" />
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 下区：经费流水 -->
      <el-card class="mb8" shadow="never">
        <template #header>
          <span class="card-title">经费流水</span>
        </template>

        <el-form :model="expenseQuery" ref="expenseQueryRef" :inline="true">
          <el-form-item label="科目" prop="category">
            <el-select v-model="expenseQuery.category" placeholder="请选择科目" clearable style="width: 180px">
              <el-option
                v-for="dict in budget_category"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="expenseQuery.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option
                v-for="dict in expense_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="支出日期">
            <el-date-picker
              v-model="dateRange"
              value-format="YYYY-MM-DD"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAddExpense" v-hasPermi="['biz:expense:add']">记账</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['biz:expense:export']">导出</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="expenseLoading" :data="expenseList">
          <el-table-column label="日期" align="center" prop="expenseDate" width="110" />
          <el-table-column label="科目" align="center" width="120">
            <template #default="scope">
              <dict-tag :options="budget_category" :value="scope.row.category" />
            </template>
          </el-table-column>
          <el-table-column label="金额" align="right" width="120">
            <template #default="scope">{{ formatAmount(scope.row.amount) }}</template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="90">
            <template #default="scope">
              <dict-tag :options="expense_status" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="说明" prop="description" :show-overflow-tooltip="true" />
          <el-table-column label="凭证" align="center" width="90">
            <template #default="scope">
              <el-link v-if="scope.row.voucherUrl" type="primary" :href="baseUrl + scope.row.voucherUrl" target="_blank" underline="never">查看</el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
            <template #default="scope">
              <template v-if="scope.row.status === 'NORMAL'">
                <el-button link type="primary" icon="RefreshLeft" @click="handleRefund(scope.row)" v-hasPermi="['biz:expense:add']">冲销</el-button>
                <el-button link type="danger" icon="Close" @click="handleVoid(scope.row)" v-hasPermi="['biz:expense:void']">作废</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="expenseTotal > 0"
          :total="expenseTotal"
          v-model:page="expenseQuery.pageNum"
          v-model:limit="expenseQuery.pageSize"
          @pagination="getExpenseList"
        />
      </el-card>

      <!-- 预警区 -->
      <el-collapse v-model="alertActive" class="alert-collapse">
        <el-collapse-item name="alert">
          <template #title>
            <span class="card-title">经费预警（{{ alertList.length }}）</span>
          </template>
          <el-table v-loading="alertLoading" :data="alertList">
            <el-table-column label="级别" align="center" width="100">
              <template #default="scope">
                <dict-tag :options="alert_level" :value="scope.row.alertLevel" />
              </template>
            </el-table-column>
            <el-table-column label="标题" prop="title" :show-overflow-tooltip="true" />
            <el-table-column label="时间" align="center" prop="createTime" width="170" />
            <el-table-column label="操作" align="center" width="120">
              <template #default="scope">
                <el-button
                  v-if="scope.row.status !== 'HANDLED'"
                  link
                  type="primary"
                  icon="Check"
                  @click="handleAlertDone(scope.row)"
                  v-hasPermi="['biz:expense:alert']"
                >标记已处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </template>

    <!-- 预算调整弹窗 -->
    <budget-dialog ref="budgetDialogRef" @success="onBudgetChanged" />
    <!-- 记账 / 冲销弹窗 -->
    <expense-dialog ref="expenseDialogRef" @success="onExpenseChanged" />
  </div>
</template>

<script setup name="Expense">
import { listProject } from "@/api/biz/project"
import { listBudget, getBudgetSummary, listExpense, voidExpense, listExpenseAlert, handleExpenseAlert } from "@/api/biz/expense"
import { BUDGET_CATEGORIES } from "@/views/biz/project/budgetSplit"
import BudgetDialog from "./budgetDialog.vue"
import ExpenseDialog from "./expenseDialog.vue"

const { proxy } = getCurrentInstance()
const { budget_category, expense_status, alert_level } = proxy.useDict("budget_category", "expense_status", "alert_level")

const baseUrl = import.meta.env.VITE_APP_BASE_API

const projectOptions = ref([])
const selectedProjectId = ref(undefined)

const budgetDialogRef = ref()
const expenseDialogRef = ref()

// ===== 预算概览 =====
const budgetLoading = ref(false)
const budgetSplitList = ref([])
const budgetSummary = ref({})

const budgetRows = computed(() => {
  const splitMap = {}
  ;(budgetSplitList.value || []).forEach(s => { if (s && s.category) splitMap[s.category] = s })
  const summaryMap = {}
  ;(budgetSummary.value.splits || []).forEach(s => { if (s && s.category) summaryMap[s.category] = s })
  return BUDGET_CATEGORIES.map(category => {
    const row = splitMap[category] || { category, budgetAmount: 0, usedAmount: 0, balance: 0, version: 0 }
    const fromSummary = summaryMap[category]
    const warnLevel = fromSummary && fromSummary.warnLevel !== undefined ? fromSummary.warnLevel : calcWarnLevel(row)
    return { ...row, category, warnLevel }
  })
})

const summaryBudgetTotal = computed(() => {
  if (budgetSummary.value.budgetTotal != null) return budgetSummary.value.budgetTotal
  return budgetRows.value.reduce((sum, r) => sum + (Number(r.budgetAmount) || 0), 0)
})
const summaryUsedTotal = computed(() => {
  if (budgetSummary.value.usedTotal != null) return budgetSummary.value.usedTotal
  return budgetRows.value.reduce((sum, r) => sum + (Number(r.usedAmount) || 0), 0)
})
const summaryBalanceTotal = computed(() => {
  if (budgetSummary.value.balanceTotal != null) return budgetSummary.value.balanceTotal
  return budgetRows.value.reduce((sum, r) => sum + (Number(r.balance) || 0), 0)
})
const summaryAlertCount = computed(() => {
  if (budgetSummary.value.alertCount != null) return budgetSummary.value.alertCount
  return budgetRows.value.filter(r => r.warnLevel).length
})

/** 双阈值预警兜底计算（后端 summary 未返回 warnLevel 时使用）：balance<=0 → CRITICAL；balance<=1000 或 balance/budget<=5% → WARN */
function calcWarnLevel(row) {
  const budget = Number(row.budgetAmount) || 0
  const balance = Number(row.balance) || 0
  if (balance <= 0) return "CRITICAL"
  if (balance <= 1000) return "WARN"
  if (budget > 0 && balance / budget <= 0.05) return "WARN"
  return null
}

function budgetRowClassName({ row }) {
  if (row.warnLevel === "CRITICAL") return "row-critical"
  if (row.warnLevel === "WARN") return "row-warn"
  return ""
}

function progressPercent(row) {
  const budget = Number(row.budgetAmount) || 0
  if (budget <= 0) return 0
  const pct = (Number(row.usedAmount) || 0) / budget * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

function progressColor(row) {
  if (row.warnLevel === "CRITICAL") return "#f56c6c"
  if (row.warnLevel === "WARN") return "#e6a23c"
  return "#409eff"
}

function loadBudget() {
  if (!selectedProjectId.value) return
  budgetLoading.value = true
  listBudget({ projectId: selectedProjectId.value }).then(response => {
    budgetSplitList.value = response.rows || response.data || []
    budgetLoading.value = false
  }).catch(() => { budgetLoading.value = false })
}

function loadSummary() {
  if (!selectedProjectId.value) return
  getBudgetSummary(selectedProjectId.value).then(response => {
    budgetSummary.value = response.data || {}
  })
}

function handleAdjustBudget() {
  const p = projectOptions.value.find(o => o.projectId === selectedProjectId.value) || { projectId: selectedProjectId.value }
  budgetDialogRef.value.show(p)
}

function onBudgetChanged() {
  loadBudget()
  loadSummary()
  loadAlerts()
}

// ===== 经费流水 =====
const expenseLoading = ref(false)
const expenseList = ref([])
const expenseTotal = ref(0)
const dateRange = ref([])
const expenseQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  category: undefined,
  status: undefined
})

function getExpenseList() {
  if (!selectedProjectId.value) return
  expenseLoading.value = true
  const query = proxy.addDateRange({ ...expenseQuery, projectId: selectedProjectId.value }, dateRange.value, "ExpenseDate")
  listExpense(query).then(response => {
    expenseList.value = response.rows || []
    expenseTotal.value = response.total || 0
    expenseLoading.value = false
  }).catch(() => { expenseLoading.value = false })
}

function handleQuery() {
  expenseQuery.pageNum = 1
  getExpenseList()
}

function resetQuery() {
  proxy.resetForm("expenseQueryRef")
  dateRange.value = []
  handleQuery()
}

function handleAddExpense() {
  expenseDialogRef.value.show(selectedProjectId.value)
}

function handleRefund(row) {
  expenseDialogRef.value.showRefund(row)
}

function onExpenseChanged() {
  getExpenseList()
  loadBudget()
  loadSummary()
  loadAlerts()
}

/** 作废：二次确认 + 输入原因写 remark */
function handleVoid(row) {
  proxy.$modal.prompt('确认作废该笔流水？请输入作废原因').then(({ value }) => {
    return voidExpense(row.expenseId, { version: row.version, remark: value })
  }).then(() => {
    proxy.$modal.msgSuccess("作废成功")
    onExpenseChanged()
  }).catch(() => {})
}

function handleExport() {
  const query = proxy.addDateRange({ ...expenseQuery, projectId: selectedProjectId.value }, dateRange.value, "ExpenseDate")
  proxy.download("biz/expense/export", query, `expense_${new Date().getTime()}.xlsx`)
}

// ===== 预警区 =====
const alertActive = ref(["alert"])
const alertLoading = ref(false)
const alertList = ref([])

function loadAlerts() {
  if (!selectedProjectId.value) return
  alertLoading.value = true
  listExpenseAlert({ projectId: selectedProjectId.value }).then(response => {
    alertList.value = response.rows || response.data || []
    alertLoading.value = false
  }).catch(() => { alertLoading.value = false })
}

function handleAlertDone(row) {
  proxy.$modal.confirm("确认标记该预警为已处理吗？").then(() => {
    return handleExpenseAlert(row.alertId)
  }).then(() => {
    proxy.$modal.msgSuccess("已标记处理")
    loadAlerts()
  }).catch(() => {})
}

// ===== 课题选择 =====
function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

function onProjectChange() {
  expenseQuery.pageNum = 1
  if (!selectedProjectId.value) {
    budgetSplitList.value = []
    budgetSummary.value = {}
    expenseList.value = []
    expenseTotal.value = 0
    alertList.value = []
    return
  }
  loadBudget()
  loadSummary()
  getExpenseList()
  loadAlerts()
}

function formatAmount(val) {
  if (val == null || val === "") return "0.00"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

loadProjectOptions()
</script>

<style scoped>
.card-title { font-weight: 600; }
.stat-card { text-align: center; padding: 10px 0; background: #f5f7fa; border-radius: 4px; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 20px; font-weight: 600; color: #303133; }
.stat-danger { color: #f56c6c; }
.alert-collapse { background: #fff; border: 1px solid #ebeef5; border-radius: 4px; }
:deep(.row-critical) { --el-table-tr-bg-color: #fef0f0; }
:deep(.row-warn) { --el-table-tr-bg-color: #fdf6ec; }
</style>
