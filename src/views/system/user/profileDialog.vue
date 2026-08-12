<template>
  <el-dialog
    :title="title"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="600px"
    append-to-body
    :close-on-click-modal="false"
    @close="cancel"
  >
    <el-form ref="profileRef" :model="form" :rules="rules" label-width="100px" v-loading="loading">
      <el-form-item label="用户">
        <el-input :model-value="userName" disabled />
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
      <el-form-item label="学位" prop="degree">
        <el-select v-model="form.degree" placeholder="请选择学位" clearable style="width: 100%">
          <el-option
            v-for="dict in degree_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="major">
        <el-input v-model="form.major" placeholder="请输入专业" maxlength="100" />
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
      <el-form-item label="研究领域" prop="researchArea">
        <el-select v-model="form.researchArea" placeholder="请选择研究领域" clearable style="width: 100%">
          <el-option
            v-for="dict in research_area"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="研究方向" prop="researchDirection">
        <el-select v-model="form.researchDirection" placeholder="请选择研究方向" clearable style="width: 100%">
          <el-option
            v-for="dict in research_direction"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="入职日期" prop="entryDate">
        <el-date-picker
          v-model="form.entryDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择入职日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="办公电话" prop="officePhone">
        <el-input v-model="form.officePhone" placeholder="请输入办公电话" maxlength="20" />
      </el-form-item>
      <el-form-item label="个人简介" prop="bio">
        <el-input v-model="form.bio" type="textarea" :rows="4" placeholder="请输入个人简介" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { listUserProfile, addUserProfile, updateUserProfile } from "@/api/biz/userProfile"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userId: { type: [Number, String], default: undefined },
  userName: { type: String, default: "" }
})
defineEmits(["update:modelValue"])

const { proxy } = getCurrentInstance()
const { edu_level, degree_level, title_level, research_area, research_direction } = proxy.useDict(
  "edu_level",
  "degree_level",
  "title_level",
  "research_area",
  "research_direction"
)

const loading = ref(false)
const title = ref("科研档案")

const data = reactive({
  form: {},
  rules: {
    eduLevel: [{ required: true, message: "学历不能为空", trigger: "change" }],
    titleLevel: [{ required: true, message: "职称等级不能为空", trigger: "change" }]
  }
})
const { form, rules } = toRefs(data)

/** 表单重置 */
function reset() {
  form.value = {
    profileId: undefined,
    userId: undefined,
    eduLevel: undefined,
    degree: undefined,
    major: undefined,
    titleLevel: undefined,
    researchArea: undefined,
    researchDirection: undefined,
    entryDate: undefined,
    officePhone: undefined,
    bio: undefined,
    remark: undefined
  }
  proxy.resetForm("profileRef")
}

/** 打开时加载档案：按 userId 查列表，取第一条判断有无 */
async function loadProfile() {
  if (!props.userId) {
    reset()
    return
  }
  loading.value = true
  reset()
  try {
    const response = await listUserProfile({ userId: props.userId, pageNum: 1, pageSize: 1 })
    const rows = response.rows || []
    if (rows.length > 0) {
      form.value = { ...rows[0] }
      title.value = "修改科研档案"
    } else {
      form.value.userId = props.userId
      title.value = "新增科研档案"
    }
  } finally {
    loading.value = false
  }
}

/** 关闭弹窗 */
function cancel() {
  proxy.$emit("update:modelValue", false)
  reset()
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["profileRef"].validate(valid => {
    if (!valid) return
    if (form.value.profileId != null && form.value.profileId !== undefined) {
      updateUserProfile(form.value).then(() => {
        proxy.$modal.msgSuccess("修改成功")
        proxy.$emit("update:modelValue", false)
      })
    } else {
      addUserProfile(form.value).then(() => {
        proxy.$modal.msgSuccess("新增成功")
        proxy.$emit("update:modelValue", false)
      })
    }
  })
}

// 弹窗打开时加载档案
watch(
  () => props.modelValue,
  val => {
    if (val) loadProfile()
  }
)
</script>
