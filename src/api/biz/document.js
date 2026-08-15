import request from '@/utils/request'

// ===== 课题资料 /biz/document =====

// 查询资料列表（分页；筛选 projectId/stage/approvalStatus/fileName；数据权限双通道）
export function listDocument(query) {
  return request({
    url: '/biz/document/list',
    method: 'get',
    params: query
  })
}

// 查询资料详情（含当前审批 approval + 完整历史 historyList）
export function getDocument(docId) {
  return request({
    url: '/biz/document/' + docId,
    method: 'get'
  })
}

// 上传资料（body: projectId/stage/fileName/fileUrl/planSubmitDate；ARCHIVED 课题拒传）
export function addDocument(data) {
  return request({
    url: '/biz/document',
    method: 'post',
    data: data
  })
}

// 删除资料（批量；PENDING/APPROVED 审批拒删，REJECTED/无审批可删）
export function delDocument(docIds) {
  return request({
    url: '/biz/document/' + docIds,
    method: 'delete'
  })
}

// 发起审批（round=1 PENDING；写 approval + history SUBMIT）
export function submitDocument(docId) {
  return request({
    url: '/biz/document/submit/' + docId,
    method: 'post'
  })
}

// 驳回重报（仅 REJECTED 可重报；round+1 PENDING；写 history RESUBMIT）
export function resubmitDocument(docId) {
  return request({
    url: '/biz/document/resubmit/' + docId,
    method: 'post'
  })
}

// ===== 审批 /biz/approval =====

// 审批列表（分页；dept_leader 本室；science_admin 全所；researcher 仅本人申请）
export function listApproval(query) {
  return request({
    url: '/biz/approval/list',
    method: 'get',
    params: query
  })
}

// 审批历史（按 round + operate_time 有序）
export function listApprovalHistory(approvalId) {
  return request({
    url: '/biz/approval/history/' + approvalId,
    method: 'get'
  })
}

// 审批（body: action=APPROVE/REJECT、comment 审批意见、rejectReason 驳回原因；仅 PENDING 可审）
export function auditApproval(approvalId, data) {
  return request({
    url: '/biz/approval/audit/' + approvalId,
    method: 'put',
    data: data
  })
}
