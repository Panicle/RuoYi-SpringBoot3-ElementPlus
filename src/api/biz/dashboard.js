import request from '@/utils/request'

// 首页工作台汇总（统计卡 + 待办 + 未读预警 + 课题预算执行 TOP5）
export function getDashboardSummary() {
  return request({
    url: '/biz/dashboard/summary',
    method: 'get'
  })
}
