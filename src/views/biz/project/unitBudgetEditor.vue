<template>
  <div class="unit-budget-box">
    <div v-for="u in unitList" :key="u.key" class="unit-card">
      <div class="unit-card-header">
        <el-tag v-if="u.isHost" type="primary" size="small">主持单位</el-tag>
        <el-tag v-else-if="u.cooperationType === 'COLLABORATE'" type="info" size="small">协作单位</el-tag>
        <el-tag v-else type="warning" size="small">参与单位</el-tag>
        <template v-if="u.isHost">
          <span class="unit-name">{{ unitDisplayName(u) }}</span>
          <span class="unit-total">小计 {{ formatBudget(unitBudgetTotal(u)) }}</span>
        </template>
        <template v-else-if="u.cooperationType === 'COLLABORATE'">
          <span class="unit-name">{{ unitDisplayName(u) }}</span>
          <el-button link type="danger" icon="Delete" @click="removeUnit(u)">移除</el-button>
        </template>
        <template v-else>
          <el-select v-model="u.cooperationType" size="small" style="width: 120px">
            <el-option v-for="d in participantTypeOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <span class="unit-name">{{ unitDisplayName(u) }}</span>
          <span class="unit-total">小计 {{ formatBudget(unitBudgetTotal(u)) }}</span>
          <el-button link type="danger" icon="Delete" @click="removeUnit(u)">移除</el-button>
        </template>
      </div>
      <table v-if="u.cooperationType !== 'COLLABORATE'" class="budget-table">
        <thead><tr><th>科目</th><th>预算数（元）</th></tr></thead>
        <tbody>
          <template v-for="group in BUDGET_GROUPS" :key="group.title">
            <tr class="budget-group-row"><td colspan="2" class="budget-group-title">{{ group.title }}</td></tr>
            <tr v-for="category in group.categories" :key="category">
              <td class="budget-sub">{{ budgetCategoryMap[category] || category }}</td>
              <td><el-input-number v-model="u.budget[category]" :min="0" :precision="2" controls-position="right" style="width: 100%" /></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="unit-add-bar">
      <span class="add-label">添加单位：</span>
      <el-select v-model="pendingCompanyId" placeholder="参与单位（二级公司）" clearable filterable size="small" style="width: 190px">
        <el-option v-for="c in availableCompanyOptions" :key="c.id" :label="c.label" :value="c.id" />
      </el-select>
      <el-button type="primary" plain size="small" icon="Plus" @click="addParticipant">参与</el-button>
      <el-select v-model="pendingUnitId" placeholder="协作单位（合作单位）" clearable filterable size="small" style="width: 190px">
        <el-option v-for="c in unitOptions" :key="c.unitId" :label="c.unitName" :value="c.unitId" />
      </el-select>
      <el-button type="primary" plain size="small" icon="Plus" @click="addCollaborator">协作</el-button>
    </div>
  </div>
</template>

<script setup name="UnitBudgetEditor">
import { deptTreeSelect } from "@/api/system/user"
import { listUnit } from "@/api/biz/unit"
import { BUDGET_GROUPS, BUDGET_CATEGORIES, buildBudgetCategoryMap } from "./budgetSplit"

/**
 * 按单位经费支出预算编辑器（V1.0.23）。
 * - 主持单位固定（hostUnitId 对应集团二级公司 dept_id，不可删）
 * - 参与单位可增删（从二级公司选，带合作类型 cooperation_type 下拉，不选 COLLABORATE）
 * - 协作单位可增删（从合作单位 listUnit 选，cooperation_type=COLLABORATE，不录预算）
 * - 每单位一套 10 科目明细（BUDGET_CATEGORIES）
 *
 * 组件自加载部门树（二级公司 + deptId→名称）与合作单位列表，供 index.vue / detail.vue 复用。
 */
const props = defineProps({
  /** 主持单位 dept_id（集团二级公司） */
  hostUnitId: { type: [Number, String], default: null }
})

const { proxy } = getCurrentInstance()
const { budget_category, cooperation_type } = proxy.useDict("budget_category", "cooperation_type")

const budgetCategoryMap = computed(() => buildBudgetCategoryMap(budget_category.value))
const participantTypeOptions = computed(() => (cooperation_type.value || []).filter(d => d.value !== "COLLABORATE"))

/** 二级公司选项（集团 root 的直接子节点，仅启用） */
const companyOptions = ref([])
/** 合作单位选项（协作单位来源） */
const unitOptions = ref([])
/** deptId → deptName 映射（展示用） */
const deptNameMap = ref({})

/** 单位列表：主持(1) + 参与(N) + 协作(N) */
const unitList = ref([])
let seq = 0
const pendingCompanyId = ref(undefined)
const pendingUnitId = ref(undefined)

