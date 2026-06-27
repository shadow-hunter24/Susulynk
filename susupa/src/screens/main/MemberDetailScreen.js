import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const mockContributions = [
  { month: 'Jun 2026', amount: 200, status: 'paid', date: 'Jun 22' },
  { month: 'May 2026', amount: 200, status: 'paid', date: 'May 20' },
  { month: 'Apr 2026', amount: 200, status: 'paid', date: 'Apr 18' },
  { month: 'Mar 2026', amount: 200, status: 'paid', date: 'Mar 22' },
  { month: 'Feb 2026', amount: 200, status: 'pending', date: '-' },
];

const avatarColors = [Colors.primary, Colors.secondary, Colors.info, Colors.success, '#8B5CF6', '#EC4899'];

const MemberDetailScreen = ({ navigation, route }) => {
  const member = route.params?.member || {
    id: '1', name: 'Ama Owusu', phone: '0241234567', role: 'admin',
    status: 'active', contributions: 'GHS 2,400', joined: 'Jan 2024', initials: 'AO',
  };

  const [activeTab, setActiveTab] = useState('contributions');
  const colorIdx = parseInt(member.id) % avatarColors.length;

  const totalContributed = mockContributions
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0);

  const handleRemoveMember = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={[styles.avatar, { backgroundColor: avatarColors[colorIdx] }]}>
            <Text style={styles.avatarText}>{member.initials}</Text>
          </View>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberPhone}>{member.phone}</Text>
          <View style={styles.badgeRow}>
            <Badge label={member.status} type={member.status === 'active' ? 'success' : 'neutral'} />
            {member.role === 'admin' && <Badge label="Admin 👑" type="primary" />}
          </View>
          <Text style={styles.joinedText}>Member since {member.joined}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>GHS {totalContributed.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Contributed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {mockContributions.filter(c => c.status === 'paid').length}
            </Text>
            <Text style={styles.statLabel}>Months Paid</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>GHS 0</Text>
            <Text style={styles.statLabel}>Outstanding Loan</Text>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={styles.contactLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['contributions', 'loans'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <Card>
            {mockContributions.map((c, i) => (
              <View key={i} style={[styles.historyRow, i < mockContributions.length - 1 && styles.rowBorder]}>
                <View>
                  <Text style={styles.historyMonth}>{c.month}</Text>
                  <Text style={styles.historyDate}>{c.date !== '-' ? `Paid on ${c.date}` : 'Not yet paid'}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historyAmount, { color: c.status === 'paid' ? Colors.success : Colors.textMuted }]}>
                    {c.status === 'paid' ? `GHS ${c.amount}` : '-'}
                  </Text>
                  <Badge label={c.status === 'paid' ? 'Paid' : 'Pending'} type={c.status === 'paid' ? 'success' : 'warning'} size="sm" />
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyText}>No loan history</Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Record Contribution"
            onPress={() => navigation.navigate('AddContribution')}
            size="md"
            style={{ marginBottom: Spacing.sm }}
          />
          <Button
            title="Remove from Group"
            onPress={handleRemoveMember}
            variant="outline"
            size="md"
            style={{ borderColor: Colors.error }}
            textStyle={{ color: Colors.error }}
          />
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg },
  profileHero: { alignItems: 'center', paddingVertical: Spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  memberName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  memberPhone: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  joinedText: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statValue: { ...Typography.h4, color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  contactRow: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  contactBtn: { alignItems: 'center' },
  contactIcon: { fontSize: 28, marginBottom: 4 },
  contactLabel: { ...Typography.caption, color: Colors.textSecondary },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm - 2, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyMonth: { ...Typography.label, color: Colors.textPrimary },
  historyDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { ...Typography.label, marginBottom: 4 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
  actions: { marginTop: Spacing.sm },
});

export default MemberDetailScreen;
