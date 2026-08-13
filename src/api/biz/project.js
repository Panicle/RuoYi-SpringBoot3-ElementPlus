import request from '@/utils/request'

// 查询课题列表
export function listProject(query) {
  return request({
    url: '/biz/project/list',
    method: 'get',
    params: query
  })
}

// 查询课题详细
export function getProject(projectId) {
  return request({
    url: '/biz/project/' + projectId,
    method: 'get'
  })
}

// 新增课题
export function addProject(data) {
  return request({
    url: '/biz/project',
    method: 'post',
    data: data
  })
}

// 修改课题
export function updateProject(data) {
  return request({
    url: '/biz/project',
    method: 'put',
    data: data
  })
}

// 删除课题
export function delProject(projectIds) {
  return request({
    url: '/biz/project/' + projectIds,
    method: 'delete'
  })
}

// 导出课题
export function exportProject(query) {
  return request({
    url: '/biz/project/export',
    method: 'post',
    data: query,
    responseType: 'blob'
  })
}

// 状态机迁移（相邻单向）
export function changeStatus(projectId, targetStatus) {
  return request({
    url: '/biz/project/changeStatus',
    method: 'post',
    data: { projectId, targetStatus }
  })
}

// 归档（COMPLETED/ACCEPTED → ARCHIVED）
export function archive(projectId) {
  return request({
    url: '/biz/project/archive',
    method: 'post',
    data: { projectId }
  })
}

// 查询课题成员列表
export function listProjectMember(query) {
  return request({
    url: '/biz/project/member/list',
    method: 'get',
    params: query
  })
}

// 新增课题成员（单/批量，拒绝 HOST）
export function addProjectMember(data) {
  return request({
    url: '/biz/project/member',
    method: 'post',
    data: data
  })
}

// 删除课题成员（批量）
export function delProjectMember(memberIds) {
  return request({
    url: '/biz/project/member/' + memberIds,
    method: 'delete'
  })
}

// 换组长
export function changeHost(projectId, newLeaderUserId) {
  return request({
    url: '/biz/project/member/changeHost',
    method: 'put',
    data: { projectId, newLeaderUserId }
  })
}