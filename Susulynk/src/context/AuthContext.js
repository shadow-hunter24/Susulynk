import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { TOKEN_KEY, USER_KEY, GROUP_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);
  const [group, setGroup]     = useState(null);   // active group
  const [loading, setLoading] = useState(true);   // splash guard

  // ── Restore session on app start ───────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [t, u, g] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
          SecureStore.getItemAsync(GROUP_KEY),
        ]);
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u));
        if (g) setGroup(JSON.parse(g));
      } catch (_) {
        // corrupt storage — start fresh
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Persist helpers ────────────────────────────────────
  const persistSession = async (tok, usr, grp) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, tok),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(usr)),
      grp
        ? SecureStore.setItemAsync(GROUP_KEY, JSON.stringify(grp))
        : SecureStore.deleteItemAsync(GROUP_KEY),
    ]);
    setToken(tok);
    setUser(usr);
    setGroup(grp || null);
  };

  // ── Login ──────────────────────────────────────────────
  const login = useCallback(async (phone, password) => {
    const res = await authService.login(phone, password);
    const activeGroup = res.user.memberships?.[0]?.group || null;
    const cleanUser = {
      id: res.user.id,
      fullName: res.user.fullName,
      phone: res.user.phone,
      email: res.user.email,
      role: res.user.memberships?.[0]?.role || 'MEMBER',
      memberships: res.user.memberships || [],
    };
    await persistSession(res.token, cleanUser, activeGroup);
    return res;
  }, []);

  // ── Register ───────────────────────────────────────────
  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const activeGroup = res.group || null;
    const cleanUser = {
      id: res.user.id,
      fullName: res.user.fullName,
      phone: res.user.phone,
      email: res.user.email,
      role: data.groupRole === 'admin' ? 'ADMIN' : 'MEMBER',
      memberships: activeGroup
        ? [{ group: activeGroup, role: data.groupRole === 'admin' ? 'ADMIN' : 'MEMBER' }]
        : [],
    };
    await persistSession(res.token, cleanUser, activeGroup);
    return res;
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(GROUP_KEY),
    ]);
    setToken(null);
    setUser(null);
    setGroup(null);
  }, []);

  // ── Refresh user from server ───────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getMe();
      const activeGroup = me.memberships?.[0]?.group || group;
      const cleanUser = {
        id: me.id,
        fullName: me.fullName,
        phone: me.phone,
        email: me.email,
        bio: me.bio,
        role: me.memberships?.[0]?.role || 'MEMBER',
        memberships: me.memberships || [],
      };
      setUser(cleanUser);
      if (activeGroup) setGroup(activeGroup);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(cleanUser));
    } catch (_) {}
  }, [group]);

  // ── Switch active group ────────────────────────────────
  const switchGroup = useCallback(async (newGroup) => {
    setGroup(newGroup);
    await SecureStore.setItemAsync(GROUP_KEY, JSON.stringify(newGroup));
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const groupId = group?.id || null;

  return (
    <AuthContext.Provider value={{
      token, user, group, groupId, loading,
      isAdmin, login, register, logout, refreshUser, switchGroup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
