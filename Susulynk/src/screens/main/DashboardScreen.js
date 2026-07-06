import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { contributionService } from '../../services/contributionService';
import { notificationService } from '../../services/notificationService';

// Quick action definitions — icon is an Ionicons name
const QUICK_ACTIONS_ADMIN = [
  { icon: 'add-circle',        label: 'Add\nContribution', screen: 'AddContribution' },
  { icon: 'cash',              label: 'New\nLoan',         screen: 'NewLoan' },
  { icon: 'person-add',        label: 'Add\nMember',       screen: 'AddMember' },
  { icon: 'git-network',       label: 'Payout',            screen: 'MainTabs', tabScreen: 'Payout' },
  { icon: 'settings',          label: 'Group\nSettings',   screen: 'GroupSettings' },
  { icon: 'business',          label: 'New\nGroup',        screen: 'CreateGroup' },
];
const QUICK_ACTIONS_MEMBER = [
  { icon: 'card',              label: 'Pay\nNow',          screen: 'MemberPay' },
  { icon: 'hand-left',         label: 'Request\nLoan',     screen: 'MyLoanRequest' },
  { icon: 'git-network',       label: 'Payout',            screen: 'MainTabs', tabScreen: 'Payout' },
  { icon: 'notifications',     label: 'Notifications',     screen: 'Notifications' },
];

const ACTIVITY_ICON = { contribution: 'wallet', paid: 'checkmark-circle', repay: 'refresh-circle' };

const DashboardScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const { user, group, groupId, isAdmin, refreshUser } = useAuth();
  const styles = makeStyles(Colors);

  const [stats, setStats]             = useState(null);
  const [activity, setActivity]       = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

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

  useFocusEffect(useCallback(() => { refreshUser(); }, [refreshUser]));

  const onRefresh = () => { setRefreshing(true); load(true); };

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const initials  = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const quickActions = isAdmin ? QUICK_ACTIONS_ADMIN : QUICK_ACTIONS_MEMBER;

  const getActivityIconName = (status) => {
    if (!status) return 'document-text';
    const t = status.toLowerCase();
    if (t.includes('paid')) return 'checkmark-circle';
    if (t.includes('repay')) return 'refresh-circle';
    return 'wallet';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good morning, {firstName}</Text>
            <Text style={styles.groupName}>{group?.name || 'No group selected'}</Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
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
            {/* Hero card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Group Savings</Text>
              <Text style={styles.heroAmount}>
                GHS {(stats?.totalSavings || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </Text>
              <View style={styles.heroRow}>
                {[
                  ['Members',      stats?.memberCount ?? '—'],
                  ['Active Loans', stats?.activeLoansCount ?? '—'],
                  ['Loans Out',    `GHS ${(stats?.totalLoansOut || 0).toLocaleString()}`],
                ].map(([label, val], i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.heroDivider} />}
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatLabel}>{label}</Text>
                      <Text style={styles.heroStatValue}>{val}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Stat cards */}
            <View style={styles.statsRow}>
              <StatCard label="Total Contributions" value={`GHS ${(stats?.totalSavings || 0).toLocaleString()}`}    iconName="wallet"    color={Colors.primary} />
              <StatCard label="Total Loans Out"     value={`GHS ${(stats?.totalLoansOut || 0).toLocaleString()}`}   iconName="cash"      color={Colors.secondary} />
            </View>

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickBtn}
                  onPress={() => a.tabScreen
                    ? navigation.navigate(a.screen, { screen: a.tabScreen })
                    : navigation.navigate(a.screen)
                  }
                  activeOpacity={0.75}
                >
                  <View style={[styles.quickIcon, { backgroundColor: Colors.primary + '15' }]}>
                    <Ionicons name={a.icon} size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent activity */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Contributions')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {activity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No recent activity</Text>
              </View>
            ) : (
              <Card noPadding>
                {activity.map((item, index) => {
                  const isPaid    = item.status === 'PAID';
                  const isOverdue = item.status === 'OVERDUE';
                  const badgeLabel = isPaid ? 'Paid' : isOverdue ? (isAdmin ? 'Overdue' : 'Awaiting') : 'Pending';
                  const badgeType  = isPaid ? 'success' : isOverdue ? (isAdmin ? 'error' : 'warning') : 'warning';
                  const iconName   = getActivityIconName(item.status);
                  const iconColor  = isPaid ? Colors.success : isOverdue ? Colors.error : Colors.warning;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.activityItem, index < activity.length - 1 && styles.activityBorder]}
                    >
                      <View style={[styles.activityIconBox, { backgroundColor: iconColor + '15' }]}>
                        <Ionicons name={iconName} size={20} color={iconColor} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityMember}>{item.member?.user?.fullName || '—'}</Text>
                        <Text style={styles.activityType}>Contribution · {item.cycle}</Text>
                      </View>
                      <View style={styles.activityRight}>
                        <Text style={[styles.activityAmount, { color: isPaid ? Colors.success : Colors.textMuted }]}>
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

const makeStyles = (Colors) => StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  greeting:       { ...Typography.h4, color: Colors.textPrimary },
  groupName:      { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  topBarRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  notifBadge:     { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: Colors.white, fontWeight: '700', fontSize: 14 },
  heroCard:       { margin: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  heroLabel:      { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  heroAmount:     { fontSize: 34, fontWeight: '800', color: Colors.white, marginBottom: Spacing.lg },
  heroRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  heroStat:       { flex: 1, alignItems: 'center' },
  heroStatLabel:  { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  heroStatValue:  { ...Typography.h4, color: Colors.white, marginTop: 2 },
  heroDivider:    { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsRow:       { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle:   { ...Typography.h4, color: Colors.textPrimary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: Spacing.lg },
  seeAll:         { ...Typography.label, color: Colors.primary },
  quickGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  quickBtn:       { width: '25%', alignItems: 'center', marginBottom: Spacing.md, paddingHorizontal: 4 },
  quickIcon:      { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel:     { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  activityItem:   { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityIconBox:{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  activityInfo:   { flex: 1 },
  activityMember: { ...Typography.label, color: Colors.textPrimary },
  activityType:   { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  activityRight:  { alignItems: 'flex-end' },
  activityAmount: { ...Typography.label, marginBottom: 4 },
  emptyActivity:  { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText:      { ...Typography.body2, color: Colors.textSecondary },
});

export default DashboardScreen;
