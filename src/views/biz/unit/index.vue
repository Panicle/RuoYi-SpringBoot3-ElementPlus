<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="单位名称" prop="unitName">
        <el-input
          v-model="queryParams.unitName"
          placeholder="请输入单位名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单位类别" prop="externalUnitType">
        <el-select v-model="queryParams.externalUnitType" placeholder="单位类别" clearable style="width: 200px">
          <el-option v-for="dict in external_unit_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['biz:unit:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['biz:unit:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="unitList"
      row-key="unitId"
      :default-expand-all="isExpandAll"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="unitName" label="单位名称" width="280" />
      <el-table-column prop="externalUnitType" label="单位类别" width="100">
        <template #default="scope">
          <dict-tag :options="external_unit_type" :value="scope.row.externalUnitType" />
        </template>
      </el-table-column>
      <el-table-column prop="companyType" label="公司类型" width="100">
        <template #default="scope">
          <dict-tag :options="company_type" :value="scope.row.companyType" />
        </template>
      </el-table-column>
      <el-table-column prop="companyCategory" label="公司性质" width="100">
        <template #default="scope">
          <dict-tag :options="company_category" :value="scope.row.companyCategory" />
        </template>
      </el-table-column>
      <el-table-column prop="expertise" label="擅长领域" :show-overflow-tooltip="true" />
      <el-table-column prop="orderNum" label="排序" width="60" />
      <el-table-column prop="contactPerson" label="联系人" width="90" />
      <el-table-column prop="contactPhone" label="联系电话" width="120" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:unit:edit']">修改</el-button>
          <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['biz:unit:add']">新增</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:unit:remove']">删除</el-button>
          <el-button link type="primary" icon="User" @click="handleContact(scope.row)" v-hasPermi="['biz:unit:query']">联系人</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改单位对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="unitRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24" v-if="!isTopLevel">
            <el-form-item label="上级单位" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="unitOptions"
                :props="{ value: 'unitId', label: 'unitName', children: 'children' }"
                value-key="unitId"
                placeholder="选择上级单位"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位名称" prop="unitName">
              <el-input v-model="form.unitName" placeholder="请输入单位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <template v-if="isTopLevel">
            <el-col :span="12">
              <el-form-item label="单位类别" prop="externalUnitType">
                <el-select v-model="form.externalUnitType" placeholder="请选择单位类别" clearable style="width: 100%">
                  <el-option v-for="dict in external_unit_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </template>
          <template v-else>
            <el-col :span="12">
              <el-form-item label="单位类别">
                <el-input :model-value="externalUnitTypeLabel" disabled />
              </el-form-item>
            </el-col>
          </template>
          <template v-if="isCompany">
            <el-col :span="12">
              <el-form-item label="公司类型" prop="companyType">
                <el-select v-model="form.companyType" placeholder="请选择公司类型" clearable style="width: 100%">
                  <el-option v-for="dict in company_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公司性质" prop="companyCategory">
                <el-select v-model="form.companyCategory" placeholder="请选择公司性质" clearable style="width: 100%">
                  <el-option v-for="dict in company_category" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="信用代码" prop="creditCode">
                <el-input v-model="form.creditCode" placeholder="请输入统一社会信用代码" maxlength="18" />
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="24" v-if="isCompany || isSchool">
            <el-form-item label="擅长领域" prop="expertise">
              <el-input v-model="form.expertise" type="textarea" :rows="2" placeholder="请输入擅长领域" maxlength="500" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="form.contactPerson" placeholder="请输入联系人" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="单位地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入单位地址" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 联系人管理弹窗 -->
    <contact-dialog ref="contactDialogRef" />
  </div>
</template>

<script setup name="Unit">
import { listUnit, getUnit, delUnit, addUnit, updateUnit, unitExcludeChild } from "@/api/biz/unit"
import ContactDialog from "./contactDialog.vue"

const { proxy } = getCurrentInstance();
const { external_unit_type, company_type, company_category } = proxy.useDict("external_unit_type", "company_type", "company_category");

const unitList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const unitOptions = ref([]);
const isExpandAll = ref(true);
const refreshTable = ref(true);
const contactDialogRef = ref();

const data = reactive({
  form: {},
  queryParams: {
    unitName: undefined,
    externalUnitType: undefined
  },
  rules: {
    unitName: [{ required: true, message: "单位名称不能为空", trigger: "blur" }],
    orderNum: [{ required: true, message: "显示排序不能为空", trigger: "blur" }],
    externalUnitType: [{ required: true, message: "单位类别不能为空", trigger: "change" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 顶级（parentId 为 0/空）才可编辑类型；子单位类型继承父级只读
const isTopLevel = computed(() => !form.value.parentId || form.value.parentId === 0);
const isCompany = computed(() => form.value.externalUnitType === "COMPANY");
const isSchool = computed(() => form.value.externalUnitType === "SCHOOL");
const externalUnitTypeLabel = computed(() => dictLabel(external_unit_type.value, form.value.externalUnitType));

function dictLabel(options, value) {
  if (value == null) return ""
  const d = options.find(o => o.value === value)
  return d ? d.label : value
}

/** 查询单位列表 */
function getList() {
  loading.value = true;
  listUnit(queryParams.value).then(response => {
    unitList.value = proxy.handleTree(response.data, "unitId");
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    unitId: undefined,
    parentId: undefined,
    unitName: undefined,
    externalUnitType: undefined,
    companyType: undefined,
    companyCategory: undefined,
    creditCode: undefined,
    expertise: undefined,
    orderNum: 0,
    contactPerson: undefined,
    contactPhone: undefined,
    address: undefined
  };
  proxy.resetForm("unitRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 新增按钮操作（row 存在则为新增下级） */
function handleAdd(row) {
  reset();
  listUnit().then(response => {
    unitOptions.value = proxy.handleTree(response.data, "unitId");
  });
  if (row != undefined) {
    // 层级深度前端提示（后端强校验）：公司≤3层 / 学校≤2层
    const depth = countAncestors(row.ancestors) + 1;
    if (row.externalUnitType === "COMPANY" && depth >= 3) {
      proxy.$modal.msgWarning("公司层级最多三层，不能再新增下级");
      return;
    }
    if (row.externalUnitType === "SCHOOL" && depth >= 2) {
      proxy.$modal.msgWarning("学校层级最多两层，不能再新增下级");
      return;
    }
    form.value.parentId = row.unitId;
    // 子单位类型继承父级
    form.value.externalUnitType = row.externalUnitType;
  }
  open.value = true;
  title.value = "添加合作单位";
}

/** 展开/折叠操作 */
function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  unitExcludeChild(row.unitId).then(response => {
    unitOptions.value = proxy.handleTree(response.data, "unitId");
  });
  getUnit(row.unitId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改合作单位";
  });
}

/** 联系人按钮操作 */
function handleContact(row) {
  contactDialogRef.value.show(row);
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["unitRef"].validate(valid => {
    if (valid) {
      if (form.value.unitId != undefined) {
        updateUnit(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addUnit(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除名称为"' + row.unitName + '"的数据项?').then(function() {
    return delUnit(row.unitId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出操作 */
function handleExport() {
  proxy.download("biz/unit/export", {
    ...queryParams.value
  }, `unit_${new Date().getTime()}.xlsx`);
}

/** ancestors 逗号分段计数（祖级个数） */
function countAncestors(ancestors) {
  if (!ancestors) return 0;
  return String(ancestors).split(",").filter(s => s).length;
}

getList();
</script>
