import api from './api';

export const memberService = {
  getMembers: (groupId, params) =>
    api.get(`/members/${groupId}`, { params }),

  getMember: (groupId, memberId) =>
    api.get(`/members/${groupId}/${memberId}`),

  addMember: (groupId, data) =>
    api.post(`/members/${groupId}`, data),

  updateMember: (groupId, memberId, data) =>
    api.patch(`/members/${groupId}/${memberId}`, data),

  removeMember: (groupId, memberId) =>
    api.delete(`/members/${groupId}/${memberId}`),
};
