import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const recentActivity = [
  { id: '1', member: 'Ama Owusu', type: 'Contribution', amount: 'GHS 200', date: 'Today, 9:30am', status: 'success' },
  { id: '2', member: 'Kwame Asante', type: 'Loan Repayment', amount: 'GHS 500', date: 'Today, 8:00am', status: 'success' },
  { id: '3', member: 'Abena Sarpong', type: 'Loan Request', amount: 'GHS 1,000', date: 'Yesterday', status: 'warning' },
  { id: '4', member: 'Yaw Darko', type: 'Contribution', amount: 'GHS 200', date: 'Yesterday', status: 'success' },
];

const DashboardScreen = ({ navigation }) => {
  const user = { name: 'Kofi', groupName: 'Accra Women Susu' };

  const quickActions = [
    { icon: '💸', label: 'Add Contribution', screen: 'AddContribution', color: Colors.primary },
    { icon: '🤝', label: 'New Loan', screen: 'NewLoan', color: Colors.secondary },
    { icon: '👥', label: 'Add Member', screen: 'AddMember', color: Colors.info },
    { icon: '📊', label: 'Reports', screen: 'Reports', color: Colors.success },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good morning, {user.name} 👋</Text>
            <Text style={styles.groupName}>{user.groupName}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>KM</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Group Savings</Text>
          <Text style={styles.heroAmount}>GHS 24,500.00</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Members</Text>
              <Text style={styles.heroStatValue}>18</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Active Loans</Text>
              <Text style={styles.heroStatValue}>5</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>This Month</Text>
              <Text style={styles.heroStatValue}>GHS 3,600</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Total Contributions" value="GHS 24,500" icon="💰" color={Colors.primary} trend="12% this month" trendUp />
          <StatCard label="Total Loans Out" value="GHS 8,200" icon="🤝" color={Colors.secondary} trend="2 new" trendUp={false} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => navigation.navigate(a.screen)} activeOpacity={0.8}>
              <View style={[styles.quickIcon, { backgroundColor: a.color + '15' }]}>
                <Text style={styles.quickIconText}>{a.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Contributions')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <Card noPadding style={{ marginHorizontal: Spacing.lg }}>
          {recentActivity.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.activityItem, index < recentActivity.length - 1 && styles.activityBorder]}
            >
              <View style={styles.activityLeft}>
                <Text style={styles.activityIcon}>
                  {item.type === 'Contribution' ? '💰' : item.type === 'Loan Repayment' ? '✅' : '📋'}
                </Text>
                <View>
                  <Text style={styles.activityMember}>{item.member}</Text>
                  <Text style={styles.activityType}>{item.type}</Text>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: item.status === 'success' ? Colors.success : Colors.warning }]}>
                  {item.amount}
                </Text>
                <Badge label={item.status === 'success' ? 'Paid' : 'Pending'} type={item.status} size="sm" />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  greeting: { ...Typography.h4, color: Colors.textPrimary },
  groupName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  heroCard: {
    margin: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.lg, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  heroAmount: { fontSize: 36, fontWeight: '800', color: Colors.white, marginBottom: Spacing.lg },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  heroStatValue: { ...Typography.h4, color: Colors.white, marginTop: 2 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: Spacing.lg,
  },
  seeAll: { ...Typography.label, color: Colors.primary },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  quickBtn: { width: '25%', alignItems: 'center', marginBottom: Spacing.md },
  quickIcon: { width: 54, height: 54, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  quickIconText: { fontSize: 24 },
  quickLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  activityItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.md,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activityIcon: { fontSize: 24, marginRight: Spacing.sm },
  activityMember: { ...Typography.label, color: Colors.textPrimary },
  activityType: { ...Typography.caption, color: Colors.textSecondary },
  activityDate: { ...Typography.caption, color: Colors.textMuted },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { ...Typography.label, marginBottom: 4 },
});

export default DashboardScreen;
