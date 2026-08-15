<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="荣誉名称" prop="honorName">
        <el-input
          v-model="queryParams.honorName"
          placeholder="请输入荣誉名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="荣誉类型" prop="honorType">
        <el-select v-model="queryParams.honorType" placeholder="请选择荣誉类型" clearable style="width: 160px">
          <el-option
            v-for="dict in honor_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="获奖级别" prop="awardLevel">
        <el-select v-model="queryParams.awardLevel" placeholder="请选择获奖级别" clearable style="width: 160px">
          <el-option
            v-for="dict in honor_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="获奖日期">
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
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['biz:honor:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:honor:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          v-hasPermi="['biz:honor:remove']"
        >批量删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="honorList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="荣誉名称" align="center" prop="honorName" :show-overflow-tooltip="true" />
      <el-table-column label="荣誉类型" align="center" prop="honorType" width="110">
        <template #default="scope">
          <dict-tag :options="honor_type" :value="scope.row.honorType" />
        </template>
      </el-table-column>
      <el-table-column label="获奖级别" align="center" prop="awardLevel" width="110">
        <template #default="scope">
          <dict-tag :options="honor_level" :value="scope.row.awardLevel" />
        </template>
      </el-table-column>
      <el-table-column label="颁奖机构" align="center" prop="awardOrg" :show-overflow-tooltip="true" />
      <el-table-column label="获奖日期" align="center" prop="awardDate" width="120" />
      <el-table-column label="证书" align="center" width="120">
        <template #default="scope">
          <el-link
            v-if="scope.row.certificateUrl"
            type="primary"
            :href="baseUrl + scope.row.certificateUrl"
            target="_blank"
            underline="never"
          >{{ scope.row.certificateNo || '查看' }}</el-link>
          <span v-else>{{ scope.row.certificateNo || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:honor:edit']">修改</el-button>
          <el-button link type="primary" icon="Connection" @click="openRelationDialog(scope.row)" v-hasPermi="['biz:honor:query']">关联管理</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:honor:remove']">删除</el-button>
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

    <!-- 新增/修改荣誉对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body :close-on-click-modal="false">
      <el-form ref="honorRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="荣誉名称" prop="honorName">
          <el-input v-model="form.honorName" placeholder="请输入荣誉名称" maxlength="200" />
        </el-form-item>
        <el-form-item label="荣誉类型" prop="honorType">
          <el-select v-model="form.honorType" placeholder="请选择荣誉类型" clearable style="width: 100%">
            <el-option
              v-for="dict in honor_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖级别" prop="awardLevel">
          <el-select v-model="form.awardLevel" placeholder="请选择获奖级别" clearable style="width: 100%">
            <el-option
              v-for="dict in honor_level"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="颁奖机构" prop="awardOrg">
          <el-input v-model="form.awardOrg" placeholder="请输入颁奖机构" maxlength="200" />
        </el-form-item>
        <el-form-item label="获奖日期" prop="awardDate">
          <el-date-picker v-model="form.awardDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择获奖日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="证书编号" prop="certificateNo">
          <el-input v-model="form.certificateNo" placeholder="请输入证书编号" maxlength="100" />
        </el-form-item>
        <el-form-item label="证书附件" prop="certificateUrl">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            class="honor-upload"
          >
            <el-button type="primary" plain icon="Upload">选择文件</el-button>
          </el-upload>
          <div v-if="form.certificateUrl" class="uploaded-file">
            <el-link :href="baseUrl + form.certificateUrl" target="_blank" type="primary" underline="never">
              <el-icon><Document /></el-icon>
              <span style="margin-left: 4px;">{{ form.certificateUrl }}</span>
            </el-link>
            <el-link type="danger" underline="never" style="margin-left: 12px;" @click="clearUpload">删除</el-link>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 关联管理弹窗 -->
    <relation-dialog ref="relationDialogRef" />
  </div>
</template>

<script setup name="Honor">
import { getToken } from "@/utils/auth"
import { listHonor, getHonor, addHonor, updateHonor, delHonor } from "@/api/biz/honor"
import RelationDialog from "./relationDialog.vue"

const { proxy } = getCurrentInstance()
const { honor_type, honor_level } = proxy.useDict("honor_type", "honor_level")

const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadUrl = ref(baseUrl + "/common/upload")
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() })

const honorList = ref([])
const open = ref(false)
const loading = ref(true)
const submitLoading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const ids = ref([])
const multiple = ref(true)
const title = ref("")
const dateRange = ref([])
const relationDialogRef = ref()

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    honorName: undefined,
    honorType: undefined,
    awardLevel: undefined
  },
  rules: {
    honorName: [{ required: true, message: "荣誉名称不能为空", trigger: "blur" }]
  }
})
const { form, queryParams, rules } = toRefs(data)

