import request from '@/utils/request'

// 查询合同列表
export function listContract(query) {
  return request({
    url: '/biz/contract/list',
    method: 'get',
    params: query
  })
}

// 查询合同详细（含节点列表）
export function getContract(contractId) {
  return request({
    url: '/biz/contract/' + contractId,
    method: 'get'
  })
}

// 新增合同
export function addContract(data) {
  return request({
    url: '/biz/contract',
    method: 'post',
    data: data
  })
}

// 修改合同
export function updateContract(data) {
  return request({
    url: '/biz/contract',
    method: 'put',
    data: data
  })
}

// 删除合同（批量；级联逻辑删节点）
export function delContract(contractIds) {
  return request({
    url: '/biz/contract/' + contractIds,
    method: 'delete'
  })
}

// 导出合同
export function exportContract(query) {
  return request({
    url: '/biz/contract/export',
    method: 'post',
    data: query,
    responseType: 'blob'
  })
}

// 查询合同节点列表
export function listNode(query) {
  return request({
    url: '/biz/contract/node/list',
    method: 'get',
    params: query
  })
}

// 新增节点
export function addNode(data) {
  return request({
    url: '/biz/contract/node',
    method: 'post',
    data: data
  })
}

// 修改节点
export function updateNode(data) {
  return request({
    url: '/biz/contract/node',
    method: 'put',
    data: data
  })
}

// 完成节点（actualDate 必填；voucherUrl 可选）
export function finishNode(data) {
  return request({
    url: '/biz/contract/node/finish',
    method: 'put',
    data: data
  })
}

// 删除节点（批量）
export function delNode(nodeIds) {
  return request({
    url: '/biz/contract/node/' + nodeIds,
    method: 'delete'
  })
}
