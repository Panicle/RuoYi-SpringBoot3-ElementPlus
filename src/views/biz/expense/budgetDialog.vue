<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="760px" append-to-body :close-on-click-modal="false">
    <div v-loading="loading">
      <div v-for="group in BUDGET_GROUPS" :key="group.title" class="budget-group">
        <div class="budget-group-title">{{ group.title }}</div>
        <div class="budget-item-grid">
          <div v-for="category in group.categories" :key="category" class="budget-item">
            <span class="budget-label">{{ budgetCategoryMap[category] || category }}</span>
            <el-input-number
              v-model="amountMap[category]"
              :min="0"
              :precision="2"
              controls-position="right"
              style="width: 100%"
            />
          </div>
        </div>
      </div>

      <el-alert v-if="indirectOverLimit" type="error" :closable="false" show-icon class="limit-alert">
        <template #title>
          间接费超监管上限：上限 {{ formatAmount(indirectLimit) }} 元（基数 × {{ (indirectRate * 100).toFixed(0) }}%），实际 {{ formatAmount(amountMap.INDIRECT) }} 元
        </template>
      </el-alert>
      <el-alert v-if="outsourcingOverLimit" type="error" :closable="false" show-icon class="limit-alert">
        <template #title>
          委外费超监管上限：上限 {{ formatAmount(outsourcingLimit) }} 元（基数 × 30%），实际 {{ formatAmount(amountMap.OUTSOURCING) }} 元
        </template>
      </el-alert>

      <div class="budget-total">预算总额：<span class="budget-total-value">{{ formatAmount(totalAmount) }}</span></div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        <el-button @click="visible = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="BudgetDialog">
import { listBudget, adjustBudget } from "@/api/biz/expense"
import { BUDGET_GROUPS, BUDGET_CATEGORIES, buildBudgetCategoryMap } from "@/views/biz/project/budgetSplit"

const { proxy } = getCurrentInstance()
const { budget_category } = proxy.useDict("budget_category")
const budgetCategoryMap = computed(() => buildBudgetCategoryMap(budget_category.value))

const emit = defineEmits(["success"])

const visible = ref(false)
const loading = ref(false)
const submitLoading = ref(false)
const currentProject = ref({})
const dialogTitle = computed(() => "预算调整 - " + (currentProject.value.projectName || `课题 #${currentProject.value.projectId || ""}`))

// 科目金额（编辑值）与 version（乐观锁，随 splits 原样回传）
const amountMap = reactive({})
const versionMap = reactive({})

const totalAmount = computed(() => {
  let total = 0
  BUDGET_CATEGORIES.forEach(c => {
    const v = amountMap[c]
    if (typeof v === "number" && !Number.isNaN(v)) total += v
  })
  return total
})

// 监管上限：直接费 = 七项直接费科目之和；基数 B = 直接费 - EQUIPMENT
const directCategories = ["LABOR", "EQUIPMENT", "MATERIAL", "TESTING", "FUEL", "TRAVEL", "PUBLICATION"]
const directTotal = computed(() => directCategories.reduce((sum, c) => sum + (Number(amountMap[c]) || 0), 0))
const baseB = computed(() => directTotal.value - (Number(amountMap.EQUIPMENT) || 0))
const indirectRate = computed(() => {
  const b = baseB.value
  if (b <= 5000000) return 0.3
  if (b <= 10000000) return 0.25
  return 0.2
})
const indirectLimit = computed(() => baseB.value > 0 ? Number((baseB.value * indirectRate.value).toFixed(2)) : 0)
const outsourcingLimit = computed(() => baseB.value > 0 ? Number((baseB.value * 0.3).toFixed(2)) : 0)
const indirectOverLimit = computed(() => baseB.value > 0 && (Number(amountMap.INDIRECT) || 0) > indirectLimit.value)
const outsourcingOverLimit = computed(() => baseB.value > 0 && (Number(amountMap.OUTSOURCING) || 0) > outsourcingLimit.value)

/** 父组件调用打开：传入课题行（需 projectId），拉取当前预算分劈回显 */
function show(project) {
  currentProject.value = project || {}
  visible.value = true
  loadSplits()
}

function loadSplits() {
  if (!currentProject.value.projectId) return
  loading.value = true
  listBudget({ projectId: currentProject.value.projectId }).then(response => {
    const splits = response.rows || response.data || []
    // 先全部置 0/0，未在 list 中出现的科目也保底能提交（但因 §2.1 唯一索引，后端再决定 upsert）
    BUDGET_CATEGORIES.forEach(c => { amountMap[c] = 0; versionMap[c] = 0 })
    splits.forEach(s => {
      if (s && s.category && BUDGET_CATEGORIES.includes(s.category)) {
        amountMap[s.category] = s.budgetAmount == null ? 0 : Number(s.budgetAmount)
        // version 必须保留 null —— 后端据此走 INSERT（库中不存在该科目）而非 UPDATE（乐观锁）
        versionMap[s.category] = s.version
      }
    })
    loading.value = false
  }).catch(() => { loading.value = false })
}

/** 提交：每行携带 version（乐观锁，从 list 接口原样回传）。
 *  显式保留 version=null：后端据此对库中不存在的新科目走 INSERT 路径；
 *  若为数字则走乐观锁 UPDATE，零影响行则返回"已被他人修改"。
 *  不要用 `version: versionMap[category] == null ? 0 : ...` 把 null 吞成 0，否则新科目会被错误地 UPDATE。
 */
function submitForm() {
  submitLoading.value = true
  const splits = BUDGET_CATEGORIES.map(category => ({
    category,
    budgetAmount: amountMap[category] == null ? 0 : amountMap[category],
    version: versionMap[category] == null ? null : versionMap[category]
  }))
  adjustBudget({ projectId: currentProject.value.projectId, splits }).then(() => {
    proxy.$modal.msgSuccess("预算调整成功")
    visible.value = false
    emit("success")
  }).catch(err => {
    // 乐观锁冲突：提示已由请求拦截器展示，这里仅自动刷新当前弹窗内的预算行。
    // 拦截器 code=500 时 reject(new Error(msg))，err.message 即后端原始文案；
    // 其余分支可能 reject 字符串，故三路兜底取文案（终审 P1-1 加固）。
    const msg = (err && err.message) || (err && err.msg) || String(err || "")
    if (msg.includes("已被他人修改")) {
      loadSplits()
    }
  }).finally(() => { submitLoading.value = false })
}

function formatAmount(val) {
  if (val == null || val === "") return "0.00"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

defineExpose({ show })
</script>

<style scoped>
.budget-group { margin-bottom: 14px; }
.budget-group-title { font-weight: 600; color: #303133; margin-bottom: 8px; }
.budget-item-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.budget-item { display: flex; flex-direction: column; gap: 4px; }
.budget-label { font-size: 13px; color: #606266; }
.budget-total { margin-top: 12px; color: #303133; }
.budget-total-value { font-size: 16px; color: #f56c6c; font-weight: 600; }
.limit-alert { margin-top: 10px; }
</style>
