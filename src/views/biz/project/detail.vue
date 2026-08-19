<template>
  <div class="app-container">
    <!-- 顶部基本信息卡片 -->
    <el-card class="mb8" shadow="never" v-loading="infoLoading">
      <template #header>
        <div class="clearfix">
          <span class="card-title">课题基本信息</span>
          <div style="float: right">
            <el-button icon="ArrowLeft" @click="handleBack">返回</el-button>
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
        <el-descriptions-item label="经费总预算">{{ formatBudget(form.budgetApproved) }}</el-descriptions-item>
        <el-descriptions-item label="预算总额">{{ formatBudget(form.budgetTotal) }}</el-descriptions-item>
        <el-descriptions-item label="预算余额">{{ formatBudget((form.budgetApproved || 0) - (form.budgetTotal || 0)) }}</el-descriptions-item>
        <el-descriptions-item label="可用支出余额">{{ formatBudget(expenseBalance) }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ form.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ form.endDate }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ form.remark }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ form.createBy }}</el-descriptions-item>
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
            <el-descriptions-item label="开始日期">{{ form.startDate }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ form.endDate }}</el-descriptions-item>
        <el-descriptions-item label="经费总预算">{{ formatBudget(form.budgetApproved) }}</el-descriptions-item>
            <el-descriptions-item label="预算总额">{{ formatBudget(form.budgetTotal) }}</el-descriptions-item>
            <el-descriptions-item label="预算余额">{{ formatBudget((form.budgetApproved || 0) - (form.budgetTotal || 0)) }}</el-descriptions-item>
        <el-descriptions-item label="可用支出余额">{{ formatBudget(expenseBalance) }}</el-descriptions-item>
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

        <el-tab-pane label="课题团队" name="member">
          <el-tabs v-model="memberSubTab">
            <el-tab-pane label="经费" name="budget">
              <div class="budget-summary-bar">
                <span class="budget-summary-label">总经费金额：</span>
                <span class="budget-total-value">{{ formatBudget(approvedBudgetTotal) }}</span>
              </div>
              <el-collapse v-model="budgetCollapse" class="budget-collapse">
                <el-collapse-item title="经费总预算" name="approved">
                  <div class="approved-grid">
                    <div v-for="group in BUDGET_GROUPS" :key="group.title" class="approved-group">
                      <div class="approved-group-title">{{ group.title }}</div>
                      <div v-for="category in group.categories" :key="category" class="approved-item">
                        <span class="approved-label">{{ budgetCategoryMap[category] || category }}</span>
                        <el-input-number v-model="form.budgetApprovedMap[category]" :min="0" :precision="2" :controls="false" placeholder="0.00" style="width: 100%" />
                      </div>
                    </div>
                  </div>
                  <div class="approved-total">支出预算合计：<span class="budget-total-value">{{ formatBudget(approvedBudgetTotal) }}</span></div>
                </el-collapse-item>
                <el-collapse-item title="各单位预算（主持单位 + 参与单位）" name="units">
                  <unit-budget-editor ref="memberUnitBudgetRef" :host-unit-id="form.hostUnitId" />
                </el-collapse-item>
              </el-collapse>
              <el-divider content-position="left">协作单位</el-divider>
              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <el-button type="primary" plain icon="Plus" @click="openAddUnit" v-hasPermi="['biz:project:unit']" :disabled="form.status === 'ARCHIVED'">添加协作单位</el-button>
                </el-col>
              </el-row>
              <el-table v-loading="unitLoading" :data="collabUnitList">
                <el-table-column label="单位名称" align="center" :show-overflow-tooltip="true">
                  <template #default="scope">{{ unitDisplayName(scope.row) }}</template>
                </el-table-column>
                <el-table-column label="单位类别" align="center" width="110">
                  <template #default="scope"><dict-tag :options="external_unit_type" :value="scope.row.externalUnitType" /></template>
                </el-table-column>
                <el-table-column label="合作方式" align="center" width="110">
                  <template #default="scope"><dict-tag :options="cooperation_type" :value="scope.row.cooperationType" /></template>
                </el-table-column>
                <el-table-column label="自筹经费（元）" align="right" width="140">
                  <template #default="scope">{{ scope.row.allocatedAmount == null ? '-' : Number(scope.row.allocatedAmount).toLocaleString() }}</template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
                  <template #default="scope">
                    <el-button link type="primary" icon="Delete" @click="handleRemoveUnit(scope.row)" v-hasPermi="['biz:project:unit']" :disabled="form.status === 'ARCHIVED'">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-row :gutter="10" class="mb8" style="margin-top: 6px">
                <el-col :span="1.5">
                  <el-button type="primary" plain icon="Check" @click="saveMemberBudget" v-hasPermi="['biz:project:edit']" :disabled="form.status === 'ARCHIVED'">保存预算</el-button>
                </el-col>
                <el-col :span="22"><span class="form-tip">各单位预算之和不能超过经费总预算（{{ formatBudget(form.budgetApproved) }}）</span></el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane label="人员" name="person">
          <el-divider content-position="left">参与人员</el-divider>
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
            <el-table-column label="所属单位" align="center" min-width="150" :show-overflow-tooltip="true">
              <template #default="scope">{{ memberUnitName(scope.row.unitId) }}</template>
            </el-table-column>
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
        <el-tab-pane label="文档" name="doc">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :before-upload="handleDocBeforeUpload"
                :on-success="handleDocUploadSuccess"
                :on-error="handleDocUploadError"
                :show-file-list="false"
                accept=".pdf,.doc,.docx"
                v-hasPermi="['biz:document:add']"
              >
                <el-button type="primary" plain icon="Upload" :disabled="form.status === 'ARCHIVED'">上传文档</el-button>
              </el-upload>
            </el-col>
            <el-col :span="24"><span class="form-tip">支持 PDF / Word（.pdf/.doc/.docx），大小上限见参数配置 biz.document.maxSize</span></el-col>
          </el-row>
          <el-table v-loading="docLoading" :data="docList">
            <el-table-column label="文件名" align="center" min-width="220" :show-overflow-tooltip="true">
              <template #default="scope">
                <el-link v-if="scope.row.fileUrl" type="primary" :href="baseUrl + scope.row.fileUrl" target="_blank" underline="never">{{ scope.row.fileName }}</el-link>
                <span v-else>{{ scope.row.fileName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="上传人" align="center" prop="uploadBy" width="120" />
            <el-table-column label="上传时间" align="center" prop="uploadTime" width="170">
              <template #default="scope">{{ parseTime(scope.row.uploadTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="90">
              <template #default="scope">
                <el-button link type="primary" icon="Delete" @click="handleDeleteDoc(scope.row)" v-hasPermi="['biz:document:remove']" :disabled="form.status === 'ARCHIVED'">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
            </el-tab-pane>
          </el-tabs>
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
        <el-form-item label="所属单位">
          <el-select v-model="addMemberUnitId" @change="onMemberUnitChange" placeholder="请选择归属单位（默认主持单位）" clearable filterable style="width: 300px">
            <el-option v-for="u in memberUnitOptions" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-tree-select
            v-model="addMemberDeptId"
            :data="memberDeptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="请选择到最低级别部门"
            clearable
            check-strictly
            style="width: 300px"
            @change="onMemberDeptChange"
          />
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
    <el-dialog title="修改课题" v-model="editOpen" width="860px" append-to-body :close-on-click-modal="false">
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
        <el-form-item label="经费预算">
          <unit-budget-editor ref="editUnitBudgetRef" :host-unit-id="editForm.hostUnitId" />
        </el-form-item>
        <el-form-item label="预算合计">
          <span class="budget-total-value">{{ formatBudget(editUnitBudgetTotal) }}</span>
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

    <!-- 添加协作单位对话框（仅协作单位 COLLABORATE；参与单位在课题新增/修改弹窗中选择） -->
    <el-dialog title="添加协作单位" v-model="addUnitOpen" width="520px" append-to-body :close-on-click-modal="false">
      <el-form ref="addUnitRef" :model="addUnitForm" :rules="addUnitRules" label-width="100px">
        <el-form-item label="协作单位" prop="unitIds">
          <el-tree-select
            v-model="addUnitForm.unitIds"
            :data="unitTreeOptions"
            placeholder="请选择协作单位"
            check-strictly
            multiple
            show-checkbox
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="合作方式">
          <el-tag type="info">协作单位（COLLABORATE）</el-tag>
          <span class="form-tip">本弹窗仅添加协作单位；参与单位请在课题新增/修改弹窗中选择</span>
        </el-form-item>
        <el-form-item label="自筹经费">
          <el-input-number v-model="addUnitForm.allocatedAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          <span class="form-tip">协作单位自筹经费金额，仅作展示</span>
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
import { listUserOptions } from "@/api/biz/userProfile"
import { deptTreeSelect } from "@/api/system/user"
import { BUDGET_GROUPS, BUDGET_CATEGORIES, LEGACY_DIRECT, buildBudgetCategoryMap } from "./budgetSplit"
import { listDocument, addDocument, delDocument } from "@/api/biz/document"
import { getConfigKey } from "@/api/system/config"
import { getToken } from "@/utils/auth"
import UnitBudgetEditor from "./unitBudgetEditor.vue"

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()
const { project_type, project_status, project_category, specialty, member_role, budget_category, cooperation_type, external_unit_type } = proxy.useDict("project_type", "project_status", "project_category", "specialty", "member_role", "budget_category", "cooperation_type", "external_unit_type")

// 预算细分：科目名走字典渲染
const budgetCategoryMap = computed(() => buildBudgetCategoryMap(budget_category.value))
const approvedBudgetTotal = computed(() => {
  let t = 0
  BUDGET_CATEGORIES.forEach(c => { t += Number(form.value.budgetApprovedMap?.[c] || 0) })
  return t
})
function initApprovedMap() {
  const m = {}
  BUDGET_CATEGORIES.forEach(c => { m[c] = 0 })
  return m
}
function listToApprovedMap(list) {
  const m = initApprovedMap()
  ;(list || []).forEach(r => { if (r && r.category && BUDGET_CATEGORIES.includes(r.category)) m[r.category] = Number(r.budgetAmount || 0) })
  return m
}
function buildApprovedList() {
  return BUDGET_CATEGORIES.map(c => ({ category: c, budgetAmount: Number(form.value.budgetApprovedMap?.[c] || 0) }))
}

// 预算细分展示（基本信息 tab）
const budgetSplitGroups = computed(() => {
  const map = {}
  ;(form.value.budgetSplitList || []).forEach(s => {
    if (s && s.category) {
      const amt = Number(s.budgetAmount || 0)
      // 旧直接费科目归并到业务费 BUSINESS（V1.0.27 科目精简）
      if (LEGACY_DIRECT.includes(s.category)) {
        map.BUSINESS = (map.BUSINESS || 0) + amt
      } else {
        map[s.category] = (map[s.category] || 0) + amt
      }
    }
  })
  return BUDGET_GROUPS.map(g => ({
    title: g.title,
    items: g.categories.map(c => ({
      label: budgetCategoryMap.value[c] || c,
      budgetAmount: map[c] || 0
    }))
  }))
})
// 可用支出余额：排除人工费(LABOR)后的记账剩余余额
const expenseBalance = computed(() => {
  return (form.value.budgetSplitList || [])
    .filter(s => s && s.category !== 'LABOR')
    .reduce((sum, s) => sum + (Number(s.balance) || 0), 0)
})

const budgetSplitTotal = computed(() => {
  let total = 0
  budgetSplitGroups.value.forEach(g => g.items.forEach(it => { total += it.budgetAmount }))
  return total
})

// 按单位预算编辑（修改弹窗，复用 unitBudgetEditor）
const editUnitBudgetRef = ref(null)
const memberUnitBudgetRef = ref(null)
const editUnitBudgetTotal = computed(() => {
  const inst = editUnitBudgetRef.value
  return inst && inst.budgetTotal ? inst.budgetTotal.value : 0
})

const projectId = computed(() => Number(route.params.projectId))
const activeTab = ref("info")
const memberSubTab = ref("budget")
const budgetCollapse = ref(["approved", "units"])

// 文档上传
const baseUrl = import.meta.env.VITE_APP_BASE_API
const uploadUrl = baseUrl + "/common/upload"
const uploadHeaders = { Authorization: "Bearer " + getToken() }
const docLoading = ref(false)
const docList = ref([])
const docMaxSizeMb = ref(100)

const form = ref({ budgetApprovedMap: {} })
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
const addMemberUnitId = ref(undefined)
const addMemberDeptId = ref(undefined)
// 成员所属部门选项：当前所选单位（二级公司）下的部门树（协作单位无部门树）
const memberDeptOptions = computed(() => {
  if (addMemberUnitId.value == null) return []
  const opt = memberUnitOptions.value.find(o => o.value === Number(addMemberUnitId.value))
  if (opt && opt.type === "COLLABORATE") return []
  const node = findDeptInTree(deptTree.value, addMemberUnitId.value)
  return node && node.children ? node.children : []
})
function findDeptInTree(nodes, id) {
  for (const n of nodes || []) {
    if (Number(n.id) === Number(id)) return n
    const found = findDeptInTree(n.children, id)
    if (found) return found
  }
  return null
}
function onMemberDeptChange() {
  pickedUserIds.value = []
  loadUsersByUnit()
}
// 成员归属单位选项：主持单位 + 参与单位 + 协作单位
const memberUnitOptions = computed(() => {
  const opts = []
  if (form.value.hostUnitId != null) {
    opts.push({ value: Number(form.value.hostUnitId), type: "HOST", label: "主持单位：" + (deptNameMap.value[form.value.hostUnitId] || form.value.hostUnitId) })
  }
  unitList.value.forEach(u => {
    if (u.cooperationType === "COLLABORATE") return // 协作单位无参与人员（需求：不选协作单位参与人员）
    opts.push({ value: Number(u.unitId), type: "PARTICIPANT", label: "参与单位：" + (deptNameMap.value[u.unitId] || u.unitName || u.unitId) })
  })
  return opts
})

function memberUnitName(unitId) {
  if (unitId == null) return "-"
  const opt = memberUnitOptions.value.find(o => o.value === Number(unitId))
  return opt ? opt.label : unitId
}

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
  unitIds: [{ required: true, type: 'array', message: "请选择协作单位", trigger: "change" }]
}

onMounted(() => {
  const tab = route.query && route.query.activeTab
  if (tab === "member" || tab === "info" || tab === "doc") activeTab.value = tab
  loadDetail()
  loadDeptTree()
  loadDocMaxSize()
})

watch(activeTab, val => {
  if (val === "member") { loadMembers(); loadUnits() }
  if (val === "doc") loadDocs()
})

function loadDetail() {
  infoLoading.value = true
  getProject(projectId.value).then(response => {
    form.value = response.data
    form.value.budgetApprovedMap = listToApprovedMap(response.data.budgetApprovedList)
    nextTick(() => {
      memberUnitBudgetRef.value?.reset(form.value.hostUnitId)
      memberUnitBudgetRef.value?.loadFromProject(response.data)
    })
    infoLoading.value = false
  }).catch(() => { infoLoading.value = false })
}

function loadDocs() {
  docLoading.value = true
  listDocument({ projectId: projectId.value, pageNum: 1, pageSize: 1000 }).then(response => {
    docList.value = response.rows || []
    docLoading.value = false
  }).catch(() => { docLoading.value = false })
}

function loadDocMaxSize() {
  getConfigKey("biz.document.maxSize").then(response => {
    const v = Number(response.data)
    if (v > 0) docMaxSizeMb.value = v
  }).catch(() => {})
}

function handleDocBeforeUpload(file) {
  const name = (file.name || "").toLowerCase()
  if (!/\.(pdf|doc|docx)$/.test(name)) {
    proxy.$modal.msgError("仅支持 PDF / Word 文档（.pdf/.doc/.docx）")
    return false
  }
  const limit = docMaxSizeMb.value * 1024 * 1024
  if (file.size > limit) {
    proxy.$modal.msgError("上传文档大小不能超过 " + docMaxSizeMb.value + "MB")
    return false
  }
  proxy.$modal.loading("正在上传文档，请稍候...")
  return true
}

function handleDocUploadSuccess(res) {
  proxy.$modal.closeLoading()
  if (res.code === 200) {
    const fileName = res.originalFilename || (res.fileName || "").split("/").pop()
    addDocument({ projectId: projectId.value, fileName: fileName, fileUrl: res.fileName }).then(() => {
      proxy.$modal.msgSuccess("上传成功")
      loadDocs()
    })
  } else {
    proxy.$modal.msgError(res.msg || "上传失败")
  }
}

function handleDocUploadError() {
  proxy.$modal.closeLoading()
  proxy.$modal.msgError("上传文档失败")
}

function handleDeleteDoc(row) {
  proxy.$modal.confirm('确认删除文档"' + row.fileName + '"吗？').then(() => {
    return delDocument(row.docId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    loadDocs()
  }).catch(() => {})
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
    editLoading.value = false
    editOpen.value = true
    nextTick(() => {
      editUnitBudgetRef.value?.reset(editForm.value.hostUnitId)
      editUnitBudgetRef.value?.loadFromProject(response.data)
    })
  }).catch(() => { editLoading.value = false })
}

