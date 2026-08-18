<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="课题编号" prop="projectNo">
        <el-input
          v-model="queryParams.projectNo"
          placeholder="请输入课题编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="课题名称" prop="projectName">
        <el-input
          v-model="queryParams.projectName"
          placeholder="请输入课题名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="课题级别" prop="projectType">
        <el-select v-model="queryParams.projectType" placeholder="请选择课题级别" clearable style="width: 180px">
          <el-option
            v-for="dict in project_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目类别" prop="projectCategory">
        <el-select v-model="queryParams.projectCategory" placeholder="请选择项目类别" clearable style="width: 180px">
          <el-option
            v-for="dict in project_category"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="专业分类" prop="specialty">
        <el-select v-model="queryParams.specialty" placeholder="请选择专业分类" clearable style="width: 180px">
          <el-option
            v-for="dict in specialty"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option
            v-for="dict in project_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="组长" prop="leaderId">
        <el-input
          v-model="queryParams.leaderName"
          placeholder="请输入组长姓名"
          clearable
          style="width: 160px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptOptions"
          :props="{ value: 'id', label: 'label', children: 'children' }"
          value-key="id"
          placeholder="请选择所属部门"
          clearable
          check-strictly
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="开始日期" style="width: 308px">
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
          v-hasPermi="['biz:project:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['biz:project:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['biz:project:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:project:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="projectList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="课题编号" align="center" prop="projectNo" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="课题名称" align="center" prop="projectName" :show-overflow-tooltip="true" />
      <el-table-column label="课题级别" align="center" prop="projectType" width="110">
        <template #default="scope">
          <dict-tag :options="project_type" :value="scope.row.projectType" />
        </template>
      </el-table-column>
      <el-table-column label="项目类别" align="center" prop="projectCategory" width="130">
        <template #default="scope">
          <dict-tag :options="project_category" :value="scope.row.projectCategory" />
        </template>
      </el-table-column>
      <el-table-column label="专业分类" align="center" prop="specialty" width="120">
        <template #default="scope">
          <dict-tag :options="specialty" :value="scope.row.specialty" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="project_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="组长" align="center" prop="leaderName" />
      <el-table-column label="所属部门" align="center" prop="deptName" :show-overflow-tooltip="true" />
      <el-table-column label="预算总额" align="center" prop="budgetTotal" width="120">
        <template #default="scope">
          <span>{{ formatBudget(scope.row.budgetTotal) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="开始日期" align="center" prop="startDate" width="110" />
      <el-table-column label="结束日期" align="center" prop="endDate" width="110" />
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:project:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:project:remove']">删除</el-button>
          <el-button link type="primary" icon="Sort" @click="openStatusDialog(scope.row)" v-hasPermi="['biz:project:edit']" :disabled="scope.row.status === 'ARCHIVED'">状态切换</el-button>
          <el-button link type="primary" icon="Folder" @click="handleArchive(scope.row)" v-hasPermi="['biz:project:archive']" v-if="scope.row.status === 'COMPLETED' || scope.row.status === 'ACCEPTED'">归档</el-button>
          <el-button link type="primary" icon="View" @click="goDetail(scope.row, 'info')" v-hasPermi="['biz:project:detail']">详情</el-button>
          <el-button link type="primary" icon="User" @click="goDetail(scope.row, 'member')" v-hasPermi="['biz:project:member']">成员管理</el-button>
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

    <!-- 新增 / 修改课题对话框 -->
    <el-dialog :title="title" v-model="open" width="860px" append-to-body :close-on-click-modal="false">
      <el-form ref="projectRef" :model="form" :rules="rules" label-width="100px" v-loading="formLoading">
        <el-form-item label="课题编号" prop="projectNo">
          <el-input v-model="form.projectNo" :disabled="!!form.projectId" placeholder="请输入课题编号" maxlength="50" />
        </el-form-item>
        <el-form-item label="课题名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入课题名称" maxlength="200" />
        </el-form-item>
        <el-form-item label="课题级别" prop="projectType">
          <el-select v-model="form.projectType" placeholder="请选择课题级别" clearable style="width: 100%">
            <el-option
              v-for="dict in project_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目类别" prop="projectCategory">
          <el-select v-model="form.projectCategory" placeholder="请选择项目类别" clearable style="width: 100%">
            <el-option
              v-for="dict in project_category"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业分类" prop="specialty">
          <el-select v-model="form.specialty" placeholder="请选择专业分类" clearable style="width: 100%">
            <el-option
              v-for="dict in specialty"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="主持标识" prop="selfHosted">
          <el-radio-group v-model="form.selfHosted" :disabled="!!form.projectId" @change="onSelfHostedChange">
            <el-radio value="1">本单位主持</el-radio>
            <el-radio value="0">外单位主持</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="主持单位" prop="hostUnitId">
          <el-tree-select
            v-model="form.hostUnitId"
            :data="companyTreeOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="请选择主持单位（二级公司）"
            check-strictly
            :disabled="!!form.projectId"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="组长" prop="leaderId">
          <div v-if="leaderEditable" class="leader-cascade">
            <el-select v-model="leaderDeptId" placeholder="选择部门" clearable style="width: 46%">
              <el-option v-for="d in leaderDeptOptions" :key="d.id" :label="d.label" :value="d.id" />
            </el-select>
            <el-select v-model="form.leaderId" placeholder="选择人员" clearable filterable style="width: 46%; margin-left: 8px" @change="onLeaderPersonChange">
              <el-option v-for="p in leaderPersonOptions" :key="p.userId" :label="p.nickName || p.userName" :value="p.userId" />
            </el-select>
          </div>
          <el-input v-else v-model="form.leaderName" disabled placeholder="本单位主持默认为当前用户" readonly />
        </el-form-item>
        <el-form-item label="研究领域" prop="fieldList">
          <el-select v-model="form.fieldList" multiple filterable placeholder="请选择研究领域（可多选）" clearable style="width: 100%">
            <el-option v-for="d in research_direction" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="经费预算">
          <unit-budget-editor ref="unitBudgetEditorRef" :host-unit-id="form.hostUnitId" />
        </el-form-item>
        <el-form-item label="预算合计">
          <span class="budget-total-value">{{ formatBudget(unitBudgetTotal) }}</span>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择开始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptId">
          <el-tree-select
            v-model="form.deptId"
            :data="enabledDeptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="默认取组长所属部门"
            clearable
            check-strictly
            style="width: 100%"
          />
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

    <!-- 状态切换对话框 -->
    <el-dialog title="状态切换" v-model="statusOpen" width="420px" append-to-body :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="当前状态">
          <dict-tag :options="project_status" :value="currentRow?.status" />
        </el-form-item>
        <el-form-item label="目标状态">
          <el-select v-model="targetStatus" placeholder="请选择目标状态" style="width: 100%">
            <el-option
              v-for="opt in nextStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitStatusChange">确 定</el-button>
          <el-button @click="statusOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Project">
import { listProject, addProject, delProject, getProject, updateProject, changeStatus, archive, listProjectUnit, addProjectUnitBatch, delProjectUnit } from "@/api/biz/project"
import { listUserOptions } from "@/api/biz/userProfile"
import { deptTreeSelect } from "@/api/system/user"
import UnitBudgetEditor from "./unitBudgetEditor.vue"
import useUserStore from "@/store/modules/user"
import { checkPermi, checkRole } from "@/utils/permission"

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => Number(userStore.id) || undefined)
const { project_type, project_status, project_category, specialty, research_direction } = proxy.useDict("project_type", "project_status", "project_category", "specialty", "research_direction")

const projectList = ref([])
const open = ref(false)
const statusOpen = ref(false)
const loading = ref(true)
const formLoading = ref(false)
const submitLoading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const deptOptions = ref([])
const enabledDeptOptions = ref([])
const dateRange = ref([])
const currentRow = ref(null)
const targetStatus = ref(undefined)
const nextStatusOptions = ref([])

// ===== 按单位预算编辑器 =====
const unitBudgetEditorRef = ref(null)
const unitBudgetTotal = computed(() => {
  const inst = unitBudgetEditorRef.value
  return inst && inst.budgetTotal ? inst.budgetTotal.value : 0
})

// ===== 二级公司（主持单位选项） =====
const companyOptions = computed(() => {
  const root = deptOptions.value && deptOptions.value[0]
  return ((root && root.children) || [])
    .filter(n => n.status === "0" || n.status === 0 || n.status == null)
    .map(n => ({ id: Number(n.id), label: n.label }))
})
const companyTreeOptions = computed(() => companyOptions.value.map(c => ({ id: c.id, label: c.label, children: [] })))

function defaultHostCompanyId() {
  if (!companyOptions.value.length) return undefined
  const ky = companyOptions.value.find(c => c.label === "科研所")
  return ky ? ky.id : companyOptions.value[0].id
}

// ===== 组长级联（部门 → 人员） =====
const allUserOptions = ref([])
const leaderDeptId = ref(undefined)
const leaderUnlocked = computed(() => checkRole(["admin", "science_admin"]) || form.value.selfHosted === "0")
// 修改态后端强制 leader_id = 库原值，组长不可改
const leaderEditable = computed(() => !form.value.projectId && leaderUnlocked.value)
const leaderDeptOptions = computed(() => {
  if (form.value.hostUnitId == null) return []
  const node = findDeptNode(enabledDeptOptions.value, form.value.hostUnitId)
  return (node && node.children) || []
})
const leaderPersonOptions = computed(() => {
  let rows = allUserOptions.value
  if (leaderDeptId.value != null) {
    rows = rows.filter(u => Number(u.deptId) === Number(leaderDeptId.value))
  }
  return rows
})

function loadAllUserOptions() {
  listUserOptions().then(response => {
    allUserOptions.value = response.data || []
  })
}

function findDeptNode(nodes, id) {
  for (const n of nodes || []) {
    if (Number(n.id) === Number(id)) return n
    const found = findDeptNode(n.children, id)
    if (found) return found
  }
  return null
}

/** 当前用户部门属于主持单位二级公司下的部门时才预选，否则留空让用户选 */
function syncLeaderCascade() {
  const me = allUserOptions.value.find(u => Number(u.userId) === Number(userStore.id))
  const dept = me && me.deptId != null ? Number(me.deptId) : undefined
  if (dept != null && leaderDeptOptions.value.some(d => Number(d.id) === dept)) {
    leaderDeptId.value = dept
  } else {
    leaderDeptId.value = undefined
  }
}

function onLeaderPersonChange(val) {
  const p = leaderPersonOptions.value.find(x => Number(x.userId) === Number(val))
  form.value.leaderName = p ? (p.nickName || p.userName) : undefined
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    projectNo: undefined,
    projectName: undefined,
    projectType: undefined,
    projectCategory: undefined,
    specialty: undefined,
    status: undefined,
    leaderId: undefined,
    leaderName: undefined,
    deptId: undefined,
    params: {}
  },
  rules: {
    projectNo: [{ required: true, message: "课题编号不能为空", trigger: "blur" }],
    projectName: [{ required: true, message: "课题名称不能为空", trigger: "blur" }],
    projectType: [{ required: true, message: "课题级别不能为空", trigger: "change" }],
    projectCategory: [{ required: true, message: "项目类别不能为空", trigger: "change" }],
    specialty: [{ required: true, message: "专业分类不能为空", trigger: "change" }],
    hostUnitId: [{ required: true, message: "请选择主持单位", trigger: "change" }],
    leaderId: [{ required: true, message: "组长不能为空", trigger: "change" }]
  }
})
const { form, queryParams, rules } = toRefs(data)

