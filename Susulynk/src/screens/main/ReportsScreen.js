import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { contributionService } from '../../services/contributionService';

const ReportsScreen = () => {
  const { groupId, isAdmin } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const [cycles, setCycles]           = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [report, setReport]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!groupId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [cycleList, reportData] = await Promise.all([
        contributionService.getCycles(groupId),
        reportService.getReport(groupId, selectedCycle),
      ]);
      setCycles(cycleList);
      if (!selectedCycle && cycleList.length > 0) setSelectedCycle(cycleList[0]);
      setReport(reportData);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId, selectedCycle]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const collectionRate = report?.contributions?.collectionRate ?? 0;

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Financial summary & insights</Text>
        </View>

        {/* Cycle selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={styles.monthRow}>
          {cycles.map((c) => (
            <TouchableOpacity key={c}
              style={[styles.monthBtn, selectedCycle === c && styles.monthBtnActive]}
              onPress={() => setSelectedCycle(c)}>
              <Text style={[styles.monthText, selectedCycle === c && styles.monthTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : !report ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No report data available</Text>
          </View>
        ) : (
          <>
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
              <Text style={styles.heroSub}>
                GHS {(report.contributions.collected || 0).toLocaleString()} of GHS {(report.contributions.expected || 0).toLocaleString()} collected
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard label="Contributions" value={`GHS ${(report.contributions.collected || 0).toLocaleString()}`} icon="💰" color={Colors.primary} />
              <StatCard label="Loans Issued"  value={`GHS ${(report.loans.totalOut || 0).toLocaleString()}`}          icon="🤝" color={Colors.secondary} />
            </View>
            <View style={styles.statsGrid}>
              <StatCard label="Repayments"    value={`GHS ${(report.loans.totalRepayments || 0).toLocaleString()}`}   icon="✅" color={Colors.success} />
              <StatCard label="Active Members" value={`${report.members.active}`}                                      icon="👥" color={Colors.info} />
            </View>

            {/* Top Contributors — admin only: ranking individuals by contribution amount
                can create shame/pressure for members who paid less (virtue ethics) */}
            {isAdmin && report.topContributors?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Top Contributors</Text>
                <Card>
                  {report.topContributors.map((c, i) => (
                    <View key={c.memberId} style={[styles.contributorRow, i < report.topContributors.length - 1 && styles.rowBorder]}>
                      <Text style={styles.rankText}>#{i + 1}</Text>
                      <View style={[styles.avatar, { backgroundColor: [Colors.secondary, Colors.primary, Colors.info, Colors.success, Colors.warning][i % 5] }]}>
                        <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
                      </View>
                      <View style={styles.contributorInfo}>
                        <Text style={styles.contributorName}>{c.name}</Text>
                      </View>
                      <Text style={styles.contributorAmount}>GHS {(c.totalPaid || 0).toLocaleString()}</Text>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Group Health */}
            <Text style={styles.sectionTitle}>Group Health</Text>
            <Card>
              {[
                // Admins see full detail; members see group-level health without punitive framing
                { label: 'On-time payment rate',      value: `${report.members.payOnTimeRate ?? 0}%`,    good: (report.members.payOnTimeRate ?? 0) >= 70,  adminOnly: true },
                { label: 'Overdue loan rate',          value: `${report.groupHealth.overdueRate ?? 0}%`,  good: (report.groupHealth.overdueRate ?? 0) < 10,  adminOnly: false },
                { label: 'Active loans',               value: `${report.loans.activeCount}`,              good: true,                                         adminOnly: false },
                { label: 'Average contribution',       value: `GHS ${report.groupHealth.averageContribution}`, good: true,                                   adminOnly: false },
              ]
              .filter(item => !item.adminOnly || isAdmin)
              .map((item, i, arr) => (
                <View key={i} style={[styles.healthRow, i < arr.length - 1 && styles.rowBorder]}>
                  <Text style={styles.healthLabel}>{item.label}</Text>
                  <Text style={[styles.healthValue, {
                    // Virtue ethics: don't use red danger colour for members viewing overdue rate
                    color: isAdmin
                      ? (item.good ? Colors.success : Colors.error)
                      : Colors.textPrimary,
                  }]}>{item.value}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: Spacing.xl },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, marginTop: 2 },
  monthScroll: { maxHeight: 44, marginBottom: Spacing.md },
  monthRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  monthBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  monthBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthText: { ...Typography.caption, color: Colors.textSecondary },
  monthTextActive: { color: Colors.white, fontWeight: '600' },
  hero: { backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center' },
  heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  heroRate: { fontSize: 52, fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  progressBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: Spacing.sm },
  progressFill: { height: 8, borderRadius: 4 },
  heroSub: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: 2 },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm },
  contributorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rankText: { ...Typography.label, color: Colors.textMuted, width: 28 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  contributorInfo: { flex: 1 },
  contributorName: { ...Typography.label, color: Colors.textPrimary },
  contributorAmount: { ...Typography.label, color: Colors.primary },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  healthLabel: { ...Typography.body2, color: Colors.textSecondary, flex: 1 },
  healthValue: { ...Typography.label },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyText: { ...Typography.body1, color: Colors.textSecondary },
});

export default ReportsScreen;
