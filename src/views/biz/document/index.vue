<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="所属课题" prop="projectId">
        <el-select v-model="queryParams.projectId" placeholder="请选择所属课题" clearable filterable style="width: 220px">
          <el-option
            v-for="p in projectOptions"
            :key="p.projectId"
            :label="`${p.projectNo || ''} ${p.projectName || ''}`"
            :value="p.projectId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="阶段" prop="stage">
        <el-select v-model="queryParams.stage" placeholder="请选择阶段" clearable style="width: 160px">
          <el-option
            v-for="dict in project_stage"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审批状态" prop="approvalStatus">
        <el-select v-model="queryParams.approvalStatus" placeholder="请选择审批状态" clearable style="width: 160px">
          <el-option
            v-for="dict in approval_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="文件名" prop="fileName">
        <el-input
          v-model="queryParams.fileName"
          placeholder="请输入文件名"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['biz:document:add']"
        >上传</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="documentList">
      <el-table-column label="所属课题" align="center" prop="projectName" :show-overflow-tooltip="true" />
      <el-table-column label="阶段" align="center" prop="stage" width="100">
        <template #default="scope">
          <dict-tag :options="project_stage" :value="scope.row.stage" />
        </template>
      </el-table-column>
      <el-table-column label="文件名" align="center" min-width="200">
        <template #default="scope">
          <el-link v-if="scope.row.fileUrl" type="primary" :href="baseUrl + scope.row.fileUrl" target="_blank" underline="never">{{ scope.row.fileName }}</el-link>
          <span v-else>{{ scope.row.fileName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="提交人" align="center" width="110">
        <template #default="scope">
          <span>{{ scope.row.submitterId || scope.row.uploadBy || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计划提交日期" align="center" prop="planSubmitDate" width="120" />
      <el-table-column label="审批状态" align="center" prop="approvalStatus" width="100">
        <template #default="scope">
          <dict-tag :options="approval_status" :value="scope.row.approvalStatus" />
        </template>
      </el-table-column>
      <el-table-column label="轮次" align="center" width="80">
        <template #default="scope">
          <span>{{ scope.row.approvalRound || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="!scope.row.approvalStatus" link type="primary" icon="Promotion" @click="handleSubmit(scope.row)" v-hasPermi="['biz:document:submit']">发起审批</el-button>
          <el-button v-else-if="scope.row.approvalStatus === 'REJECTED'" link type="primary" icon="RefreshLeft" @click="handleResubmit(scope.row)" v-hasPermi="['biz:document:submit']">重报</el-button>
          <el-button v-else link type="primary" icon="History" @click="openHistoryDialog(scope.row)" v-hasPermi="['biz:approval:history']">审批历史</el-button>
          <el-button v-if="scope.row.approvalStatus === 'PENDING'" link type="primary" icon="Check" @click="openApprovalDialog(scope.row)" v-hasPermi="['biz:approval:audit']">审批</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:document:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 上传资料对话框 -->
    <el-dialog title="上传课题资料" v-model="open" width="600px" append-to-body :close-on-click-modal="false">
      <el-form ref="documentRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="所属课题" prop="projectId">
          <el-select v-model="form.projectId" placeholder="请选择所属课题" clearable filterable style="width: 100%">
            <el-option
              v-for="p in projectOptions"
              :key="p.projectId"
              :label="`${p.projectNo || ''} ${p.projectName || ''}`"
              :value="p.projectId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课题阶段" prop="stage">
          <el-select v-model="form.stage" placeholder="请选择课题阶段" clearable style="width: 100%">
            <el-option
              v-for="dict in project_stage"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="资料文件" prop="fileName">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            class="document-upload"
          >
            <el-button type="primary" plain icon="Upload">选择文件</el-button>
          </el-upload>
          <div v-if="form.fileUrl" class="uploaded-file">
            <el-link :href="baseUrl + form.fileUrl" target="_blank" type="primary" underline="never">
              <el-icon><Document /></el-icon>
              <span style="margin-left: 4px;">{{ form.fileName || form.fileUrl }}</span>
            </el-link>
            <el-link type="danger" underline="never" style="margin-left: 12px;" @click="clearUpload">删除</el-link>
          </div>
        </el-form-item>
        <el-form-item label="计划提交日期" prop="planSubmitDate">
          <el-date-picker v-model="form.planSubmitDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择计划提交日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <approval-dialog ref="approvalDialogRef" @success="getList" />
    <!-- 审批历史弹窗 -->
    <history-dialog ref="historyDialogRef" />
  </div>
</template>

<script setup name="Document">
import { getToken } from "@/utils/auth"
import { listDocument, addDocument, delDocument, submitDocument, resubmitDocument } from "@/api/biz/document"
import { listProject } from "@/api/biz/project"
import ApprovalDialog from "./approvalDialog.vue"
import HistoryDialog from "./historyDialog.vue"

const { proxy } = getCurrentInstance()
const { project_stage, approval_status } = proxy.useDict(
  "project_stage",
  "approval_status"
)

const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadUrl = ref(baseUrl + "/common/upload")
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() })

const documentList = ref([])
const open = ref(false)
const loading = ref(true)
const submitLoading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const projectOptions = ref([])
const approvalDialogRef = ref()
const historyDialogRef = ref()

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    projectId: undefined,
    stage: undefined,
    approvalStatus: undefined,
    fileName: undefined
  },
  rules: {
    projectId: [{ required: true, message: "所属课题不能为空", trigger: "change" }],
    stage: [{ required: true, message: "课题阶段不能为空", trigger: "change" }],
    fileName: [{ required: true, message: "请上传资料文件", trigger: "change" }]
  }
})
const { form, queryParams, rules } = toRefs(data)

/** 查询资料列表 */
function getList() {
  loading.value = true
  listDocument(queryParams.value).then(response => {
    documentList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

/** 加载课题下拉选项（拉一次全量，受数据权限过滤） */
function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

/** 上传前：大小限制 50MB */
function handleBeforeUpload(file) {
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    proxy.$modal.msgError("上传文件大小不能超过 50MB")
    return false
  }
  proxy.$modal.loading("正在上传文件，请稍候...")
  return true
}

/** 上传成功：取 res.fileName 存路径，展示名优先 originalFilename */
function handleUploadSuccess(res) {
  proxy.$modal.closeLoading()
  if (res.code === 200) {
    form.value.fileUrl = res.fileName
    form.value.fileName = res.originalFilename || getFileName(res.fileName)
    proxy.$modal.msgSuccess("上传成功")
  } else {
    proxy.$modal.msgError(res.msg || "上传失败")
  }
}

/** 上传失败 */
function handleUploadError() {
  proxy.$modal.closeLoading()
  proxy.$modal.msgError("上传文件失败")
}

/** 清空附件：传 null 让后端显式写入空值 */
function clearUpload() {
  form.value.fileUrl = null
  form.value.fileName = null
}

/** 从路径中剥出文件名（兼容 '/2026/08/abc.pdf' 这种相对路径） */
function getFileName(path) {
  if (!path) return ""
  const idx = path.lastIndexOf("/")
  return idx > -1 ? path.slice(idx + 1) : path
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置（显式白名单 + 可空字段显式 null） */
function reset() {
  form.value = {
    projectId: null,
    stage: null,
    fileName: null,
    fileUrl: null,
    planSubmitDate: null
  }
  proxy.resetForm("documentRef")
}

/** 搜索 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 打开上传弹窗 */
function handleAdd() {
  reset()
  loadProjectOptions()
  open.value = true
}

/** 提交上传：白名单字段，避免多余字段入参 */
function submitForm() {
  proxy.$refs["documentRef"].validate(valid => {
    if (!valid) return
    submitLoading.value = true
    const f = form.value
    const payload = {
      projectId: f.projectId,
      stage: f.stage,
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      planSubmitDate: f.planSubmitDate
    }
    addDocument(payload).then(() => {
      proxy.$modal.msgSuccess("上传成功")
      open.value = false
      getList()
    }).finally(() => { submitLoading.value = false })
  })
}

/** 发起审批 */
function handleSubmit(row) {
  proxy.$modal.confirm('确认对资料"' + row.fileName + '"发起审批吗？').then(() => {
    return submitDocument(row.docId)
  }).then(() => {
    proxy.$modal.msgSuccess("已发起审批")
    getList()
  }).catch(() => {})
}

/** 驳回重报 */
function handleResubmit(row) {
  proxy.$modal.confirm('确认对资料"' + row.fileName + '"重新提交审批吗？').then(() => {
    return resubmitDocument(row.docId)
  }).then(() => {
    proxy.$modal.msgSuccess("已重新提交")
    getList()
  }).catch(() => {})
}

/** 删除（PENDING/APPROVED 审批的资料后端拒删） */
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除资料"' + row.fileName + '"？审批中或已通过的资料不可删除。').then(() => {
    return delDocument(row.docId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    getList()
  }).catch(() => {})
}

/** 打开审批弹窗（仅 PENDING 行触发） */
function openApprovalDialog(row) {
  approvalDialogRef.value.show(row)
}

/** 打开审批历史弹窗 */
function openHistoryDialog(row) {
  historyDialogRef.value.show(row)
}

getList()
</script>

<style scoped>
.document-upload { display: inline-block; }
.uploaded-file { margin-top: 8px; font-size: 13px; }
</style>
