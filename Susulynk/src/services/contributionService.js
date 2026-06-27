import api from './api';

export const contributionService = {
  getContributions: (groupId, params) =>
    api.get(`/contributions/${groupId}`, { params }),

  getCycles: (groupId) =>
    api.get(`/contributions/${groupId}/meta/cycles`),

  // Admin: record a confirmed payment for any member
  recordContribution: (groupId, data) =>
    api.post(`/contributions/${groupId}`, data),

  // Member: submit own payment with MoMo reference — awaits admin confirmation
  submitPayment: (groupId, data) =>
    api.post(`/contributions/${groupId}/submit`, data),

  // Admin: confirm a member's submitted payment
  confirmPayment: (groupId, id) =>
    api.patch(`/contributions/${groupId}/${id}/confirm`),

  updateContribution: (groupId, id, data) =>
    api.patch(`/contributions/${groupId}/${id}`, data),

  deleteContribution: (groupId, id) =>
    api.delete(`/contributions/${groupId}/${id}`),
};
