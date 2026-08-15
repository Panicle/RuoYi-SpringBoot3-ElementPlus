<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ============ tab1 工资 ============ -->
      <el-tab-pane label="工资管理" name="salary">
        <el-card class="mb8" shadow="never">
          <el-form :inline="true">
            <el-form-item label="月份">
              <el-date-picker
                v-model="salaryQuery.salaryMonth"
                type="month"
                value-format="YYYY-MM"
                placeholder="请选择月份"
                style="width: 160px"
                @change="getSalaryList"
              />
            </el-form-item>
            <el-form-item label="人员">
              <el-select
                v-model="salaryQuery.researcherId"
                placeholder="请选择人员"
                clearable
                filterable
                style="width: 200px"
                @change="getSalaryList"
              >
                <el-option
                  v-for="u in userOptions"
                  :key="u.userId"
                  :label="u.nickName || u.userName"
                  :value="u.userId"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getSalaryList">搜索</el-button>
              <el-button icon="Refresh" @click="resetSalaryQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAddSalary" v-hasPermi="['biz:rd:salary:save']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Upload" @click="handleImport" v-hasPermi="['biz:rd:salary:import']">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['biz:rd:salary:export']">导出</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="salaryLoading" :data="salaryList">
          <el-table-column label="人员" align="center" prop="researcherName" width="140" />
          <el-table-column label="月份" align="center" prop="salaryMonth" width="100" />
          <el-table-column label="月工资" align="right" width="140">
            <template #default="scope">{{ formatAmount(scope.row.monthlySalary) }}</template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
          <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleEditSalary(scope.row)" v-hasPermi="['biz:rd:salary:save']">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="salaryTotal > 0"
          :total="salaryTotal"
          v-model:page="salaryQuery.pageNum"
          v-model:limit="salaryQuery.pageSize"
          @pagination="getSalaryList"
        />

        <!-- 新增 / 编辑 工资弹窗 -->
        <el-dialog :title="salaryDialogTitle" v-model="salaryDialogOpen" width="500px" append-to-body :close-on-click-modal="false">
          <el-form ref="salaryFormRef" :model="salaryForm" :rules="salaryRules" label-width="100px">
            <el-form-item label="人员" prop="researcherId">
              <el-select v-model="salaryForm.researcherId" placeholder="请选择人员" filterable style="width: 100%">
                <el-option
                  v-for="u in userOptions"
                  :key="u.userId"
                  :label="u.nickName || u.userName"
                  :value="u.userId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="月份" prop="salaryMonth">
              <el-date-picker v-model="salaryForm.salaryMonth" type="month" value-format="YYYY-MM" placeholder="请选择月份" style="width: 100%" />
            </el-form-item>
            <el-form-item label="月工资" prop="monthlySalary">
              <el-input-number v-model="salaryForm.monthlySalary" :min="0" :precision="2" :step="100" controls-position="right" style="width: 100%" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="salaryForm.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button type="primary" :loading="salarySubmitting" @click="submitSalaryForm">确 定</el-button>
              <el-button @click="salaryDialogOpen = false">取 消</el-button>
            </div>
          </template>
        </el-dialog>

        <!-- 导入弹窗 -->
        <el-dialog title="工资导入" v-model="upload.open" width="400px" append-to-body>
          <el-upload
            ref="uploadRef"
            :limit="1"
            accept=".xlsx, .xls"
            :headers="upload.headers"
            :action="upload.url"
            :disabled="upload.isUploading"
            :on-progress="handleUploadProgress"
            :on-success="handleUploadSuccess"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :auto-upload="false"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip text-center">
                <span>仅允许导入xls、xlsx格式文件。</span>
                <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="downloadTemplate">下载模板</el-link>
              </div>
            </template>
          </el-upload>
          <template #footer>
            <div class="dialog-footer">
              <el-button type="primary" @click="submitUploadForm">确 定</el-button>
              <el-button @click="upload.open = false">取 消</el-button>
            </div>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ============ tab2 预算 ============ -->
      <el-tab-pane label="年度预算" name="budget">
        <el-card class="mb8" shadow="never">
          <el-form :inline="true">
            <el-form-item label="课题">
              <el-select
                v-model="budgetQuery.projectId"
                placeholder="请选择课题"
                clearable
                filterable
                style="width: 320px"
                @change="loadBudget"
              >
                <el-option
                  v-for="p in projectOptions"
                  :key="p.projectId"
                  :label="`${p.projectNo || ''} ${p.projectName || ''}`"
                  :value="p.projectId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="年份">
              <el-date-picker
                v-model="budgetQuery.year"
                type="year"
                value-format="YYYY"
                placeholder="请选择年份"
                style="width: 140px"
                @change="loadBudget"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Check" @click="handleSaveBudget" v-hasPermi="['biz:rd:salary:budget']">保存预算</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-empty v-if="!budgetQuery.projectId || !budgetQuery.year" description="请选择课题与年份" />

        <el-table v-else v-loading="budgetLoading" :data="budgetRows" border>
          <el-table-column label="月份" align="center" width="100">
            <template #default="scope">
              <span>{{ scope.row.month }} 月</span>
            </template>
          </el-table-column>
          <el-table-column label="预算金额（元）" align="right">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.totalAmount"
                :min="0"
                :precision="2"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="预算ID" align="center" width="100">
            <template #default="scope">
              <span>{{ scope.row.budgetId || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="RdSalary">
import { getToken } from "@/utils/auth"
import { listProject } from "@/api/biz/project"
import { listUser } from "@/api/system/user"
import {
  listSalary, saveSalary, importSalary, importSalaryTemplate, exportSalary,
  listBudget, saveBudget
} from "@/api/biz/rd"

const { proxy } = getCurrentInstance()

const activeTab = ref("salary")

// ===== 工资 =====
const userOptions = ref([])
const salaryList = ref([])
const salaryTotal = ref(0)
const salaryLoading = ref(false)
const salaryQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  salaryMonth: undefined,
  researcherId: undefined
})

