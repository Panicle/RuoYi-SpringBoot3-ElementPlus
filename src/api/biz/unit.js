import request from '@/utils/request'

// 查询合作单位平铺列表（树表用，前端 handleTree 组树）
export function listUnit(query) {
  return request({
    url: '/biz/unit/list',
    method: 'get',
    params: query
  })
}

// 查询单位树（TreeSelect 结构，仅需登录）
export function treeUnit(query) {
  return request({
    url: '/biz/unit/treeselect',
    method: 'get',
    params: query
  })
}

// 查询单位列表（排除自身及后代，换父级用）
export function unitExcludeChild(unitId) {
  return request({
    url: '/biz/unit/exclude/' + unitId,
    method: 'get'
  })
}

// 查询单位详细
export function getUnit(unitId) {
  return request({
    url: '/biz/unit/' + unitId,
    method: 'get'
  })
}

// 新增单位
export function addUnit(data) {
  return request({
    url: '/biz/unit',
    method: 'post',
    data: data
  })
}

// 修改单位
export function updateUnit(data) {
  return request({
    url: '/biz/unit',
    method: 'put',
    data: data
  })
}

// 删除单位（批量）
export function delUnit(unitIds) {
  return request({
    url: '/biz/unit/' + unitIds,
    method: 'delete'
  })
}

// 导出单位列表
export function exportUnit(query) {
  return request({
    url: '/biz/unit/export',
    method: 'post',
    data: query,
    responseType: 'blob'
  })
}

// 查询单位联系人列表
export function listUnitContact(query) {
  return request({
    url: '/biz/unit/contact/list',
    method: 'get',
    params: query
  })
}

// 新增联系人
export function addUnitContact(data) {
  return request({
    url: '/biz/unit/contact',
    method: 'post',
    data: data
  })
}

// 修改联系人
export function updateUnitContact(data) {
  return request({
    url: '/biz/unit/contact',
    method: 'put',
    data: data
  })
}

// 删除联系人（批量）
export function delUnitContact(contactIds) {
  return request({
    url: '/biz/unit/contact/' + contactIds,
    method: 'delete'
  })
}
