import api from './api';

export const payoutService = {
  getPayouts: (groupId) => api.get(`/payouts/${groupId}`),
  createSchedule: (groupId, data) => api.post(`/payouts/${groupId}`, data),
  markPaid: (groupId, payoutId) => api.patch(`/payouts/${groupId}/${payoutId}/pay`),
  reorder: (groupId, order) => api.patch(`/payouts/${groupId}/reorder`, { order }),
};
