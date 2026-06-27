import api from './api';

export const loanService = {
  getLoans: (groupId, params) =>
    api.get(`/loans/${groupId}`, { params }),

  getLoan: (groupId, loanId) =>
    api.get(`/loans/${groupId}/${loanId}`),

  // Admin: create a loan for any member
  createLoan: (groupId, data) =>
    api.post(`/loans/${groupId}`, data),

  // Member: request a loan for themselves
  requestLoan: (groupId, data) =>
    api.post(`/loans/${groupId}/request`, data),

  updateLoan: (groupId, loanId, data) =>
    api.patch(`/loans/${groupId}/${loanId}`, data),

  // Both admin and loan owner can submit repayments
  recordRepayment: (groupId, loanId, data) =>
    api.post(`/loans/${groupId}/${loanId}/repayments`, data),
};
