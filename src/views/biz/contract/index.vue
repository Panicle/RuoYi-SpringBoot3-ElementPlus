<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="合同编号" prop="contractNo">
        <el-input
          v-model="queryParams.contractNo"
          placeholder="请输入合同编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="合同名称" prop="contractName">
        <el-input
          v-model="queryParams.contractName"
          placeholder="请输入合同名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="合同类型" prop="contractType">
        <el-select v-model="queryParams.contractType" placeholder="请选择合同类型" clearable style="width: 180px">
          <el-option
            v-for="dict in contract_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option
            v-for="dict in contract_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
          v-hasPermi="['biz:contract:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:contract:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="contractList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="合同编号" align="center" prop="contractNo" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="合同名称" align="center" prop="contractName" :show-overflow-tooltip="true" />
      <el-table-column label="所属课题" align="center" prop="projectName" :show-overflow-tooltip="true" />
      <el-table-column label="合同类型" align="center" prop="contractType" width="100">
        <template #default="scope">
          <dict-tag :options="contract_type" :value="scope.row.contractType" />
        </template>
      </el-table-column>
      <el-table-column label="对方主体" align="center" prop="partyName" :show-overflow-tooltip="true" />
      <el-table-column label="金额(元)" align="center" prop="amount" width="120">
        <template #default="scope">
          <span>{{ formatAmount(scope.row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="签订日期" align="center" prop="signDate" width="110" />
      <el-table-column label="到期日期" align="center" prop="expireDate" width="110" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="contract_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:contract:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:contract:remove']">删除</el-button>
          <el-button link type="primary" icon="Calendar" @click="openNodeDialog(scope.row)" v-hasPermi="['biz:contract:node']">节点</el-button>
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

    <!-- 新增 / 修改合同对话框 -->
    <el-dialog :title="title" v-model="open" width="760px" append-to-body :close-on-click-modal="false">
      <el-form ref="contractRef" :model="form" :rules="rules" label-width="110px" v-loading="formLoading">
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
        <el-form-item label="合同编号" prop="contractNo">
          <el-input v-model="form.contractNo" :disabled="!!form.contractId" placeholder="请输入合同编号" maxlength="50" />
        </el-form-item>
        <el-form-item label="合同名称" prop="contractName">
          <el-input v-model="form.contractName" placeholder="请输入合同名称" maxlength="200" />
        </el-form-item>
        <el-form-item label="合同类型" prop="contractType">
          <el-select v-model="form.contractType" placeholder="请选择合同类型" clearable style="width: 100%">
            <el-option
              v-for="dict in contract_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="对方主体" prop="partyType">
          <el-radio-group v-model="form.partyType" @change="onPartyTypeChange">
            <el-radio value="unit">选择合作单位</el-radio>
            <el-radio value="manual">手工填写</el-radio>
          </el-radio-group>
          <div v-if="form.partyType === 'unit'" style="margin-top: 8px;">
            <el-tree-select
              v-model="form.partyUnitId"
              :data="unitTreeOptions"
              placeholder="请选择合作单位"
              clearable
              check-strictly
              style="width: 100%"
            />
          </div>
          <div v-else style="margin-top: 8px;">
            <el-input v-model="form.partyName" placeholder="请输入对方主体名称" maxlength="200" />
          </div>
        </el-form-item>
        <el-form-item label="合同金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="签订日期" prop="signDate">
          <el-date-picker v-model="form.signDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择签订日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="生效日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择生效日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期日期" prop="expireDate">
          <el-date-picker v-model="form.expireDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择到期日期" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="!!form.contractId" label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" clearable style="width: 100%">
            <el-option
              v-for="dict in contract_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="合同附件">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            class="contract-upload"
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
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 履约节点管理弹窗 -->
    <node-dialog ref="nodeDialogRef" />
  </div>
</template>

<script setup name="Contract">
import { getToken } from "@/utils/auth"
import { listContract, addContract, updateContract, delContract, getContract } from "@/api/biz/contract"
import { listProject } from "@/api/biz/project"
import { treeUnit } from "@/api/biz/unit"
import NodeDialog from "./nodeDialog.vue"

const { proxy } = getCurrentInstance()
const { contract_type, contract_status } = proxy.useDict(
  "contract_type",
  "contract_status"
)

const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadUrl = ref(baseUrl + "/common/upload")
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() })

const contractList = ref([])
const open = ref(false)
const loading = ref(true)
const formLoading = ref(false)
const submitLoading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const total = ref(0)
const title = ref("")
const projectOptions = ref([])
const unitTreeOptions = ref([])
// 对方主体二选一：unit = 走合作单位，manual = 手工填名称（与 form.partyType 同步）
const nodeDialogRef = ref()

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    contractNo: undefined,
    contractName: undefined,
    contractType: undefined,
    status: undefined
  },
  rules: {
    projectId: [{ required: true, message: "所属课题不能为空", trigger: "change" }],
    contractNo: [{ required: true, message: "合同编号不能为空", trigger: "blur" }],
    contractName: [{ required: true, message: "合同名称不能为空", trigger: "blur" }],
    contractType: [{ required: true, message: "合同类型不能为空", trigger: "change" }],
    partyType: [
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error("请选择对方主体填写方式"))
          } else if (value === "unit" && !form.value.partyUnitId) {
            callback(new Error("请选择合作单位"))
          } else if (value === "manual" && !form.value.partyName) {
            callback(new Error("请输入对方主体名称"))
          } else {
            callback()
          }
        },
        trigger: "change"
      }
    ]
  }
})
const { form, queryParams, rules } = toRefs(data)

