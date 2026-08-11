import request from '@/utils/request'

// 查询科研人员列表
export function listUserProfile(query) {
  return request({
    url: '/biz/userProfile/list',
    method: 'get',
    params: query
  })
}

// 查询科研人员详细
export function getUserProfile(profileId) {
  return request({
    url: '/biz/userProfile/' + profileId,
    method: 'get'
  })
}

// 新增科研人员
export function addUserProfile(data) {
  return request({
    url: '/biz/userProfile',
    method: 'post',
    data: data
  })
}

// 修改科研人员
export function updateUserProfile(data) {
  return request({
    url: '/biz/userProfile',
    method: 'put',
    data: data
  })
}

// 删除科研人员
export function delUserProfile(profileIds) {
  return request({
    url: '/biz/userProfile/' + profileIds,
    method: 'delete'
  })
}