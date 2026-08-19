import request from '@/utils/request'

// ===== 预算 /biz/budget =====

// 查询某课题预算分劈（10 科目：budget/used/balance/version）
export function listBudget(query) {
  return request({
    url: '/biz/budget/list',
    method: 'get',
    params: query
  })
}

// 预算调整（body: projectId + splits[{category,budgetAmount,version}]，按 category 增量更新保 split_id）
export function adjustBudget(data) {
  return request({
    url: '/biz/budget/adjust',
    method: 'put',
    data: data
  })
}

// 课题预算汇总（总额/已用/余额/预警标志/各分组小计）
export function getBudgetSummary(projectId) {
  return request({
    url: '/biz/budget/summary',
    method: 'get',
    params: { projectId }
  })
}

// ===== 记账 /biz/expense =====

// 分页查询经费流水
export function listExpense(query) {
  return request({
    url: '/biz/expense/list',
    method: 'get',
    params: query
  })
}

// 查询经费流水详情
export function getExpense(expenseId) {
  return request({
    url: '/biz/expense/' + expenseId,
    method: 'get'
  })
}

// 记账（body: projectId/splitId 或 category/amount/expenseDate/taxRate/voucherUrl/description）
export function addExpense(data) {
  return request({
    url: '/biz/expense',
    method: 'post',
    data: data
  })
}

// 编辑记账（body: expenseId/version/category/amount/expenseDate/taxRate/voucherUrl/description；
// 金额或科目变更后端按“作废原单+新增新单”处理）
export function updateExpense(data) {
  return request({
    url: '/biz/expense',
    method: 'put',
    data: data
  })
}

// 作废（status→VOID，事务内回冲 used_amount/balance，带 version）
export function voidExpense(expenseId, data) {
  return request({
    url: '/biz/expense/void/' + expenseId,
    method: 'put',
    data: data
  })
}

// 冲销（body: originExpenseId/amount(正数,系统转负)/expenseDate/description）
export function refundExpense(data) {
  return request({
    url: '/biz/expense/refund',
    method: 'post',
    data: data
  })
}

// 导出经费流水
export function exportExpense(query) {
  return request({
    url: '/biz/expense/export',
    method: 'post',
    data: query,
    responseType: 'blob'
  })
}

// ===== 预警 /biz/expense/alert =====

// 经费预警列表（alert_type='BUDGET'；无 projectId 时按数据范围全量）
export function listExpenseAlert(query) {
  return request({
    url: '/biz/expense/alert/list',
    method: 'get',
    params: query
  })
}

// 标记预警已处理
export function handleExpenseAlert(alertId) {
  return request({
    url: '/biz/expense/alert/handle/' + alertId,
    method: 'put'
  })
}
