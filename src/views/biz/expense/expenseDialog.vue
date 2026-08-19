<template>
  <!-- 记账弹窗 -->
  <el-dialog title="经费记账" v-model="addOpen" width="620px" append-to-body :close-on-click-modal="false">
    <el-form ref="addRef" :model="addForm" :rules="addRules" label-width="100px" v-loading="addLoading">
      <el-form-item label="所属课题" prop="projectId">
        <el-select v-model="addForm.projectId" placeholder="请选择所属课题" clearable filterable style="width: 100%" @change="onProjectChange">
          <el-option
            v-for="p in projectOptions"
            :key="p.projectId"
            :label="`${p.projectNo || ''} ${p.projectName || ''}`"
            :value="p.projectId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="科目" prop="category">
        <el-select v-model="addForm.category" placeholder="请选择科目" clearable style="width: 100%">
          <el-option
            v-for="opt in categoryOptions"
            :key="opt.category"
            :label="`${budgetCategoryMap[opt.category] || opt.category}（可用余额 ${formatAmount(opt.balance)} 元）`"
            :value="opt.category"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="addForm.amount" :min="0.01" :precision="2" controls-position="right" style="width: 100%" />
        <div v-if="overBalance" class="warn-text">超出可用余额，提交将被拒绝</div>
      </el-form-item>
      <el-form-item label="日期" prop="expenseDate">
        <el-date-picker v-model="addForm.expenseDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择支出日期" style="width: 100%" />
      </el-form-item>
      <el-form-item label="税率(%)">
        <el-select v-model="addForm.taxRate" placeholder="请选择税率" clearable style="width: 100%">
          <el-option v-for="dict in tax_rate" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="凭证">
        <el-upload
          :action="uploadUrl"
          :headers="uploadHeaders"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
        >
          <el-button type="primary" plain icon="Upload">选择文件</el-button>
        </el-upload>
        <div v-if="addForm.voucherUrl" class="uploaded-file">
          <el-link :href="baseUrl + addForm.voucherUrl" target="_blank" type="primary" underline="never">
            <el-icon><Document /></el-icon>
            <span style="margin-left: 4px;">{{ addForm.voucherName || addForm.voucherUrl }}</span>
          </el-link>
          <el-link type="danger" underline="never" style="margin-left: 12px;" @click="clearVoucher">删除</el-link>
        </div>
      </el-form-item>
      <el-form-item label="说明" prop="description">
        <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="请输入说明" maxlength="500" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="addSubmitting" @click="submitAdd">确 定</el-button>
        <el-button @click="addOpen = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 编辑记账弹窗 -->
  <el-dialog title="编辑记账" v-model="editOpen" width="620px" append-to-body :close-on-click-modal="false">
    <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="100px" v-loading="editLoading">
      <el-form-item label="所属课题">
        <span>{{ editProjectName }}</span>
      </el-form-item>
      <el-form-item label="科目" prop="category">
        <el-select v-model="editForm.category" placeholder="请选择科目" clearable style="width: 100%">
          <el-option
            v-for="opt in editCategoryOptions"
            :key="opt.category"
            :label="editCategoryLabel(opt)"
            :value="opt.category"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="editForm.amount" :min="0.01" :precision="2" controls-position="right" style="width: 100%" />
        <div v-if="editOverBalance" class="warn-text">超出可用余额，提交将被拒绝</div>
      </el-form-item>
      <el-form-item label="日期" prop="expenseDate">
        <el-date-picker v-model="editForm.expenseDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择支出日期" style="width: 100%" />
      </el-form-item>
      <el-form-item label="税率(%)">
        <el-select v-model="editForm.taxRate" placeholder="请选择税率" clearable style="width: 100%">
          <el-option v-for="dict in tax_rate" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="凭证">
        <el-upload
          :action="uploadUrl"
          :headers="uploadHeaders"
          :show-file-list="false"
          :before-upload="handleEditBeforeUpload"
          :on-success="handleEditUploadSuccess"
          :on-error="handleEditUploadError"
        >
          <el-button type="primary" plain icon="Upload">选择文件</el-button>
        </el-upload>
        <div v-if="editForm.voucherUrl" class="uploaded-file">
          <el-link :href="baseUrl + editForm.voucherUrl" target="_blank" type="primary" underline="never">
            <el-icon><Document /></el-icon>
            <span style="margin-left: 4px;">{{ editForm.voucherName || editForm.voucherUrl }}</span>
          </el-link>
          <el-link type="danger" underline="never" style="margin-left: 12px;" @click="clearEditVoucher">删除</el-link>
        </div>
      </el-form-item>
      <el-form-item label="说明" prop="description">
        <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入说明" maxlength="500" />
      </el-form-item>
      <el-form-item>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>金额或科目变更将作废原单并新增一笔流水，历史金额不就地修改。</template>
        </el-alert>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保 存</el-button>
        <el-button @click="editOpen = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 冲销弹窗 -->
  <el-dialog title="经费冲销" v-model="refundOpen" width="520px" append-to-body :close-on-click-modal="false">
    <el-form ref="refundRef" :model="refundForm" :rules="refundRules" label-width="100px">
      <el-form-item label="原始流水">
        <span>{{ originExpense.category ? (budgetCategoryMap[originExpense.category] || originExpense.category) : '' }}　金额 {{ formatAmount(originExpense.amount) }} 元</span>
      </el-form-item>
      <el-form-item label="冲销金额" prop="amount">
        <el-input-number v-model="refundForm.amount" :min="0.01" :precision="2" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="日期" prop="expenseDate">
        <el-date-picker v-model="refundForm.expenseDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择冲销日期" style="width: 100%" />
      </el-form-item>
      <el-form-item label="说明" prop="description">
        <el-input v-model="refundForm.description" type="textarea" :rows="3" placeholder="请输入冲销说明" maxlength="500" />
      </el-form-item>
      <el-form-item>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>冲销将追加一笔负数流水，原单不受影响，操作不可撤销。</template>
        </el-alert>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="refundSubmitting" @click="submitRefund">确 定</el-button>
        <el-button @click="refundOpen = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="ExpenseDialog">