const salaryDialogOpen = ref(false)
const salaryDialogTitle = ref("新增工资")
const salarySubmitting = ref(false)
const salaryFormRef = ref()
const salaryForm = reactive({
  salaryId: null,
  researcherId: null,
  salaryMonth: null,
  monthlySalary: 0,
  remark: null
})
const salaryRules = {
  researcherId: [{ required: true, message: "请选择人员", trigger: "change" }],
  salaryMonth: [{ required: true, message: "请选择月份", trigger: "change" }],
  monthlySalary: [{ required: true, message: "请输入月工资", trigger: "blur" }]
}

function loadUserOptions() {
  listUser({ pageNum: 1, pageSize: 1000 }).then(response => {
    userOptions.value = response.rows || []
  })
}

function getSalaryList() {
  salaryLoading.value = true
  listSalary({
    salaryMonth: salaryQuery.salaryMonth,
    researcherId: salaryQuery.researcherId,
    pageNum: salaryQuery.pageNum,
    pageSize: salaryQuery.pageSize
  }).then(response => {
    salaryList.value = response.rows || []
    salaryTotal.value = response.total || 0
    salaryLoading.value = false
  }).catch(() => { salaryLoading.value = false })
}

function resetSalaryQuery() {
  salaryQuery.pageNum = 1
  salaryQuery.salaryMonth = undefined
  salaryQuery.researcherId = undefined
  getSalaryList()
}

function resetSalaryForm() {
  salaryForm.salaryId = null
  salaryForm.researcherId = null
  salaryForm.salaryMonth = null
  salaryForm.monthlySalary = 0
  salaryForm.remark = null
  proxy.resetForm("salaryFormRef")
}

function handleAddSalary() {
  resetSalaryForm()
  salaryDialogTitle.value = "新增工资"
  salaryDialogOpen.value = true
}

function handleEditSalary(row) {
  resetSalaryForm()
  salaryDialogTitle.value = "编辑工资"
  salaryForm.salaryId = row.salaryId || null
  salaryForm.researcherId = row.researcherId || null
  salaryForm.salaryMonth = row.salaryMonth || null
  salaryForm.monthlySalary = Number(row.monthlySalary) || 0
  salaryForm.remark = row.remark || null
  salaryDialogOpen.value = true
}

