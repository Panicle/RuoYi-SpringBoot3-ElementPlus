<template>
  <el-dialog title="审批历史" v-model="visible" width="640px" append-to-body :close-on-click-modal="false">
    <div v-loading="loading">
      <template v-if="historyList.length">
        <div v-for="group in roundGroups" :key="group.round" class="round-group">
          <div class="round-header">第 {{ group.round }} 轮</div>
          <el-timeline>
            <el-timeline-item
              v-for="item in group.items"
              :key="item.historyId"
              :type="actionTagType(item.action)"
              :timestamp="item.operateTime"
              placement="top"
            >
              <el-tag :type="actionTagType(item.action)" effect="light" size="small">{{ actionLabel(item.action) }}</el-tag>
              <span class="tl-operator">{{ item.operatorName || ('用户#' + item.operatorId) }}</span>
              <div v-if="item.commentText" class="tl-opinion">{{ item.commentText }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <el-empty v-else description="暂无审批历史" />
    </div>
  </el-dialog>
</template>

<script setup name="HistoryDialog">
import { getDocument, listApprovalHistory } from "@/api/biz/document"

const visible = ref(false)
const loading = ref(false)
const doc = ref({})
const historyList = ref([])

/** action 标签前端映射，不硬编码后端值 */
const ACTION_LABELS = {
  SUBMIT: "发起",
  APPROVE: "通过",
  REJECT: "驳回",
  RESUBMIT: "重报"
}
const ACTION_TAG_TYPES = {
  SUBMIT: "primary",
  APPROVE: "success",
  REJECT: "danger",
  RESUBMIT: "warning"
}

function actionLabel(action) {
  return ACTION_LABELS[action] || action
}

function actionTagType(action) {
  return ACTION_TAG_TYPES[action] || "info"
}

/** 按 round 分组（后端已按 round + operate_time 有序，分组保持原序） */
const roundGroups = computed(() => {
  const groups = []
  const map = {}
  ;(historyList.value || []).forEach(h => {
    const r = h.round || 0
    if (!map[r]) {
      map[r] = { round: r, items: [] }
      groups.push(map[r])
    }
    map[r].items.push(h)
  })
  return groups
})

/** 父组件调用打开：列表行不含 approvalId，先拉详情拿当前审批，再取该审批完整历史 */
function show(row) {
  visible.value = true
  loading.value = true
  historyList.value = []
  doc.value = row || {}
  if (!row.docId) {
    loading.value = false
    return
  }
  getDocument(row.docId).then(response => {
    const approval = (response.data || {}).approval || {}
    const approvalId = approval.approvalId
    if (!approvalId) return null
    return listApprovalHistory(approvalId)
  }).then(response => {
    historyList.value = response ? (response.data || []) : []
    loading.value = false
  }).catch(() => { loading.value = false })
}

defineExpose({ show })
</script>

<style scoped>
.round-header { font-weight: 600; color: #303133; margin: 4px 0 12px; }
.tl-operator { margin-left: 8px; color: #606266; font-size: 13px; }
.tl-opinion { margin-top: 4px; color: #909399; font-size: 13px; }
</style>