// 状态机相邻单向：按当前状态计算可选目标
const STATUS_TRANSITIONS = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: ["ACCEPTED"],
  ACCEPTED: [],
  ARCHIVED: []
}

/** 查询部门下拉树 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data
    enabledDeptOptions.value = filterDisabledDept(JSON.parse(JSON.stringify(response.data)))
  })
}

function filterDisabledDept(tree) {
  return tree.filter(node => node.status === "0" || node.status === 0 || node.status == null).map(node => {
    if (node.children) node.children = filterDisabledDept(node.children)
    return node
  })
}

/** 查询课题列表 */
function getList() {
  loading.value = true
  listProject(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    projectList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮（新增/修改） */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    projectId: undefined,
    projectNo: undefined,
    projectName: undefined,
    projectType: undefined,
    projectCategory: undefined,
    specialty: undefined,
    leaderId: currentUserId.value,
    leaderName: userStore.name,
    selfHosted: '1',
    hostUnitId: defaultHostCompanyId(),
    fieldList: [],
    startDate: undefined,
    endDate: undefined,
    deptId: undefined,
    remark: undefined
  }
  leaderDeptId.value = undefined
  proxy.resetForm("projectRef")
}

/** 搜索按钮 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮 */
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  queryParams.value.leaderName = undefined
  handleQuery()
}