function submitSalaryForm() {
  proxy.$refs["salaryFormRef"].validate(valid => {
    if (!valid) return
    salarySubmitting.value = true
    const payload = {
      researcherId: salaryForm.researcherId,
      salaryMonth: salaryForm.salaryMonth,
      monthlySalary: salaryForm.monthlySalary,
      remark: salaryForm.remark
    }
    saveSalary(payload).then(() => {
      proxy.$modal.msgSuccess("保存成功")
      salaryDialogOpen.value = false
      getSalaryList()
    }).finally(() => { salarySubmitting.value = false })
  })
}

// ===== 导入 =====
const upload = reactive({
  open: false,
  isUploading: false,
  headers: { Authorization: "Bearer " + getToken() },
  url: import.meta.env.VITE_APP_BASE_API + "/biz/rd/salary/importData",
  selectedFile: null
})

function handleImport() {
  upload.selectedFile = null
  upload.open = true
}

function downloadTemplate() {
  importSalaryTemplate({}).then(response => {
    const blob = new Blob([response], { type: response.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "salary_template.xlsx"
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

function handleUploadProgress() {
  upload.isUploading = true
}

function handleFileChange(file) {
  upload.selectedFile = file
}

function handleFileRemove() {
  upload.selectedFile = null
}

function handleUploadSuccess(response) {
  upload.open = false
  upload.isUploading = false
  proxy.$refs["uploadRef"].clearFiles()
  proxy.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + (response.msg || "") + "</div>", "导入结果", { dangerouslyUseHTMLString: true })
  getSalaryList()
}

function submitUploadForm() {
  const file = upload.selectedFile
  if (!file) {
    proxy.$modal.msgError("请选择文件")
    return
  }
  const name = (file.name || "").toLowerCase()
  if (!name.endsWith(".xls") && !name.endsWith(".xlsx")) {
    proxy.$modal.msgError("请选择后缀为 \"xls\" 或 \"xlsx\" 的文件")
    return
  }
  proxy.$refs["uploadRef"].submit()
}

function handleExport() {
  proxy.download("biz/rd/salary/export", {
    salaryMonth: salaryQuery.salaryMonth,
    researcherId: salaryQuery.researcherId
  }, `salary_${new Date().getTime()}.xlsx`)
}

// ===== 预算 =====
const projectOptions = ref([])
const budgetRows = ref([])
const budgetLoading = ref(false)
const budgetQuery = reactive({
  projectId: undefined,
  year: undefined
})

function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

function loadBudget() {
  budgetRows.value = []
  if (!budgetQuery.projectId || !budgetQuery.year) return
  budgetLoading.value = true
  listBudget({ projectId: budgetQuery.projectId, year: budgetQuery.year }).then(response => {
    // 后端缺月返回 budgetId=null 零值行；客户端再补齐 12 行
    const rows = response.rows || []
    const byMonth = {}
    rows.forEach(r => { if (r && r.month != null) byMonth[r.month] = r })
    const result = []
    for (let m = 1; m <= 12; m++) {
      const exist = byMonth[m]
      result.push({
        month: m,
        totalAmount: exist ? Number(exist.totalAmount) || 0 : 0,
        budgetId: exist ? exist.budgetId || null : null
      })
    }
    budgetRows.value = result
    budgetLoading.value = false
  }).catch(() => { budgetLoading.value = false })
}

function handleSaveBudget() {
  if (!budgetQuery.projectId || !budgetQuery.year) {
    proxy.$modal.msgError("请先选择课题与年份")
    return
  }
  const months = budgetRows.value.map(r => ({
    month: r.month,
    totalAmount: Number(r.totalAmount) || 0
  }))
  saveBudget({
    projectId: budgetQuery.projectId,
    year: budgetQuery.year,
    months: months
  }).then(() => {
    proxy.$modal.msgSuccess("保存成功")
    loadBudget()
  })
}

function formatAmount(val) {
  if (val == null || val === "") return "0.00"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => {
  loadUserOptions()
  loadProjectOptions()
})
</script>

<style scoped>
</style>