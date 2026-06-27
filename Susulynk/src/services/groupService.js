import api from './api';

export const groupService = {
  getMyGroups:      ()               => api.get('/groups/mine'),
  getGroup:         (groupId)        => api.get(`/groups/${groupId}`),
  createGroup:      (data)           => api.post('/groups', data),
  updateGroup:      (groupId, data)  => api.patch(`/groups/${groupId}`, data),
  archiveGroup:     (groupId)        => api.patch(`/groups/${groupId}/archive`),
  browseGroups:     (search)         => api.get('/groups/browse', { params: search ? { search } : {} }),
  requestJoin:      (groupId)        => api.post(`/groups/${groupId}/request`),
  getJoinRequests:  (groupId)        => api.get(`/groups/${groupId}/requests`),
  handleRequest:    (groupId, memberId, action) =>
                      api.patch(`/groups/${groupId}/requests/${memberId}`, { action }),
};
