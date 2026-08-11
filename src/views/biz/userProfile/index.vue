<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="姓名" prop="nickName">
        <el-input
          v-model="queryParams.nickName"
          placeholder="请输入姓名"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="学历" prop="eduLevel">
        <el-select v-model="queryParams.eduLevel" placeholder="请选择学历" clearable style="width: 200px">
          <el-option
            v-for="dict in edu_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="职称等级" prop="titleLevel">
        <el-select v-model="queryParams.titleLevel" placeholder="请选择职称等级" clearable style="width: 200px">
          <el-option
            v-for="dict in title_level"
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
          v-hasPermi="['biz:userProfile:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['biz:userProfile:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['biz:userProfile:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Upload"
          @click="handleImport"
          v-hasPermi="['biz:userProfile:import']"
        >导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:userProfile:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="userProfileList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="姓名" align="center" prop="nickName" />
      <el-table-column label="部门" align="center" prop="deptName" />
      <el-table-column label="学历" align="center" prop="eduLevel">
        <template #default="scope">
          <dict-tag :options="edu_level" :value="scope.row.eduLevel" />
        </template>
      </el-table-column>
      <el-table-column label="职称等级" align="center" prop="titleLevel">
        <template #default="scope">
          <dict-tag :options="title_level" :value="scope.row.titleLevel" />
        </template>
      </el-table-column>
      <el-table-column label="研究方向" align="center" prop="researchDirection" :show-overflow-tooltip="true" />
      <el-table-column label="研究领域" align="center" prop="researchArea" :show-overflow-tooltip="true" />
      <el-table-column label="入职日期" align="center" prop="entryDate" width="120">
        <template #default="scope">
          <span>{{ parseTime(scope.row.entryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:userProfile:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:userProfile:remove']">删除</el-button>
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

    <!-- 添加或修改科研人员对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="userProfileRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" :disabled="form.profileId != undefined" />
        </el-form-item>
        <el-form-item label="学历" prop="eduLevel">
          <el-select v-model="form.eduLevel" placeholder="请选择学历" clearable style="width: 100%">
            <el-option
              v-for="dict in edu_level"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职称等级" prop="titleLevel">
          <el-select v-model="form.titleLevel" placeholder="请选择职称等级" clearable style="width: 100%">
            <el-option
              v-for="dict in title_level"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="研究方向" prop="researchDirection">
          <el-input v-model="form.researchDirection" placeholder="请输入研究方向" />
        </el-form-item>
        <el-form-item label="研究领域" prop="researchArea">
          <el-input v-model="form.researchArea" placeholder="请输入研究领域" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idNumber">
          <el-input v-model="form.idNumber" placeholder="请输入身份证号" maxlength="18" />
        </el-form-item>
        <el-form-item label="入职日期" prop="entryDate">
          <el-date-picker
            v-model="form.entryDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择入职日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="办公电话" prop="officePhone">
          <el-input v-model="form.officePhone" placeholder="请输入办公电话" maxlength="20" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 科研人员导入对话框 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
      <el-upload ref="uploadRef" :limit="1" accept=".xlsx, .xls" :headers="upload.headers" :action="upload.url + '?updateSupport=' + upload.updateSupport" :disabled="upload.isUploading" :on-progress="handleFileUploadProgress" :on-success="handleFileSuccess" :on-change="handleFileChange" :on-remove="handleFileRemove" :auto-upload="false" drag>
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip text-center">
            <div class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" />是否更新已经存在的科研人员数据
            </div>
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="UserProfile">
import { getToken } from "@/utils/auth"
import { listUserProfile, getUserProfile, delUserProfile, addUserProfile, updateUserProfile } from "@/api/biz/userProfile"

const { proxy } = getCurrentInstance();
const { edu_level, title_level } = proxy.useDict("edu_level", "title_level");

const userProfileList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
/*** 科研人员导入参数 */
const upload = reactive({
  // 是否显示弹出层（科研人员导入）
  open: false,
  // 弹出层标题（科研人员导入）
  title: "",
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的科研人员数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: { Authorization: "Bearer " + getToken() },
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + "/biz/userProfile/importData"
})

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    nickName: undefined,
    eduLevel: undefined,
    titleLevel: undefined,
    deptId: undefined
  },
  rules: {
    userId: [{ required: true, message: "用户ID不能为空", trigger: "blur" }],
    eduLevel: [{ required: true, message: "学历不能为空", trigger: "change" }],
    titleLevel: [{ required: true, message: "职称等级不能为空", trigger: "change" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询科研人员列表 */
function getList() {
  loading.value = true;
  listUserProfile(queryParams.value).then(response => {
    userProfileList.value = response.rows;
    total.value = response.total;
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
    profileId: undefined,
    userId: undefined,
    deptId: undefined,
    eduLevel: undefined,
    titleLevel: undefined,
    researchDirection: undefined,
    researchArea: undefined,
    idNumber: undefined,
    entryDate: undefined,
    officePhone: undefined,
    remark: undefined
  };
  proxy.resetForm("userProfileRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.profileId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加科研人员";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const profileId = row.profileId || ids.value;
  getUserProfile(profileId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改科研人员";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["userProfileRef"].validate(valid => {
    if (valid) {
      if (form.value.profileId != undefined) {
        updateUserProfile(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addUserProfile(form.value).then(response => {
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
  const profileIds = row.profileId || ids.value;
  proxy.$modal.confirm('是否确认删除姓名为"' + (row.nickName || profileIds) + '"的数据项？').then(function() {
    return delUserProfile(profileIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("biz/userProfile/export", {
    ...queryParams.value,
  }, `userProfile_${new Date().getTime()}.xlsx`);
}

/** 导入按钮操作 */
function handleImport() {
  upload.title = "科研人员导入";
  upload.open = true;
  upload.selectedFile = null;
}

/** 下载模板操作 */
function importTemplate() {
  proxy.download("biz/userProfile/importTemplate", {}, `userProfile_template_${new Date().getTime()}.xlsx`);
}

/** 文件上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};

/** 文件选择处理 */
const handleFileChange = (file, fileList) => {
  upload.selectedFile = file;
};

/** 文件删除处理 */
const handleFileRemove = (file, fileList) => {
  upload.selectedFile = null;
};

/** 文件上传成功处理 */
const handleFileSuccess = (response, file, fileList) => {
  upload.open = false;
  upload.isUploading = false;
  proxy.$refs["uploadRef"].handleRemove(file);
  proxy.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
  getList();
};

/** 提交上传文件 */
function submitFileForm() {
  const file = upload.selectedFile;
  if (!file || file.length === 0 || (!file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx'))) {
    proxy.$modal.msgError("请选择后缀为 “xls”或“xlsx”的文件。");
    return;
  }
  proxy.$refs["uploadRef"].submit();
}

getList();
</script>