import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';

const avatarColors = ['#1A6B3C', '#F5A623', '#3B82F6', '#22C55E', '#8B5CF6', '#EC4899'];

const maskPhone = (phone = '') => {
  if (phone.length < 6) return '•••••';
  return phone.slice(0, 3) + '•'.repeat(phone.length - 5) + phone.slice(-2);
};

const MemberDetailScreen = ({ navigation, route }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const { groupId, isAdmin, user } = useAuth();
  const memberId = route.params?.memberId;

  const [member, setMember]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('contributions');

  const load = useCallback(async () => {
    try {
      const data = await memberService.getMember(groupId, memberId);
      setMember(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [groupId, memberId]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = () => {
    Alert.alert('Remove Member', `Remove ${member.user?.fullName} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await memberService.removeMember(groupId, memberId);
          navigation.goBack();
        } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={Colors.primary} style={{ flex: 1 }} /></SafeAreaView>;
  if (!member) return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>Member not found</Text>
      </View>
    </SafeAreaView>
  );

  const name     = member.user?.fullName || '—';
  const rawPhone = member.user?.phone || '—';
  const isSelf   = member.user?.id === user?.id;
  const phone    = (isAdmin || isSelf) ? rawPhone : maskPhone(rawPhone);
  const status   = member.status?.toLowerCase();
  const role     = member.role?.toLowerCase();
  const joined   = new Date(member.joinedAt).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' });
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colorIdx = Math.abs(name.charCodeAt(0)) % avatarColors.length;

  const totalContributed = (member.contributions || []).filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
  const paidMonths = (member.contributions || []).filter(c => c.status === 'PAID').length;
  const outstandingLoan = (member.loans || []).filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').reduce((s, l) => s + (l.amount - l.amountRepaid), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.profileHero}>
          <View style={[styles.avatar, { backgroundColor: avatarColors[colorIdx] }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.memberName}>{name}</Text>
          <Text style={styles.memberPhone}>{phone}</Text>
          <View style={styles.badgeRow}>
            <Badge label={status} type={status === 'active' ? 'success' : 'neutral'} />
            {role === 'admin' && <Badge label="Admin" type="primary" />}
          </View>
          <Text style={styles.joinedText}>Member since {joined}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>GHS {totalContributed.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Contributed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{paidMonths}</Text>
            <Text style={styles.statLabel}>Months Paid</Text>
          </View>
          {isAdmin && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>GHS {outstandingLoan.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Loan Balance</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.tabRow}>
          {(isAdmin ? ['contributions', 'loans'] : ['contributions']).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'contributions' && (
          <Card>
            {member.contributions?.length > 0 ? member.contributions.map((c, i) => (
              <View key={c.id} style={[styles.historyRow, i < member.contributions.length - 1 && styles.rowBorder]}>
                <View>
                  <Text style={styles.historyMonth}>{c.cycle}</Text>
                  <Text style={styles.historyDate}>{c.paidAt ? `Paid ${new Date(c.paidAt).toLocaleDateString()}` : 'Not yet paid'}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historyAmount, { color: c.status === 'PAID' ? Colors.success : Colors.textMuted }]}>
                    {c.status === 'PAID' ? `GHS ${c.amount}` : '—'}
                  </Text>
                  <Badge label={c.status === 'PAID' ? 'Paid' : 'Pending'} type={c.status === 'PAID' ? 'success' : 'warning'} size="sm" />
                </View>
              </View>
            )) : (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No contribution history</Text>
              </View>
            )}
          </Card>
        )}

        {activeTab === 'loans' && (
          <Card>
            {member.loans?.length > 0 ? member.loans.map((l, i) => (
              <TouchableOpacity key={l.id} style={[styles.historyRow, i < member.loans.length - 1 && styles.rowBorder]}
                onPress={() => navigation.navigate('LoanDetail', { loanId: l.id })}>
                <View>
                  <Text style={styles.historyMonth}>GHS {l.amount.toLocaleString()}</Text>
                  <Text style={styles.historyDate}>{l.purpose}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Badge label={l.status} type={l.status === 'REPAID' ? 'success' : l.status === 'OVERDUE' ? 'error' : l.status === 'ACTIVE' ? 'info' : 'warning'} size="sm" />
                </View>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyState}>
                <Ionicons name="hand-left-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No loan history</Text>
              </View>
            )}
          </Card>
        )}

        {isAdmin && member.user?.id !== user?.id && (
          <Button title="Record Contribution" onPress={() => navigation.navigate('AddContribution')} size="md" style={{ marginBottom: Spacing.sm }} />
        )}
        {isAdmin && member.user?.id !== user?.id && (
          <Button title="Remove from Group" onPress={handleRemove} variant="outline" size="md"
            style={{ borderColor: Colors.error }} textStyle={{ color: Colors.error }} />
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:  { ...Typography.h4, color: Colors.textPrimary },
  container:    { paddingHorizontal: Spacing.lg },
  profileHero:  { alignItems: 'center', paddingVertical: Spacing.lg },
  avatar:       { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText:   { fontSize: 32, fontWeight: '800', color: Colors.white },
  memberName:   { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  memberPhone:  { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badgeRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  joinedText:   { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  statsRow:     { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statItem:     { flex: 1, alignItems: 'center' },
  statDivider:  { width: 1, backgroundColor: Colors.border },
  statValue:    { ...Typography.h4, color: Colors.primary },
  statLabel:    { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  tabRow:       { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md },
  tab:          { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm - 2, alignItems: 'center' },
  tabActive:    { backgroundColor: Colors.primary },
  tabText:      { ...Typography.label, color: Colors.textSecondary },
  tabTextActive:{ color: Colors.white },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  rowBorder:    { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyMonth: { ...Typography.label, color: Colors.textPrimary },
  historyDate:  { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount:{ ...Typography.label, marginBottom: 4 },
  emptyState:   { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText:    { ...Typography.body2, color: Colors.textSecondary },
});

export default MemberDetailScreen;
