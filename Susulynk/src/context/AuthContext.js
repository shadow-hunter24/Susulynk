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
    // Only consider ACTIVE memberships as the active group — PENDING ones await admin approval
    const activeMembership = res.user.memberships?.find(m => m.status === 'ACTIVE') || null;
    const activeGroup = activeMembership?.group || null;
    const cleanUser = {
      id: res.user.id,
      fullName: res.user.fullName,
      phone: res.user.phone,
      email: res.user.email,
      role: activeMembership?.role || 'MEMBER',
      memberships: res.user.memberships || [],
    };
    // Store full group object including interestRate
    const fullGroup = activeGroup ? {
      id:                 activeGroup.id,
      name:               activeGroup.name,
      contributionAmount: activeGroup.contributionAmount,
      currency:           activeGroup.currency || 'GHS',
      interestRate:       activeGroup.interestRate ?? 5,
    } : null;
    await persistSession(res.token, cleanUser, fullGroup);
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

      // Only consider ACTIVE memberships — skip PENDING ones awaiting admin approval
      const activeMemberships = me.memberships?.filter(m => m.status === 'ACTIVE') || [];

      // Prefer the currently active group if the user still belongs to it.
      // If there's no active group yet (e.g. after a pending join gets approved),
      // fall back to the first active membership so groupId is never left null.
      const activeMembership = group?.id
        ? activeMemberships.find(m => m.group?.id === group.id) || activeMemberships[0]
        : activeMemberships[0];

      const resolvedGroup = activeMembership?.group || null;

      // Build the full group object with all fields the app depends on
      const fullGroup = resolvedGroup ? {
        id:                 resolvedGroup.id,
        name:               resolvedGroup.name,
        contributionAmount: resolvedGroup.contributionAmount,
        currency:           resolvedGroup.currency || 'GHS',
        interestRate:       resolvedGroup.interestRate ?? 5,
      } : (group?.id ? group : null);

      const cleanUser = {
        id:          me.id,
        fullName:    me.fullName,
        phone:       me.phone,
        email:       me.email,
        bio:         me.bio,
        role:        activeMembership?.role || user?.role || 'MEMBER',
        memberships: me.memberships || [],
      };
      setUser(cleanUser);
      if (fullGroup) {
        setGroup(fullGroup);
        await SecureStore.setItemAsync(GROUP_KEY, JSON.stringify(fullGroup));
      }
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(cleanUser));
    } catch (_) {}
  }, [group, user]);

  // ── Switch active group ────────────────────────────────
  // Finds the user's role in the new group from their memberships
  // and updates both group and user.role atomically
  const switchGroup = useCallback(async (newGroup, roleOverride) => {
    // If no group id (leaving/deleting), clear the active group
    if (!newGroup?.id) {
      const updatedUser = { ...user, role: 'MEMBER' };
      setGroup(null);
      setUser(updatedUser);
      await Promise.all([
        SecureStore.deleteItemAsync(GROUP_KEY),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser)),
      ]);
      return;
    }

    // Determine the correct role for this group
    const membership = user?.memberships?.find(m => m.group?.id === newGroup.id);
    const newRole = roleOverride || membership?.role || 'MEMBER';

    const updatedUser = { ...user, role: newRole };
    const updatedGroup = { ...newGroup };

    setGroup(updatedGroup);
    setUser(updatedUser);

    await Promise.all([
      SecureStore.setItemAsync(GROUP_KEY, JSON.stringify(updatedGroup)),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser)),
    ]);
  }, [user]);

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
