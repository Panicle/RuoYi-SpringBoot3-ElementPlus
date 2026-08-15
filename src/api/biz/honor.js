import request from '@/utils/request'

// ===== 荣誉 /biz/honor =====

// 查询荣誉列表（分页；筛选 honorName/honorType/awardLevel + params[beginAwardDate]/params[endAwardDate]）
export function listHonor(query) {
  return request({
    url: '/biz/honor/list',
    method: 'get',
    params: query
  })
}

// 查询荣誉详情
export function getHonor(honorId) {
  return request({
    url: '/biz/honor/' + honorId,
    method: 'get'
  })
}

// 新增荣誉
export function addHonor(data) {
  return request({
    url: '/biz/honor',
    method: 'post',
    data: data
  })
}

// 修改荣誉
export function updateHonor(data) {
  return request({
    url: '/biz/honor',
    method: 'put',
    data: data
  })
}

// 删除荣誉（批量；级联删关联）
export function delHonor(honorIds) {
  return request({
    url: '/biz/honor/' + honorIds,
    method: 'delete'
  })
}

// 导出荣誉
export function exportHonor(query) {
  return request({
    url: '/biz/honor/export',
    method: 'post',
    data: query,
    responseType: 'blob'
  })
}

// ===== 荣誉关联 /biz/honor/relation =====

// 查询荣誉关联列表（按 honorId）
export function listHonorRelation(query) {
  return request({
    url: '/biz/honor/relation/list',
    method: 'get',
    params: query
  })
}

// 新增荣誉关联（body: honorId/refType/refId/roleDesc/contributionDesc）
export function addHonorRelation(data) {
  return request({
    url: '/biz/honor/relation',
    method: 'post',
    data: data
  })
}

// 删除荣誉关联（单条）
export function delHonorRelation(relationId) {
  return request({
    url: '/biz/honor/relation/' + relationId,
    method: 'delete'
  })
}