function submitEditForm() {
  proxy.$refs["editRef"].validate(valid => {
    if (!valid) return
    editSubmitting.value = true
    const unitBudgetList = editUnitBudgetRef.value ? editUnitBudgetRef.value.buildUnitBudgetList() : []
    // C3：参与/协作单位并入课题 payload 随 edit 保存（后端 saveUnitLinks 全量替换 project_unit，不再单独调 unit 端点）
    const unitList = editUnitBudgetRef.value ? editUnitBudgetRef.value.buildUnitList() : []
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
      unitBudgetList,
      budgetApprovedList: approvedList,
      unitList: mergedUnitList
    }
    updateProject(payload)
      .then(() => {
        proxy.$modal.msgSuccess("修改成功")
        editOpen.value = false
        loadDetail()
      })
      .finally(() => { editSubmitting.value = false })
  })
}

function saveMemberBudget() {
  const inst = memberUnitBudgetRef.value
  if (!inst) return
  const unitBudgetList = inst.buildUnitBudgetList()
  const approvedList = buildApprovedList()
  // 参与单位（经费编辑器）+ 现有协作单位（人员子模块维护，保存时不丢失）
  const budgetUnitList = inst.buildUnitList()
  const existingCollab = unitList.value.filter(u => u.cooperationType === 'COLLABORATE').map(u => ({ unitId: Number(u.unitId), cooperationType: 'COLLABORATE' }))
  const mergedUnitList = [...budgetUnitList, ...existingCollab]
  const total = inst.budgetTotal ? Number(inst.budgetTotal.value || 0) : 0
  const approved = approvedBudgetTotal.value
  if (total > approved) {
    proxy.$modal.msgError("各单位预算之和不能超过经费总预算（" + formatBudget(approved) + "）")
    return
  }
  proxy.$modal.confirm("确认保存经费预算？").then(() => {
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
      unitBudgetList,
      budgetApprovedList: approvedList,
      unitList: mergedUnitList
    }
    return updateProject(payload)
  }).then(() => {
    proxy.$modal.msgSuccess("预算保存成功")
    loadDetail()
    loadUnits()
  }).catch(() => {})
}