/** 多选框 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.projectId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "新增课题"
  nextTick(() => {
    unitBudgetEditorRef.value?.reset(form.value.hostUnitId)
    syncLeaderCascade()
  })
}

/** 修改 */
function handleUpdate(row) {
  reset()
  const projectId = row.projectId || ids.value
  formLoading.value = true
  getProject(projectId).then(response => {
    form.value = {
      ...response.data,
      leaderId: response.data.leaderId,
      leaderName: response.data.leaderName
    }
    formLoading.value = false
    open.value = true
    title.value = "修改课题"
    nextTick(() => {
      unitBudgetEditorRef.value?.reset(form.value.hostUnitId)
      listProjectUnit({ projectId }).then(res => {
        unitBudgetEditorRef.value?.load({
          units: res.data || [],
          unitBudgets: response.data.unitBudgetList,
          hostUnitId: response.data.hostUnitId
        })
      }).catch(() => {})
    })
  }).catch(() => { formLoading.value = false })
}

/** 提交 */
function submitForm() {
  proxy.$refs["projectRef"].validate(valid => {
    if (!valid) return
    submitLoading.value = true
    const unitBudgetList = unitBudgetEditorRef.value ? unitBudgetEditorRef.value.buildUnitBudgetList() : []
    if (form.value.projectId != undefined) {
      // 修改：剔除 projectNo / leaderId / selfHosted / hostUnitId / status（后端禁用）；预算由 unitBudgetList 驱动
      const payload = {
        projectId: form.value.projectId,
        projectName: form.value.projectName,
        projectType: form.value.projectType,
        projectCategory: form.value.projectCategory,
        specialty: form.value.specialty,
        fieldList: form.value.fieldList || [],
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        deptId: form.value.deptId,
        remark: form.value.remark,
        unitBudgetList
      }
      updateProject(payload)
        .then(() => reconcileUnits(form.value.projectId).catch(err => {
          proxy.$modal.msgWarning("课题已保存，但关联单位处理失败：" + ((err && (err.msg || err.message)) || "请到详情页补充"))
        }))
        .then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
        .catch(() => {})
        .finally(() => { submitLoading.value = false })
    } else {
      const payload = {
        projectNo: form.value.projectNo,
        projectName: form.value.projectName,
        projectType: form.value.projectType,
        projectCategory: form.value.projectCategory,
        specialty: form.value.specialty,
        leaderId: form.value.leaderId,
        selfHosted: form.value.selfHosted,
        hostUnitId: form.value.hostUnitId,
        fieldList: form.value.fieldList || [],
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        deptId: form.value.deptId,
        remark: form.value.remark,
        unitBudgetList
      }
      addProject(payload)
        .then(res => {
          const pid = res.data && res.data.projectId
          return reconcileUnits(pid).catch(err => {
            proxy.$modal.msgWarning("课题已保存，但关联单位处理失败：" + ((err && (err.msg || err.message)) || "请到详情页补充"))
          })
        })
        .then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
        .catch(() => {})
        .finally(() => { submitLoading.value = false })
    }
  })
}

