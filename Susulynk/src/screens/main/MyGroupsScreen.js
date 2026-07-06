import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';

const groupColors = ['#1A6B3C', '#F5A623', '#3B82F6', '#22C55E', '#8B5CF6'];

const MyGroupsScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const { group: activeGroup, switchGroup, refreshUser } = useAuth();

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const data = await groupService.getMyGroups(); setMemberships(data); }
    catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => {
    refreshUser();
    load(true);
  }, [refreshUser, load]));

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleSwitch = async (membership) => {
    const g    = membership.group;
    const role = membership.role;
    await switchGroup({ id: g.id, name: g.name, contributionAmount: g.contributionAmount, currency: g.currency || 'GHS', interestRate: g.interestRate ?? 5 }, role);
    Alert.alert('Switched', `Now viewing "${g.name}" as ${role === 'ADMIN' ? 'Admin' : 'Member'}`);
    navigation.goBack();
  };

  const renderItem = ({ item, index }) => {
    const g         = item.group;
    const isActive  = g.id === activeGroup?.id;
    const isPending = item.status === 'PENDING';
    const role      = item.role?.toLowerCase();
    const memberCount = g._count?.members ?? '—';
    const accentColor = groupColors[index % groupColors.length];

    return (
      <TouchableOpacity
        style={[styles.groupCard, isActive && styles.groupCardActive, isPending && styles.groupCardPending]}
        onPress={() => !isPending && handleSwitch(item)}
        activeOpacity={isPending ? 1 : 0.85}
        disabled={isPending}
      >
        <View style={[styles.groupIcon, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={isPending ? 'time-outline' : 'business'} size={26} color={isPending ? Colors.warning : accentColor} />
        </View>
        <View style={styles.groupInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.groupName, isActive && { color: Colors.primary }, isPending && { color: Colors.textMuted }]}>{g.name}</Text>
            {isActive && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>}
            {isPending && <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Pending</Text></View>}
          </View>
          <Text style={styles.groupMeta}>{memberCount} members · GHS {g.contributionAmount}/mo</Text>
          {isPending
            ? <Text style={styles.pendingHint}>Waiting for admin approval</Text>
            : <Text style={styles.roleBadge}>{role === 'admin' ? 'Admin' : 'Member'}</Text>
          }
        </View>
        {!isPending && <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Groups</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateGroup')}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tap a group to switch to it</Text>

      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} /> : (
        <FlatList
          data={memberships}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create a group or browse existing ones to join.</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('BrowseGroups')}>
                <Text style={styles.createBtnText}>Browse Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, { marginTop: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary }]} onPress={() => navigation.navigate('CreateGroup')}>
                <Text style={[styles.createBtnText, { color: Colors.primary }]}>Create a Group</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  title:             { ...Typography.h2, color: Colors.textPrimary },
  addBtn:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full },
  addBtnText:        { ...Typography.label, color: Colors.white },
  hint:              { ...Typography.caption, color: Colors.textMuted, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  list:              { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  groupCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  groupCardPending:  { opacity: 0.75, borderWidth: 1, borderColor: Colors.warning, borderStyle: 'dashed' },
  groupCardActive:   { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
  groupIcon:         { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  groupInfo:         { flex: 1 },
  nameRow:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  groupName:         { ...Typography.label, color: Colors.textPrimary },
  activeBadge:       { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText:   { color: Colors.white, fontSize: 10, fontWeight: '700' },
  pendingBadge:      { backgroundColor: Colors.warning + '25', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText:  { color: Colors.warning, fontSize: 10, fontWeight: '700' },
  groupMeta:         { ...Typography.caption, color: Colors.textSecondary },
  roleBadge:         { ...Typography.caption, color: Colors.primary, marginTop: 2 },
  pendingHint:       { ...Typography.caption, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  empty:             { alignItems: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyTitle:        { ...Typography.h3, color: Colors.textPrimary },
  emptyText:         { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm },
  createBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  createBtnText:     { ...Typography.label, color: Colors.white },
});

export default MyGroupsScreen;
