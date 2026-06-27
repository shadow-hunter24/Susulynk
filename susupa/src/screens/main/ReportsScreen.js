import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const MONTHS = ['Jun 2026', 'May 2026', 'Apr 2026', 'Mar 2026'];

const monthData = {
  'Jun 2026': { collected: 800, expected: 1200, loans: 1800, repayments: 500, members: 18 },
  'May 2026': { collected: 1200, expected: 1200, loans: 1000, repayments: 800, members: 17 },
  'Apr 2026': { collected: 1000, expected: 1200, loans: 500, repayments: 300, members: 16 },
  'Mar 2026': { collected: 1200, expected: 1200, loans: 200, repayments: 200, members: 15 },
};

const topContributors = [
  { name: 'Ama Owusu', initials: 'AO', amount: 'GHS 2,400', streak: '6 months' },
  { name: 'Abena Sarpong', initials: 'AS', amount: 'GHS 2,200', streak: '5 months' },
  { name: 'Akosua Mensah', initials: 'AM', amount: 'GHS 2,000', streak: '5 months' },
];

const ReportsScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState('Jun 2026');
  const data = monthData[selectedMonth];
  const collectionRate = Math.round((data.collected / data.expected) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Financial summary & insights</Text>
        </View>

        {/* Month Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={styles.monthRow}>
          {MONTHS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.monthBtn, selectedMonth === m && styles.monthBtnActive]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={[styles.monthText, selectedMonth === m && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Collection Rate Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Collection Rate</Text>
          <Text style={styles.heroRate}>{collectionRate}%</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${collectionRate}%`,
              backgroundColor: collectionRate >= 100 ? Colors.success : collectionRate >= 70 ? Colors.warning : Colors.error,
            }]} />
          </View>
          <Text style={styles.heroSub}>GHS {data.collected.toLocaleString()} of GHS {data.expected.toLocaleString()} collected</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Contributions"
            value={`GHS ${data.collected.toLocaleString()}`}
            icon="💰"
            color={Colors.primary}
          />
          <StatCard
            label="Loans Issued"
            value={`GHS ${data.loans.toLocaleString()}`}
            icon="🤝"
            color={Colors.secondary}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="Repayments"
            value={`GHS ${data.repayments.toLocaleString()}`}
            icon="✅"
            color={Colors.success}
          />
          <StatCard
            label="Active Members"
            value={data.members.toString()}
            icon="👥"
            color={Colors.info}
          />
        </View>

        {/* Top Contributors */}
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        <Card>
          {topContributors.map((c, i) => (
            <View key={i} style={[styles.contributorRow, i < topContributors.length - 1 && styles.rowBorder]}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>#{i + 1}</Text>
              </View>
              <View style={[styles.contributorAvatar, { backgroundColor: [Colors.secondary, Colors.primary, Colors.info][i] }]}>
                <Text style={styles.avatarText}>{c.initials}</Text>
              </View>
              <View style={styles.contributorInfo}>
                <Text style={styles.contributorName}>{c.name}</Text>
                <Text style={styles.contributorStreak}>🔥 {c.streak} streak</Text>
              </View>
              <Text style={styles.contributorAmount}>{c.amount}</Text>
            </View>
          ))}
        </Card>

        {/* Group Health */}
        <Text style={styles.sectionTitle}>Group Health</Text>
        <Card>
          {[
            { label: 'On-time payment rate', value: '83%', good: true },
            { label: 'Members with active loans', value: '28%', good: true },
            { label: 'Overdue loan rate', value: '6%', good: false },
            { label: 'Average contribution', value: 'GHS 200', good: true },
          ].map((item, i) => (
            <View key={i} style={[styles.healthRow, i < 3 && styles.rowBorder]}>
              <Text style={styles.healthLabel}>{item.label}</Text>
              <Text style={[styles.healthValue, { color: item.good ? Colors.success : Colors.error }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: Spacing.xl },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, marginTop: 2 },
  monthScroll: { marginBottom: Spacing.md },
  monthRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  monthBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  monthBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthText: { ...Typography.caption, color: Colors.textSecondary },
  monthTextActive: { color: Colors.white, fontWeight: '600' },
  hero: {
    backgroundColor: Colors.primary, margin: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center',
  },
  heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  heroRate: { fontSize: 52, fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  progressBg: {
    width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4, marginBottom: Spacing.sm,
  },
  progressFill: { height: 8, borderRadius: 4 },
  heroSub: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: 2 },
  sectionTitle: {
    ...Typography.h4, color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  contributorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rank: { width: 28 },
  rankText: { ...Typography.label, color: Colors.textMuted },
  contributorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  contributorInfo: { flex: 1 },
  contributorName: { ...Typography.label, color: Colors.textPrimary },
  contributorStreak: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  contributorAmount: { ...Typography.label, color: Colors.primary },
  healthRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: Spacing.sm,
  },
  healthLabel: { ...Typography.body2, color: Colors.textSecondary, flex: 1 },
  healthValue: { ...Typography.label },
});

export default ReportsScreen;
