<template>
  <div class="app-container">
    <!-- 顶部基本信息卡片 -->
    <el-card class="mb8" shadow="never" v-loading="infoLoading">
      <template #header>
        <div class="clearfix">
          <span class="card-title">课题基本信息</span>
          <div style="float: right">
            <el-button icon="ArrowLeft" @click="handleBack">返回</el-button>
            <el-button type="primary" icon="Edit" @click="goEdit" v-hasPermi="['biz:project:edit']" :disabled="form.status === 'ARCHIVED'">修改</el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="课题编号">{{ form.projectNo }}</el-descriptions-item>
        <el-descriptions-item label="课题名称">{{ form.projectName }}</el-descriptions-item>
        <el-descriptions-item label="课题级别">
          <dict-tag :options="project_type" :value="form.projectType" />
        </el-descriptions-item>
        <el-descriptions-item label="项目类别">
          <dict-tag :options="project_category" :value="form.projectCategory" />
        </el-descriptions-item>
        <el-descriptions-item label="专业分类">
          <dict-tag :options="specialty" :value="form.specialty" />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="project_status" :value="form.status" />
        </el-descriptions-item>
        <el-descriptions-item label="组长">{{ form.leaderName }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ form.deptName }}</el-descriptions-item>
        <el-descriptions-item label="预算总额">{{ formatBudget(form.budgetTotal) }}</el-descriptions-item>
        <el-descriptions-item label="预算余额">{{ formatBudget(form.budgetBalance) }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ form.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ form.endDate }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ form.remark }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ form.createBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(form.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(form.updateTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- tab 切换：基本信息 + 成员管理 -->
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="课题编号">{{ form.projectNo }}</el-descriptions-item>
            <el-descriptions-item label="课题名称">{{ form.projectName }}</el-descriptions-item>
            <el-descriptions-item label="课题级别">
              <dict-tag :options="project_type" :value="form.projectType" />
            </el-descriptions-item>
            <el-descriptions-item label="项目类别">
              <dict-tag :options="project_category" :value="form.projectCategory" />
            </el-descriptions-item>
            <el-descriptions-item label="专业分类">
              <dict-tag :options="specialty" :value="form.specialty" />
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <dict-tag :options="project_status" :value="form.status" />
            </el-descriptions-item>
            <el-descriptions-item label="组长">{{ form.leaderName }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{ form.deptName }}</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ form.startDate }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ form.endDate }}</el-descriptions-item>
            <el-descriptions-item label="预算总额">{{ formatBudget(form.budgetTotal) }}</el-descriptions-item>
            <el-descriptions-item label="预算余额">{{ formatBudget(form.budgetBalance) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ form.remark || "-" }}</el-descriptions-item>
          </el-descriptions>
          <el-divider content-position="left">预算细分</el-divider>
          <div v-for="group in budgetSplitGroups" :key="group.title" class="budget-group">
            <div class="budget-group-title">{{ group.title }}</div>
            <el-table :data="group.items" size="small" border>
              <el-table-column label="科目" prop="label" />
              <el-table-column label="金额" align="right">
                <template #default="scope">{{ formatBudget(scope.row.budgetAmount) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="budget-total">预算总额：<span class="budget-total-value">{{ formatBudget(budgetSplitTotal) }}</span></div>
        </el-tab-pane>

        <el-tab-pane label="成员管理" name="member">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                type="primary"
                plain
                icon="Plus"
                @click="openAddMember"
                v-hasPermi="['biz:project:member']"
                :disabled="form.status === 'ARCHIVED'"
              >添加成员</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                type="danger"
                plain
                icon="Delete"
                :disabled="memberMultiple"
                @click="handleBatchDeleteMember"
                v-hasPermi="['biz:project:member']"
              >批量删除</el-button>
            </el-col>
          </el-row>

          <el-table
            v-loading="memberLoading"
            :data="memberList"
            @selection-change="handleMemberSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="用户名称" align="center" prop="userName" />
            <el-table-column label="昵称" align="center" prop="nickName" />
            <el-table-column label="所属部门" align="center" prop="deptName" :show-overflow-tooltip="true" />
            <el-table-column label="角色" align="center" prop="role" width="100">
              <template #default="scope">
                <dict-tag :options="member_role" :value="scope.row.role" />
              </template>
            </el-table-column>
            <el-table-column label="加入时间" align="center" prop="createTime" width="170">
              <template #default="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  icon="Refresh"
                  @click="openChangeHost(scope.row)"
                  v-hasPermi="['biz:project:member']"
                  :disabled="form.status === 'ARCHIVED'"
                >换组长</el-button>
                <el-button
                  link
                  type="primary"
                  icon="Delete"
                  @click="handleDeleteMember(scope.row)"
                  v-hasPermi="['biz:project:member']"
                  :disabled="scope.row.role === 'HOST' && hostCount <= 1"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="memberTotal > 0"
            :total="memberTotal"
            v-model:page="memberQuery.pageNum"
            v-model:limit="memberQuery.pageSize"
            @pagination="loadMembers"
          />
        </el-tab-pane>

        <el-tab-pane label="合作单位" name="unit">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                type="primary"
                plain
                icon="Plus"
                @click="openAddUnit"
                v-hasPermi="['biz:project:unit']"
                :disabled="form.status === 'ARCHIVED'"
              >添加单位</el-button>
            </el-col>
          </el-row>

          <el-table v-loading="unitLoading" :data="unitList">
            <el-table-column label="单位名称" align="center" prop="unitName" :show-overflow-tooltip="true" />
            <el-table-column label="单位类别" align="center" width="110">
              <template #default="scope">
                <dict-tag :options="external_unit_type" :value="scope.row.externalUnitType" />
              </template>
            </el-table-column>
            <el-table-column label="合作方式" align="center" width="110">
              <template #default="scope">
                <dict-tag :options="cooperation_type" :value="scope.row.cooperationType" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  icon="Delete"
                  @click="handleRemoveUnit(scope.row)"
                  v-hasPermi="['biz:project:unit']"
                  :disabled="form.status === 'ARCHIVED'"
                >移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加成员对话框（单/批量） -->
    <el-dialog title="添加成员" v-model="addMemberOpen" width="720px" append-to-body :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="角色">
          <el-tag type="info">参与人（PARTICIPANT）</el-tag>
          <span class="form-tip">组长请用"换组长"</span>
        </el-form-item>
        <el-form-item label="选择用户">
          <el-input
            v-model="addMemberKeyword"
            placeholder="按用户名称/昵称搜索"
            clearable
            style="width: 240px"
            @keyup.enter="searchUsers"
          />
          <el-button type="primary" icon="Search" @click="searchUsers" style="margin-left: 6px">搜索</el-button>
          <el-button icon="Refresh" @click="resetUserSearch">重置</el-button>
        </el-form-item>
        <el-table
          v-loading="userSearchLoading"
          :data="userSearchList"
          height="280px"
          @selection-change="handleUserSearchSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="用户名称" prop="userName" />
          <el-table-column label="昵称" prop="nickName" />
          <el-table-column label="部门" prop="dept.deptName" :show-overflow-tooltip="true" />
        </el-table>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAddMember">确 定</el-button>
          <el-button @click="addMemberOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 换组长对话框（带二次确认） -->
    <el-dialog title="换组长" v-model="changeHostOpen" width="520px" append-to-body :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="当前组长">
          <span>{{ currentLeaderName }}</span>
        </el-form-item>
        <el-form-item label="新组长">
          <el-select v-model="newLeaderUserId" placeholder="请从当前成员中选择新组长" style="width: 100%">
            <el-option
              v-for="m in nonHostMembers"
              :key="m.userId"
              :label="(m.nickName || m.userName) + '（' + m.userName + '）'"
              :value="m.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>
              换组长将把当前组长降级为参与人，并把新组长提升为组长，操作不可撤销。
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirmChangeHost">确 定</el-button>
          <el-button @click="changeHostOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改课题对话框 -->
    <el-dialog title="修改课题" v-model="editOpen" width="720px" append-to-body :close-on-click-modal="false">
      <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="100px" v-loading="editLoading">
        <el-form-item label="课题编号">
          <el-input v-model="editForm.projectNo" disabled />
        </el-form-item>
        <el-form-item label="课题名称" prop="projectName">
          <el-input v-model="editForm.projectName" placeholder="请输入课题名称" maxlength="200" />
        </el-form-item>
        <el-form-item label="课题级别" prop="projectType">
          <el-select v-model="editForm.projectType" placeholder="请选择课题级别" clearable style="width: 100%">
            <el-option v-for="dict in project_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目类别" prop="projectCategory">
          <el-select v-model="editForm.projectCategory" placeholder="请选择项目类别" clearable style="width: 100%">
            <el-option v-for="dict in project_category" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业分类" prop="specialty">
          <el-select v-model="editForm.specialty" placeholder="请选择专业分类" clearable style="width: 100%">
            <el-option v-for="dict in specialty" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算总额">
          <span class="budget-total-value">{{ formatBudget(editBudgetSplitTotal) }}</span>
        </el-form-item>
        <el-form-item label="预算细分">
          <div class="budget-split-box">
            <div v-for="group in BUDGET_GROUPS" :key="group.title" class="budget-group">
              <div class="budget-group-title">{{ group.title }}</div>
              <div class="budget-item-grid">
                <div v-for="category in group.categories" :key="category" class="budget-item">
                  <span class="budget-label">{{ budgetCategoryMap[category] || category }}</span>
                  <el-input-number
                    v-model="editBudgetAmountMap[category]"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    style="width: 100%"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="editForm.startDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择开始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="editForm.endDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="editSubmitting" @click="submitEditForm">确 定</el-button>
          <el-button @click="editOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加合作单位对话框 -->
    <el-dialog title="添加合作单位" v-model="addUnitOpen" width="520px" append-to-body :close-on-click-modal="false">
      <el-form ref="addUnitRef" :model="addUnitForm" :rules="addUnitRules" label-width="100px">
        <el-form-item label="合作单位" prop="unitIds">
          <el-tree-select
            v-model="addUnitForm.unitIds"
            :data="unitTreeOptions"
            placeholder="请选择合作单位"
            check-strictly
            multiple
            show-checkbox
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="合作方式" prop="cooperationType">
          <el-select v-model="addUnitForm.cooperationType" placeholder="请选择合作方式" clearable style="width: 100%">
            <el-option v-for="dict in cooperation_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAddUnit">确 定</el-button>
          <el-button @click="addUnitOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProjectDetail">