/** 查询合同列表 */
function getList() {
  loading.value = true
  listContract(queryParams.value).then(response => {
    contractList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 加载课题下拉选项（拉一次全量，受数据权限过滤） */
function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

/**
 * 后端 /biz/unit/treeselect 返回标准 TreeSelect（id/label/children）。
 * el-tree-select 回显依赖默认 value 字段反查 label（element-plus issue #18236），
 * 统一映射为 { value, label, children } 默认结构，避免自定义 props.value 的版本回显缺陷。
 */
function mapUnitTreeOptions(nodes) {
  return (nodes || []).map(node => ({
    value: node.id,
    label: node.label,
    disabled: !!node.disabled,
    children: node.children && node.children.length ? mapUnitTreeOptions(node.children) : undefined
  }))
}

/** 加载合作单位树 */
function loadUnitTree() {
  treeUnit().then(response => {
    unitTreeOptions.value = mapUnitTreeOptions(response.data || [])
  })
}

/** 切换对方主体填写方式 */
function onPartyTypeChange(val) {
  // 切换时清空对方主体字段
  if (val === "unit") {
    form.value.partyName = undefined
  } else {
    form.value.partyUnitId = undefined
  }
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

/** 上传成功 */
function handleUploadSuccess(res) {
  proxy.$modal.closeLoading()
  if (res.code === 200) {
    const fileName = res.originalFilename || getFileName(res.fileName)
    form.value.fileUrl = res.fileName
    form.value.fileName = fileName
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

/** 表单重置 */
function reset() {
  form.value = {
    contractId: null,
    projectId: null,
    contractNo: null,
    contractName: null,
    contractType: null,
    partyType: "unit",
    partyUnitId: null,
    partyName: null,
    amount: null,
    signDate: null,
    startDate: null,
    expireDate: null,
    status: null,
    fileUrl: null,
    fileName: null,
    remark: null
  }
  proxy.resetForm("contractRef")
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

/** 多选（保留勾选行 id 备用；当前工具栏无批量动作，仅记 ids） */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.contractId)
}

/** 新增 */
function handleAdd() {
  reset()
  loadProjectOptions()
  loadUnitTree()
  open.value = true
  title.value = "新增合同"
}

/** 修改 */
function handleUpdate(row) {
  reset()
  const contractId = row.contractId || ids.value
  formLoading.value = true
  loadProjectOptions()
  loadUnitTree()
  getContract(contractId).then(response => {
    const data = response.data
    // 回显对方主体：partyUnitId 非空 → unit；空 → manual
    form.value = {
      ...data,
      partyType: data.partyUnitId ? "unit" : "manual"
    }
    // 兜底：若详情返回的 projectId 不在课题下拉列表（超 1000 条被截/无权限漏掉），
    // 临时补一条选项避免下拉显示裸 id
    if (data.projectId && !projectOptions.value.some(p => p.projectId === data.projectId)) {
      projectOptions.value = [
        {
          projectId: data.projectId,
          projectNo: data.projectNo || "",
          projectName: data.projectName || ""
        },
        ...projectOptions.value
      ]
    }
    formLoading.value = false
    open.value = true
    title.value = "修改合同"
  }).catch(() => { formLoading.value = false })
}

/** 提交：白名单字段，避免多余字段入参；nullable 字段显式 null 让后端落库 */
function submitForm() {
  proxy.$refs["contractRef"].validate(valid => {
    if (!valid) return
    submitLoading.value = true
    const f = form.value
    const isUnit = f.partyType === "unit"
    const payload = {
      contractId: f.contractId,
      projectId: f.projectId,
      contractNo: f.contractNo,
      contractName: f.contractName,
      contractType: f.contractType,
      // 二选一校验：选单位 → 后端按单位快照写 partyName；手填 → 后端用 partyName
      partyUnitId: isUnit ? f.partyUnitId : null,
      partyName: isUnit ? null : f.partyName,
      amount: f.amount,
      signDate: f.signDate,
      startDate: f.startDate,
      expireDate: f.expireDate,
      status: f.status,
      fileUrl: f.fileUrl,
      remark: f.remark
    }
    if (f.contractId != null) {
      updateContract(payload).then(() => {
        proxy.$modal.msgSuccess("修改成功")
        open.value = false
        getList()
      }).finally(() => { submitLoading.value = false })
    } else {
      addContract(payload).then(() => {
        proxy.$modal.msgSuccess("新增成功")
        open.value = false
        getList()
      }).finally(() => { submitLoading.value = false })
    }
  })
}

/** 删除 */
function handleDelete(row) {
  const contractIds = row.contractId || ids.value
  proxy.$modal.confirm('是否确认删除合同"' + (row.contractName || contractIds) + '"？删除将级联清理该合同所有履约节点。').then(function () {
    return delContract(contractIds)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    getList()
  }).catch(() => {})
}

/** 导出 */
function handleExport() {
  proxy.download("biz/contract/export", {
    ...queryParams.value
  }, `contract_${new Date().getTime()}.xlsx`)
}

/** 打开节点管理弹窗 */
function openNodeDialog(row) {
  nodeDialogRef.value.show(row)
}

/** 金额格式化 */
function formatAmount(val) {
  if (val == null || val === "") return "-"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

getList()
</script>

<style scoped>
.contract-upload { display: inline-block; }
.uploaded-file { margin-top: 8px; font-size: 13px; }
</style>
