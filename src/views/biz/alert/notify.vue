<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option
            v-for="dict in notify_status"
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
        <el-badge :value="unreadCount" :hidden="unreadCount <= 0" :max="99" type="danger">
          <span class="unread-label">未读通知</span>
        </el-badge>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="notifyList">
      <el-table-column label="预警标题" align="center" prop="alertTitle" :show-overflow-tooltip="true" />
      <el-table-column label="接收时间" align="center" prop="createTime" width="160" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="notify_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="170" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 'UNREAD'"
            link
            type="primary"
            icon="Message"
            @click="handleRead(scope.row)"
            v-hasPermi="['biz:alert:read']"
          >标记已读</el-button>
          <el-button
            v-if="scope.row.status !== 'CONFIRMED'"
            link
            type="primary"
            icon="Check"
            @click="handleConfirm(scope.row)"
            v-hasPermi="['biz:alert:confirm']"
          >确认</el-button>
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
  </div>
</template>

<script setup name="Notify">
import { listMyNotify, readNotify, confirmNotify, getUnreadCount } from "@/api/biz/alert"

const { proxy } = getCurrentInstance()
const { notify_status } = proxy.useDict("notify_status")

const notifyList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const unreadCount = ref(0)

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    status: undefined
  }
})
const { queryParams } = toRefs(data)

/** 查询我的通知列表 */
function getList() {
  loading.value = true
  listMyNotify(queryParams.value).then(response => {
    notifyList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

/** 刷新未读计数 */
function refreshUnreadCount() {
  getUnreadCount().then(response => {
    unreadCount.value = response.data || 0
  }).catch(() => {})
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

/** 标记已读（仅 UNREAD 行） */
function handleRead(row) {
  readNotify(row.notifyId).then(() => {
    proxy.$modal.msgSuccess("已标记为已读")
    refreshUnreadCount()
    getList()
  }).catch(() => {})
}

/** 确认通知（UNREAD/READ 行） */
function handleConfirm(row) {
  proxy.$modal.confirm('是否确认该预警通知"' + (row.alertTitle || "") + '"？').then(() => {
    return confirmNotify(row.notifyId)
  }).then(() => {
    proxy.$modal.msgSuccess("已确认")
    refreshUnreadCount()
    getList()
  }).catch(() => {})
}

getList()
refreshUnreadCount()
</script>

<style scoped>
.unread-label { padding: 0 10px; font-size: 13px; line-height: 24px; }
</style>