/** 编辑回显时传入的 project_unit 关联行（用于计算增删差异） */
const loadedAssociations = ref([])

/** 主持单位变化 → 就地更新 host 行（清空预算防串单位）；尚无 host 行时先建行（防 reset/load 时序竞态） */
watch(() => props.hostUnitId, (val) => {
  const host = unitList.value.find(u => u.isHost)
  if (!host) {
    if (val == null) return
    const h = { key: "host", deptId: Number(val), unitId: Number(val), cooperationType: "LEAD", name: "", isHost: true, projectUnitId: null, budget: {} }
    BUDGET_CATEGORIES.forEach(c => { h.budget[c] = undefined })
    unitList.value = [h]
    return
  }
  const newId = val == null ? null : Number(val)
  if (host.deptId === newId) return
  host.deptId = newId
  host.unitId = newId
  BUDGET_CATEGORIES.forEach(c => { host.budget[c] = undefined })
})

function unitDisplayName(u) {
  if (u.isHost) return deptNameMap.value[u.deptId] || u.name || "本单位"
  // 参与/主持单位（dept 来源）：优先按 deptId 映射部门名（部门树异步加载后回显）
  if (u.cooperationType !== "COLLABORATE" && u.deptId != null) {
    return deptNameMap.value[u.deptId] || u.name
  }
  return u.name
}

function unitBudgetTotal(u) {
  let total = 0
  BUDGET_CATEGORIES.forEach(c => {
    const v = u.budget[c]
    if (typeof v === "number" && !Number.isNaN(v)) total += v
  })
  return total
}

/** 预算合计 = Σ 所有单位所有科目（仅主持 + 参与单位，协作不录预算） */
const budgetTotal = computed(() => {
  let total = 0
  unitList.value.forEach(u => {
    if (u.cooperationType === "COLLABORATE") return
    total += unitBudgetTotal(u)
  })
  return total
})

const availableCompanyOptions = computed(() => {
  const used = new Set(unitList.value.filter(u => u.deptId != null).map(u => Number(u.deptId)))
  return companyOptions.value.filter(c => !used.has(Number(c.id)))
})

function addParticipant() {
  const id = pendingCompanyId.value
  if (id == null) {
    proxy.$modal.msgWarning("请选择参与单位")
    return
  }
  const c = companyOptions.value.find(x => Number(x.id) === Number(id))
  if (!c) return
  const budget = {}
  BUDGET_CATEGORIES.forEach(cat => { budget[cat] = undefined })
  unitList.value.push({
    key: "p" + (++seq),
    deptId: Number(id),
    unitId: Number(id),
    cooperationType: "PARTICIPANT",
    name: c.label,
    isHost: false,
    projectUnitId: null,
    budget
  })
  pendingCompanyId.value = undefined
}

function addCollaborator() {
  const id = pendingUnitId.value
  if (id == null) {
    proxy.$modal.msgWarning("请选择协作单位")
    return
  }
  const u = unitOptions.value.find(x => Number(x.unitId) === Number(id))
  if (!u) return
  unitList.value.push({
    key: "c" + (++seq),
    deptId: null,
    unitId: Number(id),
    cooperationType: "COLLABORATE",
    name: u.unitName,
    isHost: false,
    projectUnitId: null,
    budget: {}
  })
  pendingUnitId.value = undefined
}

function removeUnit(u) {
  if (u.isHost) return
  unitList.value = unitList.value.filter(x => x.key !== u.key)
}

/** 新增：仅主持单位 */
function reset(hostUnitId) {
  loadedAssociations.value = []
  const host = {
    key: "host",
    deptId: hostUnitId == null ? null : Number(hostUnitId),
    unitId: hostUnitId == null ? null : Number(hostUnitId),
    cooperationType: "LEAD",
    name: "",
    isHost: true,
    projectUnitId: null,
    budget: {}
  }
  BUDGET_CATEGORIES.forEach(c => { host.budget[c] = undefined })
  unitList.value = [host]
  pendingCompanyId.value = undefined
  pendingUnitId.value = undefined
}

