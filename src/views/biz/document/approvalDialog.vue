<template>
  <el-dialog title="资料审批" v-model="visible" width="600px" append-to-body :close-on-click-modal="false">
    <div v-loading="loading">
      <el-descriptions :column="1" border class="mb8">
        <el-descriptions-item label="文件名">{{ doc.fileName }}</el-descriptions-item>
        <el-descriptions-item label="所属课题">{{ doc.projectName }}</el-descriptions-item>
        <el-descriptions-item label="课题阶段">
          <dict-tag :options="project_stage" :value="doc.stage" />
        </el-descriptions-item>
        <el-descriptions-item label="提交人">{{ doc.submitterId || doc.uploadBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批轮次">{{ approval.round || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-form ref="auditRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="审批动作" prop="action">
          <el-radio-group v-model="auditForm.action">
            <el-radio value="APPROVE">通过</el-radio>
            <el-radio value="REJECT">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment">
          <el-input v-model="auditForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见" maxlength="500" />
        </el-form-item>
        <el-form-item v-if="auditForm.action === 'REJECT'" label="驳回原因" prop="rejectReason">
          <el-input v-model="auditForm.rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因（申请人重报时可查看）" maxlength="500" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="submitting" @click="submitAudit">确 定</el-button>
        <el-button @click="visible = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="ApprovalDialog">
import { getDocument, auditApproval } from "@/api/biz/document"

const { proxy } = getCurrentInstance()
const { project_stage } = proxy.useDict("project_stage")

const emit = defineEmits(["success"])

const visible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const doc = ref({})
const approval = ref({})
const auditForm = ref({})

/** 驳回时意见与驳回原因必填；通过时意见选填 */
const auditRules = computed(() => {
  const reject = auditForm.value.action === "REJECT"
  return {
    action: [{ required: true, message: "请选择审批动作", trigger: "change" }],
    comment: [{ required: reject, message: "审批意见不能为空", trigger: "blur" }],
    rejectReason: [{ required: reject, message: "驳回原因不能为空", trigger: "blur" }]
  }
})

/** 父组件调用打开：拉详情拿 approvalId（列表行不含），并回显资料信息 */
function show(row) {
  visible.value = true
  loading.value = true
  doc.value = row || {}
  approval.value = {}
  resetForm()
  getDocument(row.docId).then(response => {
    const d = response.data || {}
    doc.value = d
    approval.value = d.approval || {}
    loading.value = false
  }).catch(() => {
    loading.value = false
    visible.value = false
  })
}

function resetForm() {
  auditForm.value = { action: "APPROVE", comment: null, rejectReason: null }
  proxy.resetForm("auditRef")
}

function submitAudit() {
  if (!approval.value.approvalId) {
    proxy.$modal.msgError("未获取到审批信息，请刷新后重试")
    return
  }
  proxy.$refs["auditRef"].validate(valid => {
    if (!valid) return
    submitting.value = true
    const f = auditForm.value
    const payload = {
      action: f.action,
      comment: f.comment,
      rejectReason: f.action === "REJECT" ? f.rejectReason : null
    }
    auditApproval(approval.value.approvalId, payload).then(() => {
      proxy.$modal.msgSuccess(f.action === "APPROVE" ? "审批通过" : "已驳回")
      visible.value = false
      emit("success")
    }).finally(() => { submitting.value = false })
  })
}

defineExpose({ show })
</script>
