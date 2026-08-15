import request from '@/utils/request'

// ===== 预警中心 + 我的通知 /biz/alert =====

// 1. 预警列表（分页；筛选 alertType/alertLevel/status/refType）
export function listAlert(query) {
  return request({
    url: '/biz/alert/list',
    method: 'get',
    params: query
  })
}

// 2. 预警详情
export function getAlert(alertId) {
  return request({
    url: '/biz/alert/' + alertId,
    method: 'get'
  })
}

// 3. 消除预警（status → RESOLVED）
export function resolveAlert(alertId) {
  return request({
    url: '/biz/alert/resolve/' + alertId,
    method: 'post'
  })
}

// 4. 我的通知列表（分页；筛选 status）
export function listMyNotify(query) {
  return request({
    url: '/biz/alert/my/list',
    method: 'get',
    params: query
  })
}

// 5. 标记已读（status → READ）
export function readNotify(notifyId) {
  return request({
    url: '/biz/alert/notify/' + notifyId + '/read',
    method: 'post'
  })
}

// 6. 确认通知（status → CONFIRMED）
export function confirmNotify(notifyId) {
  return request({
    url: '/biz/alert/notify/' + notifyId + '/confirm',
    method: 'post'
  })
}

// 7. 未读计数（data=int）
export function getUnreadCount() {
  return request({
    url: '/biz/alert/notify/unread/count',
    method: 'get'
  })
}

// 7.5 手动触发预警扫描（science_admin/admin）
export function scanAlert() {
  return request({
    url: '/biz/alert/scan',
    method: 'post'
  })
}
