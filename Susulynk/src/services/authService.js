import api from './api';

export const authService = {
  login: (phone, password) =>
    api.post('/auth/login', { phone, password }),

  register: (data) =>
    api.post('/auth/register', data),

  forgotPassword: (phone) =>
    api.post('/auth/forgot-password', { phone }),

  verifyOtp: (phone, otp) =>
    api.post('/auth/verify-otp', { phone, otp }),

  resetPassword: (resetToken, password) =>
    api.post('/auth/reset-password', { resetToken, password }),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (data) =>
    api.patch('/auth/profile', data),

  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
};
