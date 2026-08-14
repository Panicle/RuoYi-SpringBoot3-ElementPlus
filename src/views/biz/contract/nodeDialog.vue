<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="900px" append-to-body :close-on-click-modal="false">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['biz:contract:node']">新增节点</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="nodeList">
      <el-table-column label="节点名称" align="center" prop="nodeName" :show-overflow-tooltip="true" />
      <el-table-column label="节点类型" align="center" prop="nodeType" width="110">
        <template #default="scope">
          <dict-tag :options="node_type" :value="scope.row.nodeType" />
        </template>
      </el-table-column>
      <el-table-column label="计划日期" align="center" prop="planDate" width="140">
        <template #default="scope">
          <span>{{ scope.row.planDate }}</span>
          <el-tag v-if="scope.row.overdue" type="danger" size="small" effect="plain" style="margin-left: 6px;">已逾期</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="实际日期" align="center" prop="actualDate" width="110" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="node_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="凭证" align="center" width="120">
        <template #default="scope">
          <el-link v-if="scope.row.voucherUrl" type="primary" :href="baseUrl + scope.row.voucherUrl" target="_blank" underline="never">查看</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:contract:node']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:contract:node']">删除</el-button>
          <el-button link type="primary" icon="Check" @click="openFinishDialog(scope.row)" v-hasPermi="['biz:contract:node']" v-if="scope.row.status !== 'DONE'">完成</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 节点 新增/修改 对话框 -->
    <el-dialog :title="nodeTitle" v-model="nodeOpen" width="520px" append-to-body :close-on-click-modal="false">
      <el-form ref="nodeRef" :model="nodeForm" :rules="nodeRules" label-width="100px">
        <el-form-item label="节点名称" prop="nodeName">
          <el-input v-model="nodeForm.nodeName" placeholder="请输入节点名称" maxlength="200" :disabled="nodeForm.status === 'DONE'" />
        </el-form-item>
        <el-form-item label="节点类型" prop="nodeType">
          <el-select v-model="nodeForm.nodeType" placeholder="请选择节点类型" clearable style="width: 100%" :disabled="nodeForm.status === 'DONE'">
            <el-option
              v-for="dict in node_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" prop="planDate">
          <el-date-picker v-model="nodeForm.planDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择计划日期" style="width: 100%" :disabled="nodeForm.status === 'DONE'" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="nodeForm.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="nodeSubmitting" @click="submitNode">确 定</el-button>
          <el-button @click="nodeOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 节点 完成 对话框（actualDate 必填 + voucherUrl 上传可选） -->
    <el-dialog title="完成节点" v-model="finishOpen" width="520px" append-to-body :close-on-click-modal="false">
      <el-form ref="finishRef" :model="finishForm" :rules="finishRules" label-width="100px">
        <el-form-item label="节点">
          <span>{{ currentNode?.nodeName }}</span>
        </el-form-item>
        <el-form-item label="实际日期" prop="actualDate">
          <el-date-picker v-model="finishForm.actualDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择实际完成日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="完成凭证">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleVoucherSuccess"
            :on-error="handleUploadError"
          >
            <el-button type="primary" plain icon="Upload">上传凭证</el-button>
          </el-upload>
          <div v-if="finishForm.voucherUrl" class="uploaded-file">
            <el-link :href="baseUrl + finishForm.voucherUrl" target="_blank" type="primary" underline="never">
              <span>{{ finishForm.voucherName || getFileName(finishForm.voucherUrl) }}</span>
            </el-link>
            <el-link type="danger" underline="never" style="margin-left: 12px;" @click="finishForm.voucherUrl = null">删除</el-link>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="finishSubmitting" @click="submitFinish">确 定</el-button>
          <el-button @click="finishOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup name="ContractNodeDialog">
import { getToken } from "@/utils/auth"
import { listNode, addNode, updateNode, delNode, finishNode } from "@/api/biz/contract"

const { proxy } = getCurrentInstance()
const { node_type, node_status } = proxy.useDict("node_type", "node_status")

const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadUrl = ref(baseUrl + "/common/upload")
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() })

const visible = ref(false)
const loading = ref(false)
const dialogTitle = ref("履约节点")
const currentContract = ref({})
const currentNode = ref(null)
const nodeList = ref([])

const nodeOpen = ref(false)
const nodeTitle = ref("")
const nodeSubmitting = ref(false)
const nodeForm = ref({})
const nodeRules = {
  nodeName: [{ required: true, message: "节点名称不能为空", trigger: "blur" }],
  nodeType: [{ required: true, message: "节点类型不能为空", trigger: "change" }],
  planDate: [{ required: true, message: "计划日期不能为空", trigger: "change" }]
}

const finishOpen = ref(false)
const finishSubmitting = ref(false)
const finishForm = ref({})
const finishRules = {
  actualDate: [{ required: true, message: "实际完成日期不能为空", trigger: "change" }]
}