function openAddMember() {
  pickedUserIds.value = []
  addMemberKeyword.value = ""
  userSearchList.value = []
  addMemberOpen.value = true
  addMemberDeptId.value = undefined
  addMemberUnitId.value = form.value.hostUnitId != null ? Number(form.value.hostUnitId) : undefined
  loadUnits()
  loadUsersByUnit()
}

function loadUsersByUnit() {
  userSearchLoading.value = true
  const opt = memberUnitOptions.value.find(o => o.value === Number(addMemberUnitId.value))
  let query = {}
  if (opt && opt.type === "COLLABORATE") {
    query = {}
  } else if (addMemberDeptId.value != null) {
    query = { deptId: addMemberDeptId.value }
  } else if (addMemberUnitId.value != null) {
    query = { deptId: addMemberUnitId.value }
  }
  listUserOptions(query).then(response => {
    // 过滤掉当前已是成员的用户
    const existingIds = new Set(memberList.value.map(m => m.userId))
    const kw = (addMemberKeyword.value || "").trim()
    let rows = response.data || []
    if (kw) {
      rows = rows.filter(u => (u.nickName || "").includes(kw) || (u.userName || "").includes(kw))
    }
    userSearchList.value = rows.filter(u => !existingIds.has(u.userId))
    userSearchLoading.value = false
  })
}

