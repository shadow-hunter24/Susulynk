import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { contributionService } from '../../services/contributionService';
import { notificationService } from '../../services/notificationService';

const DashboardScreen = ({ navigation }) => {
  const { user, group, groupId, isAdmin } = useAuth();

  const [stats, setStats]       = useState(null);
  const [activity, setActivity] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!groupId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const [dash, contribs, notifRes] = await Promise.all([
        reportService.getDashboard(groupId),
        contributionService.getContributions(groupId, {}),
        notificationService.getNotifications(),
      ]);
      setStats(dash);
      setActivity((contribs.contributions || []).slice(0, 5));
      setUnreadCount(notifRes.unreadCount || 0);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const initials  = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const allQuickActions = [
    { icon: '💸', label: 'Add Contribution', screen: 'AddContribution', color: Colors.primary,   adminOnly: true },
    { icon: '🤝', label: 'New Loan',         screen: 'NewLoan',         color: Colors.secondary, adminOnly: true },
    { icon: '👥', label: 'Add Member',       screen: 'AddMember',       color: Colors.info,      adminOnly: true },
    { icon: '🎉', label: 'Payout',           screen: 'MainTabs',        tabScreen: 'Payout',     color: Colors.success, adminOnly: false },
    // "New Group" only in Quick Actions for admins — members access it from Profile → My Groups
    { icon: '🏦', label: 'New Group',        screen: 'CreateGroup',     color: Colors.primary,   adminOnly: true },
    // Member self-service actions
    { icon: '💳', label: 'Pay Now',          screen: 'MemberPay',       color: Colors.success,   adminOnly: false, memberOnly: true },
    { icon: '🤲', label: 'Request Loan',     screen: 'MyLoanRequest',   color: Colors.secondary, adminOnly: false, memberOnly: true },
  ];
  const quickActions = allQuickActions.filter(a => {
    if (a.adminOnly) return isAdmin;
    if (a.memberOnly) return !isAdmin;
    return true;
  });

  const getActivityIcon = (type) => {
    if (!type) return '📋';
    const t = type.toLowerCase();
    if (t.includes('contribution') || t.includes('paid')) return '💰';
    if (t.includes('repay')) return '✅';
    return '📋';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good morning, {firstName} 👋</Text>
            <Text style={styles.groupName}>{group?.name || 'No group yet'}</Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.notifIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            {/* Hero */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Group Savings</Text>
              <Text style={styles.heroAmount}>
                GHS {(stats?.totalSavings || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Members</Text>
                  <Text style={styles.heroStatValue}>{stats?.memberCount ?? '—'}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Active Loans</Text>
                  <Text style={styles.heroStatValue}>{stats?.activeLoansCount ?? '—'}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Loans Out</Text>
                  <Text style={styles.heroStatValue}>GHS {(stats?.totalLoansOut || 0).toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard label="Total Contributions" value={`GHS ${(stats?.totalSavings || 0).toLocaleString()}`} icon="💰" color={Colors.primary} />
              <StatCard label="Total Loans Out"     value={`GHS ${(stats?.totalLoansOut || 0).toLocaleString()}`} icon="🤝" color={Colors.secondary} />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {quickActions.map((a, i) => (
                <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => a.tabScreen ? navigation.navigate(a.screen, { screen: a.tabScreen }) : navigation.navigate(a.screen)} activeOpacity={0.8}>
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

            {activity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyText}>No recent activity</Text>
              </View>
            ) : (
              <Card noPadding>
                {activity.map((item, index) => {
                  // Virtue ethics: soften "Pending/Overdue" status language for member view
                  const isPaid = item.status === 'PAID';
                  const isOverdue = item.status === 'OVERDUE';
                  const badgeLabel = isPaid ? 'Paid' : isOverdue ? (isAdmin ? 'Overdue' : 'Awaiting Payment') : 'Pending';
                  const badgeType  = isPaid ? 'success' : isOverdue ? (isAdmin ? 'error' : 'warning') : 'warning';
                  return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.activityItem, index < activity.length - 1 && styles.activityBorder]}
                  >
                    <View style={styles.activityLeft}>
                      <Text style={styles.activityIcon}>{getActivityIcon(item.status)}</Text>
                      <View>
                        <Text style={styles.activityMember}>
                          {item.member?.user?.fullName || '—'}
                        </Text>
                        <Text style={styles.activityType}>Contribution · {item.cycle}</Text>
                        <Text style={styles.activityDate}>
                          {item.paidAt ? new Date(item.paidAt).toLocaleDateString() : item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.activityRight}>
                      <Text style={[styles.activityAmount, { color: isPaid ? Colors.success : Colors.warning }]}>
                        {isPaid ? `GHS ${item.amount}` : '—'}
                      </Text>
                      <Badge label={badgeLabel} type={badgeType} size="sm" />
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </Card>
            )}
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  greeting: { ...Typography.h4, color: Colors.textPrimary },
  groupName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  notifIcon: { fontSize: 18 },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.error, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  heroCard: { margin: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  heroAmount: { fontSize: 36, fontWeight: '800', color: Colors.white, marginBottom: Spacing.lg },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  heroStatValue: { ...Typography.h4, color: Colors.white, marginTop: 2 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: Spacing.lg },
  seeAll: { ...Typography.label, color: Colors.primary },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  quickBtn: { width: '25%', alignItems: 'center', marginBottom: Spacing.md },
  quickIcon: { width: 54, height: 54, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  quickIconText: { fontSize: 24 },
  quickLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activityIcon: { fontSize: 24, marginRight: Spacing.sm },
  activityMember: { ...Typography.label, color: Colors.textPrimary },
  activityType: { ...Typography.caption, color: Colors.textSecondary },
  activityDate: { ...Typography.caption, color: Colors.textMuted },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { ...Typography.label, marginBottom: 4 },
  emptyActivity: { alignItems: 'center', paddingVertical: Spacing.lg },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
});

export default DashboardScreen;
