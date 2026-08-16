import request from '@/utils/request'

// ===== 对话精灵 /biz/chat =====

// 8. 对话（body: {message} → {reply, configured, confirmCard?}；configured=false 表示 LLM 未配置）
export function askChat(data) {
  return request({
    url: '/biz/chat/ask',
    method: 'post',
    data: data
  })
}

// 9. 会话上下文（{role, content}[]）
export function getChatSession() {
  return request({
    url: '/biz/chat/session',
    method: 'get'
  })
}

// 10. 确认卡片回调（body: {confirmId, approved}）
export function confirmChat(data) {
  return request({
    url: '/biz/chat/confirm',
    method: 'post',
    data: data
  })
}