import { getToken } from "@/utils/auth"
import { listProject } from "@/api/biz/project"
import { listBudget, addExpense, refundExpense, updateExpense } from "@/api/biz/expense"
import { buildBudgetCategoryMap } from "@/views/biz/project/budgetSplit"

const { proxy } = getCurrentInstance()
const { budget_category, tax_rate } = proxy.useDict("budget_category", "tax_rate")
const budgetCategoryMap = computed(() => buildBudgetCategoryMap(budget_category.value))

const emit = defineEmits(["success"])

const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadUrl = ref(baseUrl + "/common/upload")
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() })

// ===== 记账 =====
const addOpen = ref(false)
const addLoading = ref(false)
const addSubmitting = ref(false)
const projectOptions = ref([])
const categoryOptions = ref([])
const addForm = ref({})
const addRules = {
  projectId: [{ required: true, message: "所属课题不能为空", trigger: "change" }],
  category: [{ required: true, message: "科目不能为空", trigger: "change" }],
  amount: [{ required: true, message: "金额不能为空", trigger: "blur" }],
  expenseDate: [{ required: true, message: "日期不能为空", trigger: "change" }]
}

const selectedSplit = computed(() => categoryOptions.value.find(o => o.category === addForm.value.category))
const overBalance = computed(() => {
  const split = selectedSplit.value
  if (!split || addForm.value.amount == null) return false
  return Number(addForm.value.amount) > Number(split.balance)
})

function resetAddForm() {
  addForm.value = {
    projectId: null,
    splitId: null,
    category: null,
    amount: null,
    expenseDate: null,
    taxRate: null,
    voucherUrl: null,
    voucherName: null,
    description: null
  }
  proxy.resetForm("addRef")
}

function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

