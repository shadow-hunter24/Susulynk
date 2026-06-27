import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';

const groupColors = [Colors.primary, Colors.secondary, Colors.info, Colors.success, '#8B5CF6'];

const MyGroupsScreen = ({ navigation }) => {
  const { group: activeGroup, switchGroup } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await groupService.getMyGroups();
      setMemberships(data);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleSwitch = async (membership) => {
    const g = membership.group;
    await switchGroup({
      id:                 g.id,
      name:               g.name,
      contributionAmount: g.contributionAmount,
      currency:           g.currency || 'GHS',
    });
    Alert.alert('Switched!', `Now viewing "${g.name}"`);
    navigation.goBack();
  };

  const renderItem = ({ item, index }) => {
    const g         = item.group;
    const isActive  = g.id === activeGroup?.id;
    const role      = item.role?.toLowerCase();
    const memberCount = g._count?.members ?? '—';

    return (
      <TouchableOpacity
        style={[styles.groupCard, isActive && styles.groupCardActive]}
        onPress={() => handleSwitch(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.groupIcon, { backgroundColor: groupColors[index % groupColors.length] + '20' }]}>
          <Text style={styles.groupIconText}>🏦</Text>
        </View>

        <View style={styles.groupInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.groupName, isActive && { color: Colors.primary }]}>{g.name}</Text>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.groupMeta}>
            {memberCount} members · GHS {g.contributionAmount}/mo
          </Text>
          <Text style={styles.roleBadge}>
            {role === 'admin' ? '👑 Admin' : '👤 Member'}
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Groups</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tap a group to switch to it</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={memberships}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏦</Text>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create a group or browse existing ones to join.</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('BrowseGroups')}
              >
                <Text style={styles.createBtnText}>Browse Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { marginTop: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary }]}
                onPress={() => navigation.navigate('CreateGroup')}
              >
                <Text style={[styles.createBtnText, { color: Colors.primary }]}>Create a Group</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  title: { ...Typography.h2, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2, borderRadius: Radius.full,
  },
  addBtnText: { ...Typography.label, color: Colors.white },
  hint: {
    ...Typography.caption, color: Colors.textMuted,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  groupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  groupCardActive: {
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  groupIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  groupIconText: { fontSize: 26 },
  groupInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  groupName: { ...Typography.label, color: Colors.textPrimary },
  activeBadge: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activeBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  groupMeta: { ...Typography.caption, color: Colors.textSecondary },
  roleBadge: { ...Typography.caption, color: Colors.primary, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyText: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  createBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4,
  },
  createBtnText: { ...Typography.label, color: Colors.white },
});

export default MyGroupsScreen;