import { getProject, listProjectMember, addProjectMember, delProjectMember, changeHost, updateProject, listProjectUnit, addProjectUnitBatch, delProjectUnit } from "@/api/biz/project"
import { treeUnit } from "@/api/biz/unit"
import { listUser } from "@/api/system/user"
import { BUDGET_GROUPS, BUDGET_CATEGORIES, buildBudgetCategoryMap } from "./budgetSplit"

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()
const { project_type, project_status, project_category, specialty, member_role, budget_category, cooperation_type, external_unit_type } = proxy.useDict("project_type", "project_status", "project_category", "specialty", "member_role", "budget_category", "cooperation_type", "external_unit_type")

// 预算细分：科目名走字典渲染
const budgetCategoryMap = computed(() => buildBudgetCategoryMap(budget_category.value))

// 预算细分展示（基本信息 tab）
const budgetSplitGroups = computed(() => {
  const map = {}
  ;(form.value.budgetSplitList || []).forEach(s => {
    if (s && s.category) map[s.category] = Number(s.budgetAmount || 0)
  })
  return BUDGET_GROUPS.map(g => ({
    title: g.title,
    items: g.categories.map(c => ({
      label: budgetCategoryMap.value[c] || c,
      budgetAmount: map[c] || 0
    }))
  }))
})
const budgetSplitTotal = computed(() => {
  let total = 0
  budgetSplitGroups.value.forEach(g => g.items.forEach(it => { total += it.budgetAmount }))
  return total
})