/** 编辑回显：hostUnitId + project_unit 关联行 + project_unit_budget 行 */
function load({ units, unitBudgets, hostUnitId }) {
  loadedAssociations.value = units || []
  const host = {
    key: "host",
    deptId: hostUnitId == null ? null : Number(hostUnitId),
    unitId: hostUnitId == null ? null : Number(hostUnitId),
    cooperationType: "LEAD",
    name: "",
    isHost: true,
    projectUnitId: null,
    budget: unitBudgetRowsForDept(unitBudgets, hostUnitId)
  }
  const list = [host]
  ;(units || []).forEach(row => {
    if (hostUnitId != null && Number(row.unitId) === Number(hostUnitId)) {
      return // host 已在列表，跳过
    }
    if (row.cooperationType === "COLLABORATE") {
      list.push({
        key: "c" + (++seq),
        deptId: null,
        unitId: Number(row.unitId),
        cooperationType: "COLLABORATE",
        name: row.unitName || "协作单位",
        isHost: false,
        projectUnitId: row.id || null,
        budget: {}
      })
    } else {
      const deptId = Number(row.unitId != null ? row.unitId : row.deptId)
      list.push({
        key: "p" + (++seq),
        deptId,
        unitId: deptId,
        cooperationType: row.cooperationType || "PARTICIPANT",
        name: deptNameMap.value[deptId] || row.unitName || "",
        isHost: false,
        projectUnitId: row.id || null,
        budget: unitBudgetRowsForDept(unitBudgets, deptId)
      })
    }
  })
  unitList.value = list
  pendingCompanyId.value = undefined
  pendingUnitId.value = undefined
}

function unitBudgetRowsForDept(unitBudgets, deptId) {
  const m = {}
  BUDGET_CATEGORIES.forEach(c => { m[c] = undefined })
  ;(unitBudgets || []).forEach(r => {
    if (r && Number(r.deptId) === Number(deptId) && BUDGET_CATEGORIES.includes(r.category)) {
      m[r.category] = r.budgetAmount == null ? undefined : Number(r.budgetAmount)
    }
  })
  return m
}

/** 提交 payload：每单位每科目一行 {deptId, category, budgetAmount}（仅主持 + 参与） */
function buildUnitBudgetList() {
  const list = []
  unitList.value.forEach(u => {
    if (u.cooperationType === "COLLABORATE" || u.deptId == null) return
    BUDGET_CATEGORIES.forEach(category => {
      list.push({
        deptId: u.deptId,
        category,
        budgetAmount: u.budget[category] == null ? 0 : u.budget[category]
      })
    })
  })
  return list
}

/**
 * 与后端 project_unit 关联的增删差异（由具备 biz:project:unit 权限的父组件执行）：
 * - toAdd: 当前表单中无 project_unit 行 id 的非主持单位（新增）
 * - toRemoveIds: 加载时存在但当前已移除的 project_unit 行 id
 */
function getAssociationChanges() {
  const currentNonHostIds = new Set(unitList.value.filter(u => !u.isHost).map(u => Number(u.unitId)))
  const toAdd = unitList.value
    .filter(u => !u.isHost && !u.projectUnitId)
    .map(u => ({ unitId: Number(u.unitId), cooperationType: u.cooperationType }))
  const toRemoveIds = (loadedAssociations.value || [])
    .filter(a => !currentNonHostIds.has(Number(a.unitId)))
    .map(a => a.id)
  return { toAdd, toRemoveIds }
}

function formatBudget(val) {
  if (val == null || val === "") return "-"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 自加载部门树（二级公司 + 名称映射）与合作单位
function loadTree() {
  deptTreeSelect().then(response => {
    const tree = response.data || []
    const map = {}
    const walk = (nodes) => {
      ;(nodes || []).forEach(n => {
        if (n.id != null) map[Number(n.id)] = n.label
        walk(n.children)
      })
    }
    walk(tree)
    deptNameMap.value = map
    // 二级公司 = 集团 root 的直接子节点（root 的 children）
    const root = tree[0] || {}
    companyOptions.value = (root.children || [])
      .filter(n => n.status === "0" || n.status === 0 || n.status == null)
      .map(n => ({ id: Number(n.id), label: n.label }))
  })
  listUnit().then(response => {
    unitOptions.value = response.data || []
  })
}

loadTree()

defineExpose({ budgetTotal, reset, load, buildUnitBudgetList, getAssociationChanges, companyOptions, unitList })
</script>

<style scoped>
.unit-budget-box { width: 100%; }
.unit-card { border: 1px solid #ebeef5; border-radius: 4px; margin-bottom: 10px; overflow: hidden; }
.unit-card-header { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f5f7fa; }
.unit-name { font-weight: 600; color: #303133; }
.unit-total { margin-left: auto; color: #f56c6c; font-weight: 600; font-size: 13px; }
.unit-add-bar { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.add-label { color: #606266; font-size: 13px; }
.budget-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.budget-table th, .budget-table td { border: 1px solid #ebeef5; padding: 4px 8px; text-align: left; }
.budget-table th { background: #fafafa; font-weight: 500; }
.budget-group-row td { background: #f5f7fa; }
.budget-group-title { font-weight: 600; color: #303133; }
.budget-sub { padding-left: 20px !important; color: #606266; }
</style>