function loadCategoryOptions(projectId) {
  categoryOptions.value = []
  if (!projectId) return
  listBudget({ projectId }).then(response => {
    const rows = response.rows || response.data || []
    // 记账支出不统计人工费（LABOR）
    categoryOptions.value = rows.filter(r => r.category !== 'LABOR')
  })
}

function onProjectChange(projectId) {
  addForm.value.category = null
  loadCategoryOptions(projectId)
}

/** 父组件调用打开记账弹窗；defaultProjectId 取上区当前选中课题 */
function show(defaultProjectId) {
  resetAddForm()
  addForm.value.projectId = defaultProjectId || null
  loadProjectOptions()
  loadCategoryOptions(defaultProjectId)
  addOpen.value = true
}

function submitAdd() {
  proxy.$refs["addRef"].validate(valid => {
    if (!valid) return
    addSubmitting.value = true
    const f = addForm.value
    const split = selectedSplit.value
    const payload = {
      projectId: f.projectId,
      splitId: split ? split.splitId : null,
      category: f.category,
      amount: f.amount,
      expenseDate: f.expenseDate,
      taxRate: f.taxRate,
      voucherUrl: f.voucherUrl,
      description: f.description
    }
    addExpense(payload).then(() => {
      proxy.$modal.msgSuccess("记账成功")
      addOpen.value = false
      emit("success")
    }).finally(() => { addSubmitting.value = false })
  })
}

function clearVoucher() {
  addForm.value.voucherUrl = null
  addForm.value.voucherName = null
}

function handleBeforeUpload(file) {
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    proxy.$modal.msgError("上传文件大小不能超过 50MB")
    return false
  }
  proxy.$modal.loading("正在上传文件，请稍候...")
  return true
}

function handleUploadSuccess(res) {
  proxy.$modal.closeLoading()
  if (res.code === 200) {
    addForm.value.voucherUrl = res.fileName
    addForm.value.voucherName = res.originalFilename || getFileName(res.fileName)
    proxy.$modal.msgSuccess("上传成功")
  } else {
    proxy.$modal.msgError(res.msg || "上传失败")
  }
}

function handleUploadError() {
  proxy.$modal.closeLoading()
  proxy.$modal.msgError("上传文件失败")
}

function getFileName(path) {
  if (!path) return ""
  const idx = path.lastIndexOf("/")
  return idx > -1 ? path.slice(idx + 1) : path
}

// ===== 编辑 =====
const editOpen = ref(false)
const editLoading = ref(false)
const editSubmitting = ref(false)
const editCategoryOptions = ref([])
const editForm = ref({})
const editOriginal = ref({})
const editRules = {
  category: [{ required: true, message: "科目不能为空", trigger: "change" }],
  amount: [{ required: true, message: "金额不能为空", trigger: "blur" }],
  expenseDate: [{ required: true, message: "日期不能为空", trigger: "change" }]
}

const selectedEditSplit = computed(() => editCategoryOptions.value.find(o => o.category === editForm.value.category))
const editAvailable = computed(() => {
  const split = selectedEditSplit.value
  if (!split) return 0
  const avail = Number(split.balance || 0)
  if (editOriginal.value.category === editForm.value.category) {
    return avail + Number(editOriginal.value.amount || 0)
  }
  return avail
})
const editOverBalance = computed(() => {
  if (editForm.value.amount == null) return false
  return Number(editForm.value.amount) > editAvailable.value
})
const editProjectName = computed(() => {
  const p = projectOptions.value.find(o => o.projectId === editForm.value.projectId)
  return p ? `${p.projectNo || ''} ${p.projectName || ''}` : ''
})

function loadEditCategoryOptions(projectId) {
  editCategoryOptions.value = []
  if (!projectId) return
  listBudget({ projectId }).then(response => {
    const rows = response.rows || response.data || []
    editCategoryOptions.value = rows.filter(r => r.category !== 'LABOR')
  })
}

function editCategoryLabel(opt) {
  const name = budgetCategoryMap.value[opt.category] || opt.category
  let avail = Number(opt.balance || 0)
  if (editOriginal.value.category === opt.category) {
    avail += Number(editOriginal.value.amount || 0)
  }
  return `${name}（可用 ${formatAmount(avail)} 元）`
}

