<template>
  <el-dialog :title="title" v-model="visible" width="900px" top="5vh" append-to-body :close-on-click-modal="false">
    <!-- 上半：已关联列表 -->
    <el-table v-loading="loading" :data="relationList">
      <el-table-column label="关联类型" align="center" prop="refType" width="120">
        <template #default="scope">
          <dict-tag :options="honor_ref_type" :value="scope.row.refType" />
        </template>
      </el-table-column>
      <el-table-column label="名称" align="center" prop="refName" :show-overflow-tooltip="true" />
      <el-table-column label="角色描述" align="center" prop="roleDesc" :show-overflow-tooltip="true" />
      <el-table-column label="贡献描述" align="center" prop="contributionDesc" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="danger" icon="Delete" @click="handleDeleteRelation(scope.row)" v-hasPermi="['biz:honor:relation']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 下半：添加关联 -->
    <div v-hasPermi="['biz:honor:relation']" class="relation-add">
      <el-divider content-position="left">添加关联</el-divider>
      <el-form ref="addRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="关联类型" prop="refType">
          <el-select v-model="addForm.refType" placeholder="请选择关联类型" clearable style="width: 100%" @change="handleRefTypeChange">
            <el-option
              v-for="dict in honor_ref_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="addForm.refType" label="关联对象" prop="refId">
          <!-- 课题 -->
          <el-select
            v-if="addForm.refType === 'PROJECT'"
            v-model="addForm.refId"
            placeholder="请选择课题"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="p in projectOptions"
              :key="p.projectId"
              :label="`${p.projectNo || ''} ${p.projectName || ''}`"
              :value="p.projectId"
            />
          </el-select>
          <!-- 研究员 -->
          <el-select
            v-else-if="addForm.refType === 'RESEARCHER'"
            v-model="addForm.refId"
            placeholder="请选择用户"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.userId"
              :label="`${u.nickName || ''}(${u.userName || ''})`"
              :value="u.userId"
            />
          </el-select>
          <!-- 合作单位（树） -->
          <el-tree-select
            v-else-if="addForm.refType === 'UNIT'"
            v-model="addForm.refId"
            :data="unitTreeOptions"
            placeholder="请选择合作单位"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="addForm.roleDesc" placeholder="请输入角色描述" maxlength="200" />
        </el-form-item>
        <el-form-item label="贡献描述" prop="contributionDesc">
          <el-input v-model="addForm.contributionDesc" type="textarea" :rows="2" placeholder="请输入贡献描述" maxlength="500" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="addLoading" @click="submitAdd">添加关联</el-button>
          <el-button @click="resetAdd">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="HonorRelationDialog">
import { listHonorRelation, addHonorRelation, delHonorRelation } from "@/api/biz/honor"
import { listProject } from "@/api/biz/project"
import { listUser } from "@/api/system/user"
import { treeUnit } from "@/api/biz/unit"

const { proxy } = getCurrentInstance()
const { honor_ref_type } = proxy.useDict("honor_ref_type")

const visible = ref(false)
const loading = ref(false)
const title = ref("荣誉关联管理")
const honorId = ref(undefined)

const relationList = ref([])
const projectOptions = ref([])
const userOptions = ref([])
const unitTreeOptions = ref([])

// 加载单位树（后端返回 id/label/children；el-tree-select 默认 value/label）
function mapUnitTreeOptions(nodes) {
  return (nodes || []).map(node => ({
    value: node.id,
    label: node.label,
    disabled: !!node.disabled,
    children: node.children && node.children.length ? mapUnitTreeOptions(node.children) : undefined
  }))
}

const addLoading = ref(false)
const addForm = ref({
  refType: null,
  refId: null,
  roleDesc: null,
  contributionDesc: null
})
const addRules = {
  refType: [{ required: true, message: "请选择关联类型", trigger: "change" }],
  refId: [{ required: true, message: "请选择关联对象", trigger: "change" }]
}

function show(row) {
  honorId.value = row.honorId
  title.value = "荣誉关联管理 — " + (row.honorName || "")
  resetAdd()
  loadRelations()
  loadProjectOptions()
  loadUserOptions()
  loadUnitTree()
  visible.value = true
}

function loadRelations() {
  loading.value = true
  listHonorRelation({ honorId: honorId.value }).then(response => {
    relationList.value = response.rows || response.data || []
    loading.value = false
  }).catch(() => { loading.value = false })
}

function loadProjectOptions() {
  listProject({ pageNum: 1, pageSize: 1000 }).then(response => {
    projectOptions.value = response.rows || []
  })
}

function loadUserOptions() {
  listUser({ pageNum: 1, pageSize: 1000 }).then(response => {
    userOptions.value = response.rows || []
  })
}

function loadUnitTree() {
  treeUnit().then(response => {
    unitTreeOptions.value = mapUnitTreeOptions(response.data || [])
  })
}

/** 切换 refType 时清空已选 refId（显式 null） */
function handleRefTypeChange() {
  addForm.value.refId = null
}

function resetAdd() {
  addForm.value = {
    refType: null,
    refId: null,
    roleDesc: null,
    contributionDesc: null
  }
  proxy.resetForm("addRef")
}

function submitAdd() {
  proxy.$refs["addRef"].validate(valid => {
    if (!valid) return
    addLoading.value = true
    const payload = {
      honorId: honorId.value,
      refType: addForm.value.refType,
      refId: addForm.value.refId,
      roleDesc: addForm.value.roleDesc,
      contributionDesc: addForm.value.contributionDesc
    }
    addHonorRelation(payload).then(() => {
      proxy.$modal.msgSuccess("添加成功")
      resetAdd()
      loadRelations()
    }).finally(() => { addLoading.value = false })
  })
}

function handleDeleteRelation(row) {
  proxy.$modal.confirm('确认删除该关联记录吗？').then(() => {
    return delHonorRelation(row.relationId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    loadRelations()
  }).catch(() => {})
}

defineExpose({ show })
</script>

<style scoped>
.relation-add { margin-top: 16px; }
</style>