function onMemberUnitChange() {
  pickedUserIds.value = []
  addMemberDeptId.value = undefined
  loadUsersByUnit()
}

function searchUsers() {
  loadUsersByUnit()
}

function resetUserSearch() {
  addMemberKeyword.value = ""
  loadUsersByUnit()
}

function handleUserSearchSelectionChange(selection) {
  pickedUserIds.value = selection.map(u => u.userId)
}

function submitAddMember() {
  if (!pickedUserIds.value.length) {
    proxy.$modal.msgWarning("请至少选择一个用户")
    return
  }
  const members = pickedUserIds.value.map(userId => ({ userId, role: "PARTICIPANT", unitId: addMemberUnitId.value }))
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

// 单位 tab：参与/主持单位展示部门名（sys_dept），协作单位展示合作单位名
const deptTree = ref([])
const deptNameMap = ref({})
function loadDeptTree() {
  deptTreeSelect().then(response => {
    deptTree.value = response.data || []
    const map = {}
    const walk = (nodes) => {
      ;(nodes || []).forEach(n => {
        if (n.id != null) map[Number(n.id)] = n.label
        walk(n.children)
      })
    }
    walk(response.data || [])
    deptNameMap.value = map
  })
}
function unitDisplayName(row) {
  if (row.cooperationType === "COLLABORATE") return row.unitName
  return deptNameMap.value[row.unitId] || row.unitName || row.unitId
}

// 协作单位列表（仅协作单位 COLLABORATE，参与单位不在此展示）
const collabUnitList = computed(() => unitList.value.filter(u => u.cooperationType === 'COLLABORATE'))

function loadUnits() {
  unitLoading.value = true
  listProjectUnit({ projectId: projectId.value }).then(response => {
    unitList.value = response.data || []
    unitLoading.value = false
  }).catch(() => { unitLoading.value = false })
}

function openAddUnit() {
  addUnitForm.value = { projectId: projectId.value, unitIds: [], cooperationType: "COLLABORATE", allocatedAmount: undefined }
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
      cooperationType: "COLLABORATE",
      allocatedAmount: addUnitForm.value.allocatedAmount
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

.approved-grid { width: 100%; }
.approved-group { border: 1px solid #ebeef5; border-radius: 4px; margin-bottom: 10px; padding: 8px 10px; }
.approved-group-title { font-weight: 600; color: #303133; margin-bottom: 8px; }
.approved-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.approved-label { width: 180px; color: #606266; font-size: 13px; flex-shrink: 0; }
.approved-total { color: #303133; font-weight: 600; margin-top: 4px; }
.budget-summary-bar { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.budget-summary-label { font-weight: 600; color: #303133; }
.budget-collapse { border-top: none; }
</style>
