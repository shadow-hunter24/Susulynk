import api from './api';

export const payoutService = {
  // GET /api/payouts/:groupId → { payouts, current, paidCount, totalSlots }
  getPayouts: (groupId) =>
    api.get(`/payouts/${groupId}`),

  // POST /api/payouts/:groupId → create full rotation schedule
  createSchedule: (groupId, slots, amount) =>
    api.post(`/payouts/${groupId}`, { slots, amount }),

  // PATCH /api/payouts/:groupId/:payoutId/pay → mark current payout as paid
  markPaid: (groupId, payoutId) =>
    api.patch(`/payouts/${groupId}/${payoutId}/pay`),

  // PATCH /api/payouts/:groupId/reorder → reorder rotation slots
  reorder: (groupId, order) =>
    api.patch(`/payouts/${groupId}/reorder`, { order }),
};
