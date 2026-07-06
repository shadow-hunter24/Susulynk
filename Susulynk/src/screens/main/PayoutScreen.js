import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { payoutService } from '../../services/payoutService';

const getStatusConfig = (status) => {
  switch (status) {
    case 'PAID':     return { label: 'Paid Out',    type: 'success' };
    case 'CURRENT':  return { label: 'This Month',  type: 'warning' };
    default:         return { label: 'Upcoming',    type: 'neutral' };
  }
};

const PayoutScreen = ({ navigation }) => {
  const { groupId, isAdmin, user } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const avatarColors = [Colors.primary, Colors.secondary, Colors.info, Colors.success, '#8B5CF6', '#EC4899', Colors.warning, Colors.primaryLight];
  const [payouts, setPayouts]     = useState([]);
  const [current, setCurrent]     = useState(null);
  const [paidCount, setPaidCount] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking]     = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!groupId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const res = await payoutService.getPayouts(groupId);
      setPayouts(res.payouts || []);
      setCurrent(res.current || null);
      setPaidCount(res.paidCount || 0);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleMarkPaid = () => {
    if (!current) return;
    Alert.alert(
      'Confirm Payout',
      `Mark GHS ${current.amount.toLocaleString()} payout to ${current.member?.user?.fullName} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          setMarking(true);
          try {
            await payoutService.markPaid(groupId, current.id);
            load(true);
          } catch (err) { Alert.alert('Error', err.message); }
          finally { setMarking(false); }
        }},
      ]
    );
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const renderItem = ({ item, index }) => {
    const sc        = getStatusConfig(item.status);
    const isCurrent = item.status === 'CURRENT';
    const name      = item.member?.user?.fullName || '—';
    // Deontology: members don't need to see the exact date others received their payout
    const isSelf    = item.member?.user?.id === user?.id;
    const showPaidDate = isAdmin || isSelf;
    return (
      <View style={[styles.rotationRow, isCurrent && styles.rotationRowHighlight]}>
        <View style={[styles.positionBadge, isCurrent && styles.positionBadgeCurrent]}>
          <Text style={[styles.positionText, isCurrent && styles.positionTextCurrent]}>{item.position}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: avatarColors[index % avatarColors.length] }]}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, isCurrent && { color: Colors.primary }]}>{name}</Text>
          <Text style={styles.rowMonth}>{item.month}</Text>
          {showPaidDate && item.paidAt && (
            <Text style={styles.rowDate}>Paid: {new Date(item.paidAt).toLocaleDateString()}</Text>
          )}
          {!showPaidDate && item.paidAt && (
            <Text style={styles.rowDate}>✓ Received</Text>
          )}
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, isCurrent && { color: Colors.primary }]}>
            GHS {item.amount.toLocaleString()}
          </Text>
          <Badge label={sc.label} type={sc.type} size="sm" />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payout Rotation</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <>
          {current && (
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Current Month Payout</Text>
              <View style={styles.heroContent}>
                <View style={[styles.heroAvatar, { backgroundColor: avatarColors[payouts.indexOf(current) % avatarColors.length] }]}>
                  <Text style={styles.heroAvatarText}>{getInitials(current.member?.user?.fullName)}</Text>
                </View>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroName}>{current.member?.user?.fullName || '—'}</Text>
                  <Text style={styles.heroMonth}>{current.month}</Text>
                </View>
                <Text style={styles.heroAmount}>GHS {current.amount.toLocaleString()}</Text>
              </View>
              {isAdmin && (
                <Button title="Mark as Paid Out" onPress={handleMarkPaid} loading={marking} size="md" style={{ marginTop: Spacing.md }} />
              )}
            </View>
          )}

          {payouts.length > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Cycle Progress</Text>
                <Text style={styles.progressCount}>{paidCount} / {payouts.length} payouts done</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${(paidCount / payouts.length) * 100}%` }]} />
              </View>
            </View>
          )}

          <FlatList
            data={payouts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            ListHeaderComponent={<Text style={styles.listHeader}>Full Rotation Schedule</Text>}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Ionicons name="gift-outline" size={52} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No payout schedule yet</Text>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  title:  { ...Typography.h2, color: Colors.textPrimary },
  heroCard: { backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  heroAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  heroAvatarText: { color: Colors.white, fontWeight: '800', fontSize: 18 },
  heroInfo: { flex: 1 },
  heroName: { ...Typography.h4, color: Colors.white },
  heroMonth: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  heroAmount: { fontSize: 22, fontWeight: '800', color: Colors.white },
  progressSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressLabel: { ...Typography.label, color: Colors.textPrimary },
  progressCount: { ...Typography.caption, color: Colors.textSecondary },
  progressBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.success },
  listHeader: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  rotationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  rotationRowHighlight: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  positionBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  positionBadgeCurrent: { backgroundColor: Colors.primary },
  positionText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  positionTextCurrent: { color: Colors.white },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { ...Typography.label, color: Colors.textPrimary },
  rowMonth: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  rowDate: { ...Typography.caption, color: Colors.success, marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { ...Typography.label, color: Colors.textPrimary, marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.textSecondary },
});

export default PayoutScreen;