/** 查询荣誉列表 */
function getList() {
  loading.value = true
  const query = proxy.addDateRange(queryParams.value, dateRange.value, "AwardDate")
  listHonor(query).then(response => {
    honorList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
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

/** 上传成功：取 res.fileName 存路径 */
function handleUploadSuccess(res) {
  proxy.$modal.closeLoading()
  if (res.code === 200) {
    form.value.certificateUrl = res.fileName
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
  form.value.certificateUrl = null
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置（显式白名单 + 可空字段显式 null） */
function reset() {
  form.value = {
    honorId: null,
    honorName: null,
    honorType: null,
    awardLevel: null,
    awardOrg: null,
    awardDate: null,
    certificateNo: null,
    certificateUrl: null,
    description: null,
    remark: null
  }
  proxy.resetForm("honorRef")
}

/** 搜索 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  proxy.resetForm("queryRef")
  dateRange.value = []
  handleQuery()
}

/** 多选 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.honorId)
  multiple.value = !selection.length
}

/** 打开新增弹窗 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "新增荣誉"
}

/** 打开修改弹窗 */
function handleUpdate(row) {
  reset()
  const honorId = row.honorId || ids.value[0]
  getHonor(honorId).then(response => {
    form.value = {
      honorId: response.data.honorId,
      honorName: response.data.honorName,
      honorType: response.data.honorType,
      awardLevel: response.data.awardLevel,
      awardOrg: response.data.awardOrg,
      awardDate: response.data.awardDate,
      certificateNo: response.data.certificateNo,
      certificateUrl: response.data.certificateUrl,
      description: response.data.description,
      remark: response.data.remark
    }
    open.value = true
    title.value = "修改荣誉"
  })
}

/** 提交表单：白名单字段，避免多余字段入参 */
function submitForm() {
  proxy.$refs["honorRef"].validate(valid => {
    if (!valid) return
    submitLoading.value = true
    const f = form.value
    const payload = {
      honorId: f.honorId,
      honorName: f.honorName,
      honorType: f.honorType,
      awardLevel: f.awardLevel,
      awardOrg: f.awardOrg,
      awardDate: f.awardDate,
      certificateNo: f.certificateNo,
      certificateUrl: f.certificateUrl,
      description: f.description,
      remark: f.remark
    }
    const isUpdate = !!f.honorId
    const api = isUpdate ? updateHonor : addHonor
    api(payload).then(() => {
      proxy.$modal.msgSuccess(isUpdate ? "修改成功" : "新增成功")
      open.value = false
      getList()
    }).finally(() => { submitLoading.value = false })
  })
}

/** 删除（级联删关联） */
function handleDelete(row) {
  const targetId = row.honorId
  proxy.$modal.confirm('是否确认删除荣誉"' + row.honorName + '"？将同时删除其全部关联记录。').then(() => {
    return delHonor(targetId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    getList()
  }).catch(() => {})
}

/** 批量删除 */
function handleBatchDelete() {
  proxy.$modal.confirm('是否确认删除选中的' + ids.value.length + '项荣誉？将同时删除其全部关联记录。').then(() => {
    return delHonor(ids.value.join(","))
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    getList()
  }).catch(() => {})
}

/** 导出 */
function handleExport() {
  const query = proxy.addDateRange(queryParams.value, dateRange.value, "AwardDate")
  proxy.download("biz/honor/export", query, `honor_${new Date().getTime()}.xlsx`)
}

/** 打开关联管理弹窗 */
function openRelationDialog(row) {
  relationDialogRef.value.show(row)
}

getList()
</script>

<style scoped>
.honor-upload { display: inline-block; }
.uploaded-file { margin-top: 8px; font-size: 13px; }
</style>
