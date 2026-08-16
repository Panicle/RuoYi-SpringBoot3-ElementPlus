<template>
  <div class="chat-widget">
    <!-- 悬浮入口按钮 -->
    <transition name="chat-fade">
      <div v-if="!open" class="chat-toggle" @click="handleOpen">
        <el-badge :value="notifyStore.unreadCount" :hidden="notifyStore.unreadCount <= 0" :max="99" type="danger">
          <el-icon :size="26"><ChatDotRound /></el-icon>
        </el-badge>
      </div>
    </transition>

    <!-- 对话面板 -->
    <transition name="chat-pop">
      <div v-if="open" class="chat-panel">
        <div class="chat-header">
          <span class="chat-title">对话精灵</span>
          <el-icon class="chat-close" @click="handleClose"><Close /></el-icon>
        </div>
        <div v-if="!configured" class="chat-tip">对话精灵未配置 LLM，暂时无法智能问答</div>
        <div ref="msgListRef" class="chat-messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="['chat-msg', msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-assistant']"
          >
            <div class="chat-msg-body">{{ msg.content }}</div>
          </div>
          <confirm-card
            v-if="currentConfirmCard"
            :confirm-id="currentConfirmCard.confirmId"
            :summary="currentConfirmCard.summary"
            @cancel="handleConfirmCancel"
          />
        </div>
        <div class="chat-footer">
          <el-input
            v-model="input"
            placeholder="请输入您的问题，回车发送"
            :disabled="sending"
            clearable
            @keyup.enter="handleSend"
          />
          <el-button type="primary" :loading="sending" @click="handleSend">发送</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup name="ChatWidget">
import { ElNotification } from "element-plus"
import { askChat, getChatSession } from "@/api/biz/chat"
import { getToken } from "@/utils/auth"
import useNotifyStore from "@/store/modules/notify"
import ConfirmCard from "./ConfirmCard.vue"

const notifyStore = useNotifyStore()

const open = ref(false)
const sending = ref(false)
const input = ref("")
const messages = ref([])
const configured = ref(true)
const currentConfirmCard = ref(null)
const msgListRef = ref()
let wsRef = null

/** 打开面板：加载会话历史 + 刷新未读计数 + 建立预警推送连接 */
function handleOpen() {
  open.value = true
  loadSession()
  notifyStore.refreshUnreadCount()
  connectWs()
}

/** 关闭面板 */
function handleClose() {
  open.value = false
  currentConfirmCard.value = null
}

/** 加载会话上下文（{role, content}[]） */
function loadSession() {
  getChatSession().then(response => {
    messages.value = (response.data || []).map(m => ({ role: m.role, content: m.content }))
    scrollToBottom()
  }).catch(() => {})
}

/** 发送消息：POST /biz/chat/ask，追加 assistant 回复；configured=false 显示降级提示条 */
function handleSend() {
  const content = input.value.trim()
  if (!content || sending.value) return
  messages.value.push({ role: "user", content })
  input.value = ""
  sending.value = true
  askChat({ message: content }).then(response => {
    const data = response.data || {}
    configured.value = data.configured !== false
    messages.value.push({ role: "assistant", content: data.reply || "" })
    if (data.confirmCard) {
      currentConfirmCard.value = data.confirmCard
    }
  }).catch(() => {
    messages.value.push({ role: "assistant", content: "请求失败，请稍后重试" })
  }).finally(() => {
    sending.value = false
    scrollToBottom()
  })
}

/** 确认卡片取消：关闭卡片 */
function handleConfirmCancel() {
  currentConfirmCard.value = null
}

/**
 * WebSocket /ws/pet 预警推送（挂载即连接，供通知铃铛实时刷新 + 本处弹窗提示）。
 * 连接失败静默降级不阻塞；payload 为 JSON 文本 {alertId,title,content,alertType,alertLevel}，
 * 收到即刷新全局未读计数，并用 ElNotification 弹窗（title=预警标题，message=内容）。
 */
function connectWs() {
  if (!window.WebSocket || wsRef) return
  const token = getToken()
  if (!token) return
  try {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:"
    const ws = new WebSocket(protocol + "//" + location.host + "/ws/pet?token=" + encodeURIComponent(token))
    wsRef = ws
    ws.onmessage = (event) => {
      notifyStore.refreshUnreadCount()
      let title = ""
      let message = ""
      try {
        const data = JSON.parse(event.data)
        title = data && data.title ? data.title : ""
        message = data && data.content ? data.content : ""
      } catch (e) { /* 非 JSON 推送：仅刷新未读计数 */ }
      ElNotification({
        title: title || "新的预警通知",
        message: message || '请前往"我的通知"查看',
        type: "warning",
        duration: 4500
      })
    }
    ws.onclose = () => { wsRef = null }
    ws.onerror = () => { wsRef = null }
  } catch (e) {
    wsRef = null
  }
}

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    if (msgListRef.value) {
      msgListRef.value.scrollTop = msgListRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  connectWs()
})

onUnmounted(() => {
  if (wsRef) {
    try { wsRef.close() } catch (e) { /* 忽略 */ }
    wsRef = null
  }
})
</script>

<style scoped>
.chat-widget { position: fixed; right: 24px; bottom: 24px; z-index: 2000; }
.chat-toggle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
.chat-panel {
  width: 360px;
  height: 480px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-header {
  height: 48px;
  padding: 0 16px;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.chat-title { font-size: 15px; font-weight: 600; }
.chat-close { cursor: pointer; }
.chat-tip {
  padding: 8px 12px;
  background: #fdf6ec;
  color: #e6a23c;
  font-size: 12px;
  border-bottom: 1px solid #faecd8;
  flex-shrink: 0;
}
.chat-messages { flex: 1; overflow-y: auto; padding: 12px; }
.chat-msg { margin-bottom: 12px; display: flex; }
.chat-msg-user { justify-content: flex-end; }
.chat-msg-assistant { justify-content: flex-start; }
.chat-msg-body {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}
.chat-msg-user .chat-msg-body { background: #409eff; color: #fff; }
.chat-msg-assistant .chat-msg-body { background: #f4f4f5; color: #303133; }
.chat-footer {
  padding: 12px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.chat-footer .el-input { flex: 1; }

.chat-pop-enter-active, .chat-pop-leave-active { transition: all 0.2s ease; }
.chat-pop-enter-from, .chat-pop-leave-to { opacity: 0; transform: translateY(16px); }
.chat-fade-enter-active, .chat-fade-leave-active { transition: all 0.2s ease; }
.chat-fade-enter-from, .chat-fade-leave-to { opacity: 0; transform: scale(0.8); }
</style>