/** 参与/协作单位关联与后端 project_unit 差异同步（需 biz:project:unit 权限，无权限则仅预算落库） */
function reconcileUnits(projectId) {
  if (!projectId) return Promise.resolve()
  if (!checkPermi(["biz:project:unit"])) return Promise.resolve()
  const inst = unitBudgetEditorRef.value
  const changes = inst ? inst.getAssociationChanges() : { toAdd: [], toRemoveIds: [] }
  const tasks = []
  ;(changes.toAdd || []).forEach(item => {
    tasks.push(addProjectUnitBatch({
      projectId,
      unitIds: [item.unitId],
      cooperationType: item.cooperationType
    }))
  })
  if (changes.toRemoveIds && changes.toRemoveIds.length) {
    tasks.push(delProjectUnit(changes.toRemoveIds.join(",")))
  }
  return Promise.all(tasks)
}

/** 删除 */
function handleDelete(row) {
  const projectIds = row.projectId || ids.value
  proxy.$modal.confirm('是否确认删除课题编号为"' + projectIds + '"的数据项？').then(function () {
    return delProject(projectIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出 */
function handleExport() {
  proxy.download("biz/project/export", {
    ...proxy.addDateRange(queryParams.value, dateRange.value)
  }, `project_${new Date().getTime()}.xlsx`)
}

/** 跳转详情页（activeTab 可选 info / member） */
function goDetail(row, activeTab) {
  const path = `/biz/project/detail/${row.projectId}`
  const url = activeTab ? `${path}?activeTab=${activeTab}` : path
  router.push(url)
}

/** 打开状态切换 */
function openStatusDialog(row) {
  currentRow.value = row
  const next = STATUS_TRANSITIONS[row.status] || []
  nextStatusOptions.value = project_status.value.filter(d => next.includes(d.value))
  targetStatus.value = undefined
  statusOpen.value = true
}

/** 提交状态切换 */
function submitStatusChange() {
  if (!targetStatus.value) {
    proxy.$modal.msgWarning("请选择目标状态")
    return
  }
  changeStatus(currentRow.value.projectId, targetStatus.value).then(() => {
    proxy.$modal.msgSuccess("状态切换成功")
    statusOpen.value = false
    getList()
  })
}

/** 归档 */
function handleArchive(row) {
  proxy.$modal.confirm('确认将课题"' + row.projectName + '"归档吗？归档后不可修改/删除/再归档。').then(function () {
    return archive(row.projectId)
  }).then(() => {
    proxy.$modal.msgSuccess("归档成功")
    getList()
  }).catch(() => {})
}

/** 主持标识切换：本单位 → 默认科研所 + 组长当前用户；外单位 → 清空组长待选 */
function onSelfHostedChange(val) {
  if (val === '1') {
    form.value.hostUnitId = defaultHostCompanyId()
    form.value.leaderId = currentUserId.value
    form.value.leaderName = userStore.name
    leaderDeptId.value = undefined
    syncLeaderCascade()
  } else {
    if (!form.value.hostUnitId) {
      const first = companyOptions.value[0]
      form.value.hostUnitId = first ? first.id : undefined
    }
    form.value.leaderId = undefined
    form.value.leaderName = undefined
    leaderDeptId.value = undefined
  }
}

function formatBudget(val) {
  if (val == null || val === "") return "-"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

getDeptTree()
loadAllUserOptions()
getList()

// 部门树加载晚于表单打开时兜底默认主持单位（新增态）
watch(companyOptions, (val) => {
  if (val.length && form.value && form.value.hostUnitId == null && !form.value.projectId) {
    form.value.hostUnitId = defaultHostCompanyId()
  }
})
</script>

<style scoped>
.leader-cascade { display: flex; width: 100%; }
.budget-total-value { font-size: 16px; color: #f56c6c; font-weight: 600; }
</style>