// 预算细分编辑（修改弹窗，金额按科目映射）
const editBudgetAmountMap = reactive({})
const editBudgetSplitTotal = computed(() => {
  let total = 0
  BUDGET_CATEGORIES.forEach(c => {
    const v = editBudgetAmountMap[c]
    if (typeof v === "number" && !Number.isNaN(v)) total += v
  })
  return total
})
function initEditBudgetAmountMap(splits) {
  BUDGET_CATEGORIES.forEach(c => { editBudgetAmountMap[c] = undefined })
  ;(splits || []).forEach(s => {
    if (s && s.category && BUDGET_CATEGORIES.includes(s.category)) {
      editBudgetAmountMap[s.category] = s.budgetAmount == null ? undefined : Number(s.budgetAmount)
    }
  })
}
function buildEditBudgetSplitList() {
  return BUDGET_CATEGORIES.map(category => ({
    category,
    budgetAmount: editBudgetAmountMap[category] == null ? 0 : editBudgetAmountMap[category]
  }))
}

const projectId = computed(() => Number(route.params.projectId))
const activeTab = ref("info")

const form = ref({})
const infoLoading = ref(false)

// 成员管理
const memberLoading = ref(false)
const memberList = ref([])
const memberTotal = ref(0)
const memberIds = ref([])
const memberMultiple = ref(true)
const hostCount = computed(() => memberList.value.filter(m => m.role === "HOST").length)

const memberQuery = reactive({
  pageNum: 1,
  pageSize: 10
})

