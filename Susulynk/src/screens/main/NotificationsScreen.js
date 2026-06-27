import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { notificationService } from '../../services/notificationService';

const typeColors = {
  CONTRIBUTION: Colors.success,
  LOAN:         Colors.secondary,
  PAYOUT:       Colors.primary,
  REMINDER:     Colors.warning,
  MEMBER:       Colors.info,
  REPAYMENT:    Colors.success,
  SYSTEM:       Colors.textMuted,
};

const typeIcons = {
  CONTRIBUTION: '💰',
  LOAN:         '🤝',
  PAYOUT:       '🎉',
  REMINDER:     '⏰',
  MEMBER:       '👤',
  REPAYMENT:    '💳',
  SYSTEM:       '📢',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    await notificationService.markRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationService.markAllRead().catch(() => {});
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
      onPress={() => { if (!item.isRead) markRead(item.id); }}
      activeOpacity={0.85}
    >
      {!item.isRead && <View style={styles.unreadDot} />}
      <View style={[styles.iconBox, { backgroundColor: (typeColors[item.type] || Colors.primary) + '15' }]}>
        <Text style={styles.notifIcon}>{typeIcons[item.type] || '📢'}</Text>
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>{item.title}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 72 }} />}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No new notifications</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  backText: { fontSize: 20, color: Colors.textPrimary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { ...Typography.h2, color: Colors.textPrimary },
  badge: { backgroundColor: Colors.error, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  markAllText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, position: 'relative' },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary, backgroundColor: Colors.primary + '05' },
  unreadDot: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  notifIcon: { fontSize: 20 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { ...Typography.label, color: Colors.textSecondary, flex: 1 },
  notifTitleUnread: { color: Colors.textPrimary },
  notifTime: { ...Typography.caption, color: Colors.textMuted, marginLeft: Spacing.sm },
  notifMessage: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyText: { ...Typography.body2, color: Colors.textSecondary },
});

export default NotificationsScreen;
