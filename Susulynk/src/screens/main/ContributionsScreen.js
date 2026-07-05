import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { contributionService } from '../../services/contributionService';

const ContributionsScreen = ({ navigation }) => {
  const { groupId, isAdmin } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [cycles, setCycles]               = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [filter, setFilter]               = useState('all');
  const [summary, setSummary]             = useState({ paid: 0, expected: 0, outstanding: 0 });
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [confirming, setConfirming]       = useState({});
  const [sendingReminders, setSendingReminders] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!groupId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const cycleList = await contributionService.getCycles(groupId);
      setCycles(cycleList);

      // Pick the active cycle — use current state or default to latest
      const activeCycle = selectedCycle || cycleList[0] || null;
      if (!selectedCycle && cycleList.length > 0) setSelectedCycle(cycleList[0]);

      const result = await contributionService.getContributions(groupId, {
        ...(activeCycle ? { cycle: activeCycle } : {}),
        ...(filter !== 'all' ? { status: filter.toUpperCase() } : {}),
      });
      setContributions(result.contributions || []);
      setSummary(result.summary || { paid: 0, expected: 0, outstanding: 0 });
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId, selectedCycle, filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleConfirm = async (id) => {
    setConfirming(c => ({ ...c, [id]: true }));
    try {
      await contributionService.confirmPayment(groupId, id);
      load(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setConfirming(c => ({ ...c, [id]: false }));
    }
  };

  const handleSendReminders = () => {
    if (!selectedCycle) return;
    Alert.alert(
      'Send Reminders',
      `Send contribution reminders to all unpaid members for ${selectedCycle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSendingReminders(true);
            try {
              const res = await contributionService.sendReminders(groupId, selectedCycle);
              Alert.alert('Done', res.message);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSendingReminders(false);
            }
          },
        },
      ]
    );
  };

  const pct = summary.expected > 0 ? Math.round((summary.paid / summary.expected) * 100) : 0;

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Contributions</Text>
        <View style={styles.headerActions}>
          {isAdmin && (
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddContribution')}>
              <Text style={styles.addBtnText}>+ Record</Text>
            </TouchableOpacity>
          )}
          {isAdmin && selectedCycle && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: Colors.warning }]}
              onPress={handleSendReminders}
              disabled={sendingReminders}
            >
              <Text style={styles.addBtnText}>
                {sendingReminders ? '...' : '⏰ Remind'}
              </Text>
            </TouchableOpacity>
          )}
          {!isAdmin && (
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.success }]} onPress={() => navigation.navigate('MemberPay')}>
              <Text style={styles.addBtnText}>💳 Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cycle picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cycleScroll} contentContainerStyle={styles.cycleRow}>
        {cycles.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.cycleBtn, selectedCycle === c && styles.cycleBtnActive]}
            onPress={() => setSelectedCycle(c)}
          >
            <Text style={[styles.cycleText, selectedCycle === c && styles.cycleTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Collected</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>GHS {summary.paid.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expected</Text>
              <Text style={styles.summaryValue}>GHS {summary.expected.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>GHS {summary.outstanding.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{pct}% collected</Text>

          {/* Filters */}
          <View style={styles.filterRow}>
            {['all', 'paid', 'pending', 'overdue'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={contributions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const name   = item.member?.user?.fullName || '—';
              const status = item.status?.toLowerCase();
              const date   = item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not paid';
              const method = isAdmin ? (item.method?.replace('_', ' ') || '—') : null;
              const badgeLabel = status === 'paid' ? 'Paid'
                : status === 'overdue' ? (isAdmin ? 'Overdue' : 'Awaiting Payment')
                : status === 'pending' ? (isAdmin ? 'Pending Confirm' : 'Submitted')
                : 'Pending';
              const badgeType = status === 'paid' ? 'success'
                : status === 'overdue' ? (isAdmin ? 'error' : 'warning')
                : 'warning';
              const isConfirmable = isAdmin && status === 'pending' && item.reference;
              return (
                <View style={styles.row}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{name}</Text>
                    <Text style={styles.rowDate}>{date}{method ? ` · ${method}` : ''}</Text>
                    {item.reference ? <Text style={styles.rowRef}>Ref: {item.reference}</Text> : null}
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowAmount, { color: status === 'paid' ? Colors.success : Colors.textPrimary }]}>
                      {status === 'paid' ? `GHS ${item.amount}` : `GHS ${item.amount}`}
                    </Text>
                    <Badge label={badgeLabel} type={badgeType} size="sm" />
                    {isConfirmable && (
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => handleConfirm(item.id)}
                        disabled={confirming[item.id]}
                      >
                        {confirming[item.id]
                          ? <ActivityIndicator size="small" color={Colors.white} />
                          : <Text style={styles.confirmBtnText}>Confirm</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💰</Text>
                <Text style={styles.emptyText}>No contributions found</Text>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full },
  addBtnText: { ...Typography.label, color: Colors.white },
  cycleScroll: { maxHeight: 44 },
  cycleRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  cycleBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  cycleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cycleText: { ...Typography.caption, color: Colors.textSecondary },
  cycleTextActive: { color: Colors.white, fontWeight: '600' },
  summary: { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryValue: { ...Typography.h4, color: Colors.textPrimary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  progressContainer: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginHorizontal: Spacing.lg, marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: Colors.success, borderRadius: 3 },
  progressLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'right', paddingRight: Spacing.lg, marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md },
  filterTab: { paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  avatarBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { ...Typography.label, color: Colors.textPrimary },
  rowDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  rowRef: { ...Typography.caption, color: Colors.primary, marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { ...Typography.label, marginBottom: 4 },
  confirmBtn: { marginTop: 4, backgroundColor: Colors.success, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  confirmBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.textSecondary },
});

export default ContributionsScreen;