// 添加成员
const addMemberOpen = ref(false)
const userSearchLoading = ref(false)
const userSearchList = ref([])
const pickedUserIds = ref([])
const addMemberKeyword = ref("")

// 换组长
const changeHostOpen = ref(false)
const newLeaderUserId = ref(undefined)
const currentLeaderName = computed(() => memberList.value.find(m => m.role === "HOST")?.nickName || memberList.value.find(m => m.role === "HOST")?.userName || "")
const nonHostMembers = computed(() => memberList.value.filter(m => m.role !== "HOST"))

// 修改课题
const editOpen = ref(false)
const editLoading = ref(false)
const editSubmitting = ref(false)
const editForm = ref({})
const editRules = {
  projectName: [{ required: true, message: "课题名称不能为空", trigger: "blur" }],
  projectType: [{ required: true, message: "课题级别不能为空", trigger: "change" }],
  projectCategory: [{ required: true, message: "项目类别不能为空", trigger: "change" }],
  specialty: [{ required: true, message: "专业分类不能为空", trigger: "change" }]
}

// 合作单位
const unitLoading = ref(false)
const unitList = ref([])
const addUnitOpen = ref(false)
const unitTreeOptions = ref([])
const addUnitForm = ref({})

/**
 * 后端 /biz/unit/treeselect 返回标准 TreeSelect（id/label/children）。
 * el-tree-select 在 multiple 模式下，tag 回显依赖默认 value 字段反查 label（element-plus issue #18236），
 * 前端统一映射为 { value, label, children } 默认结构，避免自定义 props.value 的版本回显缺陷。
 */
function mapUnitTreeOptions(nodes) {
  return (nodes || []).map(node => ({
    value: node.id,
    label: node.label,
    disabled: !!node.disabled,
    children: node.children && node.children.length ? mapUnitTreeOptions(node.children) : undefined
  }))
}
const addUnitRules = {
  unitIds: [{ required: true, type: 'array', message: "请选择合作单位", trigger: "change" }],
  cooperationType: [{ required: true, message: "请选择合作方式", trigger: "change" }]
}

onMounted(() => {
  const tab = route.query && route.query.activeTab
  if (tab === "member" || tab === "info" || tab === "unit") activeTab.value = tab
  loadDetail()
})

watch(activeTab, val => {
  if (val === "member") loadMembers()
  if (val === "unit") loadUnits()
})

function loadDetail() {
  infoLoading.value = true
  getProject(projectId.value).then(response => {
    form.value = response.data
    infoLoading.value = false
  }).catch(() => { infoLoading.value = false })
}

function loadMembers() {
  memberLoading.value = true
  listProjectMember({ projectId: projectId.value, pageNum: memberQuery.pageNum, pageSize: memberQuery.pageSize }).then(response => {
    memberList.value = response.rows
    memberTotal.value = response.total
    memberLoading.value = false
  })
}

function handleMemberSelectionChange(selection) {
  memberIds.value = selection.map(m => m.memberId)
  memberMultiple.value = !selection.length
}

function handleBack() {
  router.push("/biz/project")
}

function goEdit() {
  // 详情页内的修改入口：直接打开编辑弹窗
  editLoading.value = true
  getProject(projectId.value).then(response => {
    editForm.value = { ...response.data }
    initEditBudgetAmountMap(response.data.budgetSplitList)
    editLoading.value = false
    editOpen.value = true
  }).catch(() => { editLoading.value = false })
}

function submitEditForm() {
  proxy.$refs["editRef"].validate(valid => {
    if (!valid) return
    editSubmitting.value = true
    // 预算总额由后端按细分 Σ 计算，前端不传
    const payload = {
      projectId: editForm.value.projectId,
      projectName: editForm.value.projectName,
      projectType: editForm.value.projectType,
      projectCategory: editForm.value.projectCategory,
      specialty: editForm.value.specialty,
      startDate: editForm.value.startDate,
      endDate: editForm.value.endDate,
      deptId: editForm.value.deptId,
      remark: editForm.value.remark,
      budgetSplitList: buildEditBudgetSplitList()
    }
    updateProject(payload).then(() => {
      proxy.$modal.msgSuccess("修改成功")
      editOpen.value = false
      loadDetail()
    }).finally(() => { editSubmitting.value = false })
  })
}

function openAddMember() {
  pickedUserIds.value = []
  addMemberKeyword.value = ""
  userSearchList.value = []
  addMemberOpen.value = true
  loadAllActiveUsers()
}

