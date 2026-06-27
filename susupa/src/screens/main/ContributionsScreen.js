import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
} from 'react-native';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const CONTRIBUTIONS = [
  { id: '1', member: 'Ama Owusu', initials: 'AO', amount: 200, date: 'Jun 22, 2026', method: 'Mobile Money', status: 'paid', cycle: 'June 2026' },
  { id: '2', member: 'Kwame Asante', initials: 'KA', amount: 200, date: 'Jun 22, 2026', method: 'Cash', status: 'paid', cycle: 'June 2026' },
  { id: '3', member: 'Abena Sarpong', initials: 'AS', amount: 200, date: 'Jun 20, 2026', method: 'Mobile Money', status: 'paid', cycle: 'June 2026' },
  { id: '4', member: 'Yaw Darko', initials: 'YD', amount: 200, date: '-', method: '-', status: 'pending', cycle: 'June 2026' },
  { id: '5', member: 'Akosua Mensah', initials: 'AM', amount: 200, date: 'Jun 21, 2026', method: 'Cash', status: 'paid', cycle: 'June 2026' },
  { id: '6', member: 'Kofi Boateng', initials: 'KB', amount: 200, date: '-', method: '-', status: 'overdue', cycle: 'June 2026' },
];

const CYCLES = ['June 2026', 'May 2026', 'April 2026'];

const ContributionsScreen = ({ navigation }) => {
  const [selectedCycle, setSelectedCycle] = useState('June 2026');
  const [filter, setFilter] = useState('all');

  const filtered = CONTRIBUTIONS.filter((c) =>
    (filter === 'all' || c.status === filter) && c.cycle === selectedCycle
  );

  const totalPaid = CONTRIBUTIONS.filter(c => c.status === 'paid' && c.cycle === selectedCycle)
    .reduce((s, c) => s + c.amount, 0);
  const totalExpected = CONTRIBUTIONS.length * 200;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Contributions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddContribution')}>
          <Text style={styles.addBtnText}>+ Record</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cycleRow}>
        {CYCLES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.cycleBtn, selectedCycle === c && styles.cycleBtnActive]}
            onPress={() => setSelectedCycle(c)}
          >
            <Text style={[styles.cycleText, selectedCycle === c && styles.cycleTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Collected</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>GHS {totalPaid.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expected</Text>
          <Text style={styles.summaryValue}>GHS {totalExpected.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>GHS {(totalExpected - totalPaid).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(totalPaid / totalExpected) * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round((totalPaid / totalExpected) * 100)}% collected</Text>

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
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.member}</Text>
              <Text style={styles.rowDate}>{item.date !== '-' ? item.date : 'Not paid'} · {item.method}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowAmount, { color: item.status === 'paid' ? Colors.success : Colors.textPrimary }]}>
                {item.status === 'paid' ? `GHS ${item.amount}` : '-'}
              </Text>
              <Badge
                label={item.status === 'paid' ? 'Paid' : item.status === 'overdue' ? 'Overdue' : 'Pending'}
                type={item.status === 'paid' ? 'success' : item.status === 'overdue' ? 'error' : 'warning'}
                size="sm"
              />
            </View>
          </View>
        )}
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
  cycleRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  cycleBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  cycleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cycleText: { ...Typography.caption, color: Colors.textSecondary },
  cycleTextActive: { color: Colors.white, fontWeight: '600' },
  summary: {
    flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryValue: { ...Typography.h4, color: Colors.textPrimary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  progressContainer: {
    height: 6, backgroundColor: Colors.border, borderRadius: 3,
    marginHorizontal: Spacing.lg, marginBottom: 4,
  },
  progressBar: { height: 6, backgroundColor: Colors.success, borderRadius: 3 },
  progressLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'right', paddingRight: Spacing.lg, marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md },
  filterTab: {
    paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  avatarBox: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { ...Typography.label, color: Colors.textPrimary },
  rowDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { ...Typography.label, marginBottom: 4 },
});

export default ContributionsScreen;
