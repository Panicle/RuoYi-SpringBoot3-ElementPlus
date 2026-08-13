<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="820px" append-to-body :close-on-click-modal="false">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['biz:unit:contact']">新增联系人</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="contactList" max-height="460">
      <el-table-column prop="contactName" label="姓名" width="100" />
      <el-table-column prop="position" label="职务" width="110" :show-overflow-tooltip="true" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="email" label="邮箱" :show-overflow-tooltip="true" />
      <template v-if="isSchool">
        <el-table-column prop="major" label="专业" width="120" :show-overflow-tooltip="true" />
        <el-table-column prop="researchField" label="研究领域" :show-overflow-tooltip="true" />
      </template>
      <el-table-column prop="isPrimary" label="主联系人" width="90" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.isPrimary === '1'" type="danger">主</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:unit:contact']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:unit:contact']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/修改联系人 -->
    <el-dialog :title="contactTitle" v-model="contactOpen" width="560px" append-to-body :close-on-click-modal="false">
      <el-form ref="contactRef" :model="contactForm" :rules="contactRules" label-width="100px">
        <el-form-item label="姓名" prop="contactName">
          <el-input v-model="contactForm.contactName" placeholder="请输入姓名" maxlength="50" />
        </el-form-item>
        <el-form-item label="职务" prop="position">
          <el-input v-model="contactForm.position" placeholder="请输入职务" maxlength="50" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="contactForm.phone" placeholder="请输入联系电话" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="contactForm.email" placeholder="请输入电子邮箱" maxlength="100" />
        </el-form-item>
        <template v-if="isSchool">
          <el-form-item label="专业" prop="major">
            <el-input v-model="contactForm.major" placeholder="请输入专业" maxlength="100" />
          </el-form-item>
          <el-form-item label="研究领域" prop="researchField">
            <el-input v-model="contactForm.researchField" placeholder="请输入研究领域" maxlength="200" />
          </el-form-item>
        </template>
        <el-form-item label="主联系人">
          <el-radio-group v-model="contactForm.isPrimary">
            <el-radio :value="'0'">否</el-radio>
            <el-radio :value="'1'">是</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitContact">确 定</el-button>
          <el-button @click="contactOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup name="ContactDialog">
import { listUnitContact, addUnitContact, updateUnitContact, delUnitContact } from "@/api/biz/unit"

const { proxy } = getCurrentInstance()

const visible = ref(false)
const loading = ref(false)
const dialogTitle = ref("联系人管理")
const currentUnit = ref({})
const contactList = ref([])

// 学校类单位（externalUnitType=SCHOOL）才显示专业/研究领域
const isSchool = computed(() => currentUnit.value.externalUnitType === "SCHOOL")

const contactOpen = ref(false)
const contactTitle = ref("")
const contactForm = ref({})
const contactRules = {
  contactName: [{ required: true, message: "联系人姓名不能为空", trigger: "blur" }]
}

/** 打开弹窗（row 为当前单位节点） */
function show(row) {
  currentUnit.value = row || {}
  dialogTitle.value = "联系人管理 - " + (currentUnit.value.unitName || "")
  visible.value = true
  getContacts()
}

/** 查询单位联系人列表 */
function getContacts() {
  loading.value = true
  listUnitContact({ unitId: currentUnit.value.unitId }).then(response => {
    contactList.value = response.data
    loading.value = false
  })
}

/** 联系人表单重置 */
function resetContactForm() {
  contactForm.value = {
    contactId: undefined,
    unitId: currentUnit.value.unitId,
    contactName: undefined,
    position: undefined,
    phone: undefined,
    email: undefined,
    major: undefined,
    researchField: undefined,
    isPrimary: "0"
  }
  proxy.resetForm("contactRef")
}

/** 新增联系人 */
function handleAdd() {
  resetContactForm()
  contactTitle.value = "新增联系人"
  contactOpen.value = true
}

/** 修改联系人 */
function handleUpdate(row) {
  resetContactForm()
  contactForm.value = { ...row }
  contactTitle.value = "修改联系人"
  contactOpen.value = true
}

/** 提交联系人 */
function submitContact() {
  proxy.$refs["contactRef"].validate(valid => {
    if (!valid) return
    if (contactForm.value.contactId != undefined) {
      updateUnitContact(contactForm.value).then(() => {
        proxy.$modal.msgSuccess("修改成功")
        contactOpen.value = false
        getContacts()
      })
    } else {
      addUnitContact(contactForm.value).then(() => {
        proxy.$modal.msgSuccess("新增成功")
        contactOpen.value = false
        getContacts()
      })
    }
  })
}

/** 删除联系人 */
function handleDelete(row) {
  proxy.$modal.confirm('确认删除联系人"' + row.contactName + '"吗?').then(() => {
    return delUnitContact(row.contactId)
  }).then(() => {
    getContacts()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

defineExpose({ show })
</script>