function showEdit(row) {
  editOriginal.value = row || {}
  editForm.value = {
    expenseId: row ? row.expenseId : null,
    projectId: row ? row.projectId : null,
    splitId: row ? row.splitId : null,
    category: row ? row.category : null,
    amount: row ? Number(row.amount) : null,
    expenseDate: row ? row.expenseDate : null,
    taxRate: row ? row.taxRate : null,
    voucherUrl: row ? row.voucherUrl : null,
    voucherName: row ? row.voucherName : null,
    description: row ? row.description : null,
    version: row ? row.version : null
  }
  loadProjectOptions()
  loadEditCategoryOptions(row ? row.projectId : null)
  editOpen.value = true
  proxy.resetForm("editRef")
}

function submitEdit() {
  proxy.$refs["editRef"].validate(valid => {
    if (!valid) return
    editSubmitting.value = true
    const f = editForm.value
    const payload = {
      expenseId: f.expenseId,
      version: f.version,
      category: f.category,
      amount: f.amount,
      expenseDate: f.expenseDate,
      taxRate: f.taxRate,
      voucherUrl: f.voucherUrl,
      description: f.description
    }
    updateExpense(payload).then(() => {
      proxy.$modal.msgSuccess("保存成功")
      editOpen.value = false
      emit("success")
    }).finally(() => { editSubmitting.value = false })
  })
}

function clearEditVoucher() {
  editForm.value.voucherUrl = null
  editForm.value.voucherName = null
}

function handleEditBeforeUpload(file) {
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    proxy.$modal.msgError("上传文件大小不能超过 50MB")
    return false
  }
  proxy.$modal.loading("正在上传文件，请稍候...")
  return true
}

function handleEditUploadSuccess(res) {
  proxy.$modal.closeLoading()
  if (res.code === 200) {
    editForm.value.voucherUrl = res.fileName
    editForm.value.voucherName = res.originalFilename || getFileName(res.fileName)
    proxy.$modal.msgSuccess("上传成功")
  } else {
    proxy.$modal.msgError(res.msg || "上传失败")
  }
}

function handleEditUploadError() {
  proxy.$modal.closeLoading()
  proxy.$modal.msgError("上传文件失败")
}

// ===== 冲销 =====
const refundOpen = ref(false)
const refundSubmitting = ref(false)
const originExpense = ref({})
const refundForm = ref({})
const refundRules = {
  amount: [{ required: true, message: "冲销金额不能为空", trigger: "blur" }],
  expenseDate: [{ required: true, message: "日期不能为空", trigger: "change" }]
}

/** 父组件调用打开冲销弹窗，传入原始流水行（需 expenseId） */
function showRefund(row) {
  originExpense.value = row || {}
  refundForm.value = {
    originExpenseId: row ? row.expenseId : null,
    amount: null,
    expenseDate: null,
    description: null
  }
  proxy.resetForm("refundRef")
  refundOpen.value = true
}

function submitRefund() {
  proxy.$refs["refundRef"].validate(valid => {
    if (!valid) return
    proxy.$modal.confirm("确认对该笔流水冲销 " + (refundForm.value.amount || 0) + " 元吗？").then(() => {
      refundSubmitting.value = true
      const payload = {
        originExpenseId: refundForm.value.originExpenseId,
        amount: refundForm.value.amount,
        expenseDate: refundForm.value.expenseDate,
        description: refundForm.value.description
      }
      return refundExpense(payload)
    }).then(() => {
      proxy.$modal.msgSuccess("冲销成功")
      refundOpen.value = false
      emit("success")
    }).catch(() => {}).finally(() => { refundSubmitting.value = false })
  })
}

function formatAmount(val) {
  if (val == null || val === "") return "0.00"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

defineExpose({ show, showRefund, showEdit })
</script>

<style scoped>
.uploaded-file { margin-top: 8px; font-size: 13px; }
.warn-text { color: #f56c6c; font-size: 12px; margin-top: 4px; }
</style>
