import api from './api';

export const reportService = {
  getReport: (groupId, cycle) =>
    api.get(`/reports/${groupId}`, { params: cycle ? { cycle } : {} }),

  getDashboard: (groupId) =>
    api.get(`/reports/${groupId}/meta/dashboard`),
};
