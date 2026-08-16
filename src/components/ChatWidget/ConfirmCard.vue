<template>
  <div class="confirm-card">
    <div class="confirm-card-header">操作确认</div>
    <div class="confirm-card-summary">{{ summary }}</div>
    <div v-if="resultMessage" class="confirm-card-result">{{ resultMessage }}</div>
    <div v-else class="confirm-card-actions">
      <el-button type="primary" size="small" :loading="loading" @click="handleConfirm">确认</el-button>
      <el-button size="small" :disabled="loading" @click="handleCancel">取消</el-button>
    </div>
  </div>
</template>

<script setup name="ConfirmCard">
import { confirmChat } from "@/api/biz/chat"

const props = defineProps({
  confirmId: { type: String, required: true },
  summary: { type: String, default: "" }
})
const emit = defineEmits(["cancel"])

const loading = ref(false)
const resultMessage = ref("")

/** 确认：approved=true 才执行写操作，确认后回显执行结果 */
function handleConfirm() {
  loading.value = true
  confirmChat({ confirmId: props.confirmId, approved: true }).then(response => {
    const data = response.data || {}
    resultMessage.value = data.message || (data.executed ? "操作已执行" : "操作已取消")
  }).catch(() => {
    resultMessage.value = "操作失败，请重试"
  }).finally(() => { loading.value = false })
}

/** 取消：approved=false 丢弃（清理服务端卡片），关闭卡片 */
function handleCancel() {
  loading.value = true
  confirmChat({ confirmId: props.confirmId, approved: false }).then(() => {
    emit("cancel")
  }).catch(() => {
    emit("cancel")
  }).finally(() => { loading.value = false })
}
</script>

<style scoped>
.confirm-card {
  border: 1px solid #e6a23c;
  border-radius: 6px;
  padding: 12px;
  margin: 4px 0 12px;
  background: #fdf6ec;
}
.confirm-card-header { font-size: 13px; font-weight: 600; color: #b88230; margin-bottom: 8px; }
.confirm-card-summary { font-size: 13px; color: #606266; line-height: 1.5; word-break: break-word; }
.confirm-card-result { margin-top: 8px; font-size: 13px; color: #67c23a; }
.confirm-card-actions { margin-top: 8px; display: flex; gap: 8px; }
</style>