/** 父组件调用打开；每次 show() 重置 currentContract/currentNode，避免父页面跨实例串扰 */
function show(row) {
  currentContract.value = row || {}
  dialogTitle.value = "履约节点 - " + (currentContract.value.contractName || `合同 #${currentContract.value.contractId || ''}`)
  visible.value = true
  currentNode.value = null
  getNodes()
}

/** 查询节点列表 */
function getNodes() {
  if (!currentContract.value.contractId) {
    nodeList.value = []
    return
  }
  loading.value = true
  listNode({ contractId: currentContract.value.contractId }).then(response => {
    nodeList.value = response.data || []
    loading.value = false
  }).catch(() => { loading.value = false })
}

function resetNodeForm() {
  nodeForm.value = {
    nodeId: null,
    contractId: currentContract.value.contractId,
    nodeName: null,
    nodeType: null,
    planDate: null,
    status: null,
    remark: null
  }
  proxy.resetForm("nodeRef")
}

function resetFinishForm(row) {
  // 一次性写入 nodeId：节点完成动作只对单一节点生效，关闭后被 show() 重置
  finishForm.value = {
    nodeId: row?.nodeId,
    actualDate: null,
    voucherUrl: null,
    voucherName: null
  }
  proxy.resetForm("finishRef")
}

function handleAdd() {
  resetNodeForm()
  nodeTitle.value = "新增节点"
  nodeOpen.value = true
}

function handleUpdate(row) {
  resetNodeForm()
  // 编辑：保留 status，便于模板渲染 disabled
  nodeForm.value = {
    nodeId: row.nodeId,
    contractId: currentContract.value.contractId,
    nodeName: row.nodeName,
    nodeType: row.nodeType,
    planDate: row.planDate,
    status: row.status,
    remark: row.remark
  }
  nodeTitle.value = "修改节点"
  nodeOpen.value = true
}

/** 提交：白名单字段，避免把 overdue/status/actualDate 一起 PUT */
function submitNode() {
  proxy.$refs["nodeRef"].validate(valid => {
    if (!valid) return
    nodeSubmitting.value = true
    const f = nodeForm.value
    const payload = {
      nodeId: f.nodeId,
      contractId: currentContract.value.contractId,
      nodeName: f.nodeName,
      nodeType: f.nodeType,
      planDate: f.planDate,
      remark: f.remark
    }
    const action = payload.nodeId != null ? updateNode(payload) : addNode(payload)
    action.then(() => {
      proxy.$modal.msgSuccess(payload.nodeId != null ? "修改成功" : "新增成功")
      nodeOpen.value = false
      getNodes()
    }).finally(() => { nodeSubmitting.value = false })
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('确认删除节点"' + row.nodeName + '"吗？').then(() => {
    return delNode(row.nodeId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    getNodes()
  }).catch(() => {})
}

function openFinishDialog(row) {
  currentNode.value = row
  resetFinishForm(row)
  finishOpen.value = true
}

function submitFinish() {
  proxy.$refs["finishRef"].validate(valid => {
    if (!valid) return
    finishSubmitting.value = true
    finishNode({
      nodeId: finishForm.value.nodeId,
      actualDate: finishForm.value.actualDate,
      voucherUrl: finishForm.value.voucherUrl
    }).then(() => {
      proxy.$modal.msgSuccess("节点已完成")
      finishOpen.value = false
      getNodes()
    }).finally(() => { finishSubmitting.value = false })
  })
}

// 上传前：大小限制 50MB
function handleBeforeUpload(file) {
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    proxy.$modal.msgError("上传文件大小不能超过 50MB")
    return false
  }
  proxy.$modal.loading("正在上传文件，请稍候...")
  return true
}

// 凭证上传成功：仅完成弹窗场景触发（节点表单里没有上传控件）；文件名优先 originalFilename，回退到路径末段
function handleVoucherSuccess(res) {
  proxy.$modal.closeLoading()
  if (!finishOpen.value) return
  if (res.code === 200) {
    finishForm.value.voucherUrl = res.fileName
    finishForm.value.voucherName = res.originalFilename || getFileName(res.fileName)
    proxy.$modal.msgSuccess("上传成功")
  } else {
    proxy.$modal.msgError(res.msg || "上传失败")
  }
}

function handleUploadError() {
  proxy.$modal.closeLoading()
  proxy.$modal.msgError("上传文件失败")
}

/** 从路径中剥出文件名（兼容 '/2026/08/abc.pdf' 这种相对路径） */
function getFileName(path) {
  if (!path) return ""
  const idx = path.lastIndexOf("/")
  return idx > -1 ? path.slice(idx + 1) : path
}

defineExpose({ show })
</script>

<style scoped>
.uploaded-file { margin-top: 8px; font-size: 13px; }
</style>
