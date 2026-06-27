import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { loanService } from '../../services/loanService';

const statusConfig = {
  ACTIVE:  { label: 'Active',   type: 'info' },
  REPAID:  { label: 'Repaid',   type: 'success' },
  OVERDUE: { label: 'Overdue',  type: 'error' },
  PENDING: { label: 'Pending',  type: 'warning' },
  REJECTED:{ label: 'Rejected', type: 'neutral' },
};

const LoansScreen = ({ navigation }) => {
  const { groupId, isAdmin } = useAuth();
  const [loans, setLoans]       = useState([]);
  const [summary, setSummary]   = useState({ totalOut: 0, totalOverdue: 0, totalRepaid: 0 });
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!groupId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter.toUpperCase() } : {};
      const result = await loanService.getLoans(groupId, params);
      setLoans(result.loans || []);
      setSummary(result.summary || { totalOut: 0, totalOverdue: 0, totalRepaid: 0 });
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId, filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Loans</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewLoan')}>
            <Text style={styles.addBtnText}>+ New Loan</Text>
          </TouchableOpacity>
        )}
        {!isAdmin && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.secondary }]} onPress={() => navigation.navigate('MyLoanRequest')}>
            <Text style={styles.addBtnText}>🤲 Request Loan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total Out', value: summary.totalOut, color: Colors.info },
          { label: 'Overdue',   value: summary.totalOverdue, color: Colors.error },
          { label: 'Repaid',    value: summary.totalRepaid, color: Colors.success },
        ].map(({ label, value, color }) => (
          <View key={label} style={[styles.summaryCard, { borderTopColor: color }]}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={[styles.summaryValue, { color }]}>GHS {(value || 0).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {['all', 'active', 'pending', 'overdue', 'repaid'].map((f) => (
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

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const sc       = statusConfig[item.status] || statusConfig.PENDING;
            const fullName = item.member?.user?.fullName || '—';
            // Deontology: members don't need to know exact borrower name + amount for others' loans
            // They can see group-level loan health (status, progress) without identifying details
            const displayName = isAdmin ? fullName : fullName.split(' ')[0] + ' ' + (fullName.split(' ')[1]?.[0] || '') + '.';
            const progress = item.amountRepaid / item.amount;
            const st       = item.status;
            // Virtue ethics: soften "Overdue" to "Needs Attention" for member view
            const memberSc = st === 'OVERDUE'
              ? { label: 'Needs Attention', type: 'warning' }
              : sc;
            const displaySc = isAdmin ? sc : memberSc;
            return (
              <TouchableOpacity
                style={styles.loanCard}
                onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
                activeOpacity={0.85}
              >
                <View style={styles.loanTop}>
                  <View style={styles.loanLeft}>
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{displayName}</Text>
                      <Text style={styles.loanDate}>
                        Requested: {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.loanRight}>
                    {/* Members see loan amount — needed for group accountability */}
                    <Text style={styles.loanAmount}>GHS {item.amount.toLocaleString()}</Text>
                    <Badge label={displaySc.label} type={displaySc.type} size="sm" />
                  </View>
                </View>

                {(st === 'ACTIVE' || st === 'OVERDUE') && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressMeta}>
                      {isAdmin && <Text style={styles.progressLabel}>Repaid: GHS {item.amountRepaid.toLocaleString()}</Text>}
                      <Text style={styles.progressLabel}>
                        Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                      </Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: st === 'OVERDUE' ? Colors.error : Colors.success }]} />
                    </View>
                    <Text style={styles.progressPct}>{Math.round(progress * 100)}% repaid</Text>
                  </View>
                )}

                <View style={styles.loanMeta}>
                  <Text style={styles.metaText}>Interest: {item.interestRate}%</Text>
                  {isAdmin && <Text style={styles.metaText}>Total due: GHS {item.totalDue?.toLocaleString()}</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyText}>No loans found</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full },
  addBtnText: { ...Typography.label, color: Colors.white },
  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm + 4, borderTopWidth: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryValue: { ...Typography.h4, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 4 },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  loanCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  loanLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  memberName: { ...Typography.label, color: Colors.textPrimary },
  loanDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  loanRight: { alignItems: 'flex-end' },
  loanAmount: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 4 },
  progressSection: { marginBottom: Spacing.sm },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { ...Typography.caption, color: Colors.textSecondary },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { ...Typography.caption, color: Colors.textMuted, textAlign: 'right' },
  loanMeta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.textSecondary },
});

export default LoansScreen;
