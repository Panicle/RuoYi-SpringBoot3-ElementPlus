import request from '@/utils/request'

// ===== 预算 /biz/rd/budget =====

// 查询某课题某年 12 月预算行（缺月 budgetId=null 零值行）
export function listBudget(query) {
  return request({
    url: '/biz/rd/budget/list',
    method: 'get',
    params: query
  })
}

// 保存 12 月预算（body: projectId/year/months:[{month,totalAmount}]）
export function saveBudget(data) {
  return request({
    url: '/biz/rd/budget/save',
    method: 'put',
    data: data
  })
}

// ===== 工资 /biz/rd/salary =====

// 分页查询工资行（researcherName 携带）
export function listSalary(query) {
  return request({
    url: '/biz/rd/salary/list',
    method: 'get',
    params: query
  })
}

// 新增 / 更新工资（body: researcherId/salaryMonth/monthlySalary/remark）
export function saveSalary(data) {
  return request({
    url: '/biz/rd/salary/save',
    method: 'post',
    data: data
  })
}

// 导入工资（multipart file）
export function importSalary(data) {
  return request({
    url: '/biz/rd/salary/importData',
    method: 'post',
    data: data
  })
}

// 下载导入模板
export function importSalaryTemplate(query) {
  return request({
    url: '/biz/rd/salary/importTemplate',
    method: 'get',
    params: query,
    responseType: 'blob'
  })
}

// 导出工资（blob）
export function exportSalary(data) {
  return request({
    url: '/biz/rd/salary/export',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}

// ===== 工时 /biz/rd/worktime =====

// 月内工时日历（body: projectId/researcherId/month；返回 days:[{workDate,rdHours,dayTotalAcrossProjects}], monthTotal）
export function getWorktimeCalendar(query) {
  return request({
    url: '/biz/rd/worktime/calendar',
    method: 'get',
    params: query
  })
}

// 保存工时（body: projectId/researcherId/month/days:[{workDate,rdHours}]；rdHours=0 表示清除）
export function saveWorktime(data) {
  return request({
    url: '/biz/rd/worktime/save',
    method: 'put',
    data: data
  })
}

// 复制上月工时
export function copyWorktimeLastMonth(data) {
  return request({
    url: '/biz/rd/worktime/copyLastMonth',
    method: 'post',
    data: data
  })
}

// 分页月度工时汇总
export function listWorktimeMonthly(query) {
  return request({
    url: '/biz/rd/worktime/monthly/list',
    method: 'get',
    params: query
  })
}

// ===== 分摊 /biz/rd/alloc =====

// 计算批次（body: projectId/month；返回批次明细 + 闭合结果 或 "无有效工时"）
export function calcAllocation(data) {
  return request({
    url: '/biz/rd/alloc/calc',
    method: 'post',
    data: data
  })
}

// 分页批次行（含 researcherName/monthlyHours/hourlyRate/allocatedAmount/surchargeTotal/grandTotal/surchargeDetail/status）
export function listAllocation(query) {
  return request({
    url: '/biz/rd/alloc/list',
    method: 'get',
    params: query
  })
}

// 确认分摊
export function confirmAllocation(data) {
  return request({
    url: '/biz/rd/alloc/confirm',
    method: 'post',
    data: data
  })
}

// 撤销确认（reason 必填）
export function revokeAllocation(data) {
  return request({
    url: '/biz/rd/alloc/revoke',
    method: 'post',
    data: data
  })
}

// 分摊汇总卡
export function getAllocationDashboard(query) {
  return request({
    url: '/biz/rd/alloc/dashboard',
    method: 'get',
    params: query
  })
}

// ===== 导出 /biz/rd/export =====

// 导出工时表（blob）
export function exportWorktime(data) {
  return request({
    url: '/biz/rd/export/worktime',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}

// 导出分摊表（blob）
export function exportAllocation(data) {
  return request({
    url: '/biz/rd/export/allocation',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}

// 多课题年度汇总导出（body: year/projectIds?）
export function exportSummary(data) {
  return request({
    url: '/biz/rd/export/summary',
    method: 'post',
    data: data,
    responseType: 'blob'
  })
}