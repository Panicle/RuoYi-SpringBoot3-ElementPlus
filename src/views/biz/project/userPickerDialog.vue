<template>
  <el-dialog title="选择主持人" v-model="visible" width="800px" top="5vh" append-to-body :close-on-click-modal="false">
    <el-form :model="queryParams" :inline="true" @submit.prevent>
      <el-form-item label="用户名称">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户名称"
          clearable
          style="width: 180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input
          v-model="queryParams.nickName"
          placeholder="请输入昵称"
          clearable
          style="width: 180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table
      v-loading="loading"
      :data="userList"
      height="360px"
      highlight-current-row
      @current-change="handleCurrentChange"
      @row-dblclick="handleDblClick"
    >
      <el-table-column width="55" align="center">
        <template #default="scope">
          <el-radio v-model="selectedId" :value="scope.row.userId" @change="handleRadioChange(scope.row)">
            <span></span>
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="用户名称" prop="userName" :show-overflow-tooltip="true" />
      <el-table-column label="用户昵称" prop="nickName" :show-overflow-tooltip="true" />
      <el-table-column label="部门" prop="dept.deptName" :show-overflow-tooltip="true" />
      <el-table-column label="手机" prop="phonenumber" width="120" />
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="UserPickerDialog">
import { listUser } from "@/api/system/user"

const emit = defineEmits(["ok"])
const { proxy } = getCurrentInstance()

const visible = ref(false)
const loading = ref(false)
const userList = ref([])
const total = ref(0)
const selectedRow = ref(null)
const selectedId = ref(undefined)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  nickName: undefined,
  status: "0"
})

function show() {
  selectedRow.value = null
  selectedId.value = undefined
  visible.value = true
  getList()
}

function handleCurrentChange(row) {
  if (row) {
    selectedRow.value = row
    selectedId.value = row.userId
  }
}

function handleRadioChange(row) {
  selectedRow.value = row
  selectedId.value = row.userId
}

function handleDblClick(row) {
  selectedRow.value = row
  selectedId.value = row.userId
  handleConfirm()
}

function getList() {
  loading.value = true
  listUser(queryParams).then(response => {
    userList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.userName = undefined
  queryParams.nickName = undefined
  handleQuery()
}

function handleConfirm() {
  if (!selectedRow.value) {
    proxy.$modal.msgWarning("请选择一个用户")
    return
  }
  emit("ok", selectedRow.value)
  visible.value = false
}

function cancel() {
  visible.value = false
}

defineExpose({ show })
</script>