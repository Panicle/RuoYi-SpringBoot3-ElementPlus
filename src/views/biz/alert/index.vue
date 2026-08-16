<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="预警类型" prop="alertType">
        <el-select v-model="queryParams.alertType" placeholder="请选择预警类型" clearable style="width: 160px">
          <el-option
            v-for="dict in alert_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="预警级别" prop="alertLevel">
        <el-select v-model="queryParams.alertLevel" placeholder="请选择预警级别" clearable style="width: 160px">
          <el-option
            v-for="dict in alert_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option
            v-for="dict in alert_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联类型" prop="refType">
        <el-select v-model="queryParams.refType" placeholder="请选择关联类型" clearable style="width: 160px">
          <el-option
            v-for="opt in refTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
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
          v-if="showScan"
          type="warning"
          plain
          icon="RefreshRight"
          @click="handleScan"
        >手动扫描</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="alertList">
      <el-table-column label="预警标题" align="center" prop="title" :show-overflow-tooltip="true" />
      <el-table-column label="类型" align="center" prop="alertType" width="100">
        <template #default="scope">
          <dict-tag :options="alert_type" :value="scope.row.alertType" />
        </template>
      </el-table-column>
      <el-table-column label="级别" align="center" prop="alertLevel" width="90">
        <template #default="scope">
          <dict-tag :options="alert_level" :value="scope.row.alertLevel" />
        </template>
      </el-table-column>
      <el-table-column label="关联对象" align="center" prop="refName" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="alert_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="触发轮次" align="center" prop="round" width="80" />
      <el-table-column label="首次时间" align="center" prop="firstTime" width="160" />
      <el-table-column label="最近时间" align="center" prop="lastTime" width="160" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)">详情</el-button>
          <el-button
            v-if="scope.row.status === 'OPEN'"
            link
            type="danger"
            icon="CircleCheck"
            @click="handleResolve(scope.row)"
            v-hasPermi="['biz:alert:resolve']"
          >消除</el-button>
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

    <!-- 预警详情对话框 -->
    <el-dialog title="预警详情" v-model="open" width="620px" append-to-body :close-on-click-modal="false">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预警标题">{{ detail.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">
          <dict-tag :options="alert_type" :value="detail.alertType" />
        </el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <dict-tag :options="alert_level" :value="detail.alertLevel" />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="alert_status" :value="detail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="关联类型">{{ detail.refType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联对象">{{ detail.refName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属课题">{{ detail.projectName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="触发轮次">{{ detail.round || '-' }}</el-descriptions-item>
        <el-descriptions-item label="首次时间">{{ detail.firstTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最近时间">{{ detail.lastTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预警内容" :span="2">{{ detail.content || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="Alert">
import { listAlert, getAlert, resolveAlert, scanAlert } from "@/api/biz/alert"
import useUserStore from "@/store/modules/user"

const { proxy } = getCurrentInstance()
const { alert_type, alert_level, alert_status } = proxy.useDict("alert_type", "alert_level", "alert_status")

// 关联类型筛选选项（无独立字典，按后端枚举硬编码）
const refTypeOptions = [
  { value: "CONTRACT", label: "合同节点" },
  { value: "PROJECT", label: "课题" },
  { value: "DOCUMENT", label: "资料" }
]

const userStore = useUserStore()
// 手动扫描：需消除权限 + admin/science_admin 角色（与后端 @ss.hasAnyRoles('admin,science_admin') 对齐）
// 注意：admin 的 permissions 恒为通配符 ["*:*:*"]（后端 SysPermissionService 对 isAdmin 直接返回），须显式兼容
const showScan = computed(() => {
  const roles = userStore.roles || []
  const permissions = userStore.permissions || []
  const hasResolvePerm = permissions.includes("*:*:*") || permissions.includes("biz:alert:resolve")
  return hasResolvePerm && roles.some(r => ["admin", "science_admin"].includes(r))
})

const alertList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const detail = ref({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    alertType: undefined,
    alertLevel: undefined,
    status: undefined,
    refType: undefined
  }
})
const { queryParams } = toRefs(data)

/** 查询预警列表 */
function getList() {
  loading.value = true
  listAlert(queryParams.value).then(response => {
    alertList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
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

/** 预警详情 */
function handleView(row) {
  getAlert(row.alertId).then(response => {
    detail.value = response.data || {}
    open.value = true
  })
}

/** 消除预警（仅 OPEN 行） */
function handleResolve(row) {
  proxy.$modal.confirm('是否确认消除预警"' + row.title + '"？').then(() => {
    return resolveAlert(row.alertId)
  }).then(() => {
    proxy.$modal.msgSuccess("消除成功")
    getList()
  }).catch(() => {})
}

/** 手动触发预警扫描 */
function handleScan() {
  proxy.$modal.confirm("确认手动触发一次预警扫描吗？将全量检测合同节点/经费超限/资料逾期三类预警。").then(() => {
    return scanAlert()
  }).then(response => {
    proxy.$modal.msgSuccess("扫描完成，本次新增 " + (response.data || 0) + " 条预警")
    getList()
  }).catch(() => {})
}

getList()
</script>
