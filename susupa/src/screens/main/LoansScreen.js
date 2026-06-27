import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
} from 'react-native';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const LOANS = [
  { id: '1', member: 'Abena Sarpong', initials: 'AS', amount: 1000, repaid: 500, requested: 'Jun 1, 2026', due: 'Aug 1, 2026', status: 'active', interest: '5%' },
  { id: '2', member: 'Yaw Darko', initials: 'YD', amount: 500, repaid: 500, requested: 'May 10, 2026', due: 'Jul 10, 2026', status: 'repaid', interest: '5%' },
  { id: '3', member: 'Kofi Boateng', initials: 'KB', amount: 800, repaid: 0, requested: 'May 20, 2026', due: 'Jun 20, 2026', status: 'overdue', interest: '5%' },
  { id: '4', member: 'Ama Owusu', initials: 'AO', amount: 1200, repaid: 0, requested: 'Jun 15, 2026', due: '-', status: 'pending', interest: '5%' },
];

const statusConfig = {
  active: { label: 'Active', type: 'info' },
  repaid: { label: 'Repaid', type: 'success' },
  overdue: { label: 'Overdue', type: 'error' },
  pending: { label: 'Pending', type: 'warning' },
};

const LoansScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('all');

  const filtered = LOANS.filter((l) => filter === 'all' || l.status === filter);

  const totalOut = LOANS.filter(l => l.status === 'active' || l.status === 'overdue')
    .reduce((s, l) => s + l.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Loans</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewLoan')}>
          <Text style={styles.addBtnText}>+ New Loan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: Colors.info }]}>
          <Text style={styles.summaryLabel}>Total Out</Text>
          <Text style={[styles.summaryValue, { color: Colors.info }]}>GHS {totalOut.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.error }]}>
          <Text style={styles.summaryLabel}>Overdue</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            GHS {LOANS.filter(l => l.status === 'overdue').reduce((s, l) => s + l.amount, 0).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
          <Text style={styles.summaryLabel}>Repaid</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            GHS {LOANS.filter(l => l.status === 'repaid').reduce((s, l) => s + l.amount, 0).toLocaleString()}
          </Text>
        </View>
      </View>

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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const progress = item.repaid / item.amount;
          const sc = statusConfig[item.status];
          return (
            <TouchableOpacity
              style={styles.loanCard}
              onPress={() => navigation.navigate('LoanDetail', { loan: item })}
              activeOpacity={0.85}
            >
              <View style={styles.loanTop}>
                <View style={styles.loanLeft}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{item.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{item.member}</Text>
                    <Text style={styles.loanDate}>Requested: {item.requested}</Text>
                  </View>
                </View>
                <View style={styles.loanRight}>
                  <Text style={styles.loanAmount}>GHS {item.amount.toLocaleString()}</Text>
                  <Badge label={sc.label} type={sc.type} size="sm" />
                </View>
              </View>

              {(item.status === 'active' || item.status === 'overdue') && (
                <View style={styles.progressSection}>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressLabel}>Repaid: GHS {item.repaid.toLocaleString()}</Text>
                    <Text style={styles.progressLabel}>Due: {item.due}</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, {
                      width: `${progress * 100}%`,
                      backgroundColor: item.status === 'overdue' ? Colors.error : Colors.success,
                    }]} />
                  </View>
                  <Text style={styles.progressPct}>{Math.round(progress * 100)}% repaid</Text>
                </View>
              )}

              <View style={styles.loanMeta}>
                <Text style={styles.metaText}>Interest: {item.interest}</Text>
                <Text style={styles.metaText}>Total due: GHS {(item.amount * 1.05).toFixed(0)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2, borderRadius: Radius.full,
  },
  addBtnText: { ...Typography.label, color: Colors.white },
  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.sm + 4, borderTopWidth: 3,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryValue: { ...Typography.h4, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
  filterTab: {
    paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 4,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  loanCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  loanLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
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
  loanMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm,
  },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
});

export default LoansScreen;
