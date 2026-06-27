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

const avatarColors = [Colors.primary, Colors.secondary, Colors.info, Colors.success, '#8B5CF6', '#EC4899'];

const JoinRequestsScreen = ({ navigation }) => {
  const { groupId } = useAuth();
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing]       = useState({}); // { [memberId]: 'approve'|'reject' }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await groupService.getJoinRequests(groupId);
      setRequests(data);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleAction = async (memberId, name, action) => {
    const label = action === 'approve' ? 'Approve' : 'Decline';
    Alert.alert(
      `${label} Request`,
      `${action === 'approve' ? 'Approve' : 'Decline'} ${name}'s request to join?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setActing(a => ({ ...a, [memberId]: action }));
            try {
              await groupService.handleRequest(groupId, memberId, action);
              load(true);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActing(a => ({ ...a, [memberId]: null }));
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item, index }) => {
    const name     = item.user?.fullName || '—';
    const phone    = item.user?.phone || '—';
    const joined   = new Date(item.joinedAt).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' });
    const isActing = acting[item.id];

    return (
      <View style={styles.requestCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColors[index % avatarColors.length] }]}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <Text style={styles.requestDate}>Requested {joined}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.approveBtn, isActing && styles.btnDisabled]}
            onPress={() => handleAction(item.id, name, 'approve')}
            disabled={!!isActing}
          >
            {isActing === 'approve'
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.approveBtnText}>✓</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectBtn, isActing && styles.btnDisabled]}
            onPress={() => handleAction(item.id, name, 'reject')}
            disabled={!!isActing}
          >
            {isActing === 'reject'
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Text style={styles.rejectBtnText}>✕</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Join Requests</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListHeaderComponent={
            requests.length > 0 ? (
              <Text style={styles.listHint}>
                {requests.length} pending request{requests.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptyText}>No pending join requests.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  backText: { fontSize: 20, color: Colors.textPrimary },
  title: { ...Typography.h3, color: Colors.textPrimary },
  listHint: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  name: { ...Typography.label, color: Colors.textPrimary },
  phone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  requestDate: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
});

export default JoinRequestsScreen;