function loadAllActiveUsers() {
  userSearchLoading.value = true
  listUser({ pageNum: 1, pageSize: 50, status: "0", userName: addMemberKeyword.value || undefined, nickName: addMemberKeyword.value || undefined }).then(response => {
    // 过滤掉当前已是成员的用户
    const existingIds = new Set(memberList.value.map(m => m.userId))
    userSearchList.value = (response.rows || []).filter(u => !existingIds.has(u.userId))
    userSearchLoading.value = false
  })
}

function searchUsers() {
  loadAllActiveUsers()
}

function resetUserSearch() {
  addMemberKeyword.value = ""
  loadAllActiveUsers()
}

function handleUserSearchSelectionChange(selection) {
  pickedUserIds.value = selection.map(u => u.userId)
}

function submitAddMember() {
  if (!pickedUserIds.value.length) {
    proxy.$modal.msgWarning("请至少选择一个用户")
    return
  }
  const members = pickedUserIds.value.map(userId => ({ userId, role: "PARTICIPANT" }))
  addProjectMember({ projectId: projectId.value, members }).then(() => {
    proxy.$modal.msgSuccess("添加成功")
    addMemberOpen.value = false
    loadMembers()
  })
}

function handleDeleteMember(row) {
  if (row.role === "HOST" && hostCount.value <= 1) {
    proxy.$modal.msgWarning("唯一组长不可删除，请先换组长")
    return
  }
  proxy.$modal.confirm('确认删除成员"' + (row.nickName || row.userName) + '"吗？').then(() => {
    return delProjectMember(row.memberId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    loadMembers()
  }).catch(() => {})
}

function handleBatchDeleteMember() {
  proxy.$modal.confirm('确认删除选中的' + memberIds.value.length + '个成员吗？').then(() => {
    return delProjectMember(memberIds.value.join(","))
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    loadMembers()
  }).catch(() => {})
}

function openChangeHost() {
  newLeaderUserId.value = undefined
  changeHostOpen.value = true
}

function confirmChangeHost() {
  if (!newLeaderUserId.value) {
    proxy.$modal.msgWarning("请先选择新组长")
    return
  }
  const target = memberList.value.find(m => m.userId === newLeaderUserId.value)
  const newName = target ? (target.nickName || target.userName) : ""
  proxy.$modal.confirm('确认将组长更换为"' + newName + '"吗？').then(() => {
    return changeHost(projectId.value, newLeaderUserId.value)
  }).then(() => {
    proxy.$modal.msgSuccess("换组长成功")
    changeHostOpen.value = false
    loadMembers()
    loadDetail()
  }).catch(() => {})
}

function formatBudget(val) {
  if (val == null || val === "") return "-"
  return Number(val).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ===== 合作单位 tab =====

function loadUnits() {
  unitLoading.value = true
  listProjectUnit({ projectId: projectId.value }).then(response => {
    unitList.value = response.data || []
    unitLoading.value = false
  }).catch(() => { unitLoading.value = false })
}

function openAddUnit() {
  addUnitForm.value = { projectId: projectId.value, unitIds: [], cooperationType: undefined }
  treeUnit().then(response => {
    unitTreeOptions.value = mapUnitTreeOptions(response.data || [])
  })
  addUnitOpen.value = true
}

function submitAddUnit() {
  proxy.$refs["addUnitRef"].validate(valid => {
    if (!valid) return
    addProjectUnitBatch({
      projectId: projectId.value,
      unitIds: addUnitForm.value.unitIds,
      cooperationType: addUnitForm.value.cooperationType
    }).then(res => {
      proxy.$modal.msgSuccess(res.msg || "添加成功")
      addUnitOpen.value = false
      loadUnits()
    })
  })
}

function handleRemoveUnit(row) {
  proxy.$modal.confirm('确认移除合作单位"' + row.unitName + '"吗？').then(() => {
    return delProjectUnit(row.id)
  }).then(() => {
    proxy.$modal.msgSuccess("移除成功")
    loadUnits()
  }).catch(() => {})
}
</script>

<style scoped>
.card-title { font-weight: 600; }
.form-tip { margin-left: 12px; color: #909399; font-size: 12px; }
.budget-split-box { width: 100%; }
.budget-group { margin-bottom: 14px; }
.budget-group-title { font-weight: 600; color: #303133; margin-bottom: 8px; }
.budget-item-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.budget-item { display: flex; flex-direction: column; gap: 4px; }
.budget-label { font-size: 13px; color: #606266; }
.budget-total { margin-top: 12px; color: #303133; }
.budget-total-value { font-size: 16px; color: #f56c6c; font-weight: 600; }
</style>