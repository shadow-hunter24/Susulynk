import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { loanService } from '../../services/loanService';

const statusConfig = {
  ACTIVE:  { label: 'Active',          type: 'info' },
  REPAID:  { label: 'Fully Repaid',    type: 'success' },
  OVERDUE: { label: 'Overdue',         type: 'error' },
  PENDING: { label: 'Pending Approval',type: 'warning' },
};

const LoanDetailScreen = ({ navigation, route }) => {
  const { groupId, isAdmin, user } = useAuth();
  const loanId = route.params?.loanId;

  const [loan, setLoan]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showRepayForm, setShowRepayForm] = useState(false);
  const [repayAmount, setRepayAmount]   = useState('');
  const [repayLoading, setRepayLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await loanService.getLoan(groupId, loanId);
      setLoan(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [groupId, loanId]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = () => {
    Alert.alert('Approve Loan', 'Approve this loan?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        try {
          await loanService.updateLoan(groupId, loanId, { status: 'ACTIVE' });
          load();
        } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const handleMarkRepaid = () => {
    Alert.alert('Mark as Fully Repaid', 'Confirm?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await loanService.updateLoan(groupId, loanId, { status: 'REPAID' });
          load();
        } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const handleRepayment = async () => {
    if (!repayAmount || isNaN(Number(repayAmount)) || Number(repayAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setRepayLoading(true);
    try {
      await loanService.recordRepayment(groupId, loanId, { amount: Number(repayAmount) });
      setRepayAmount('');
      setShowRepayForm(false);
      load();
      Alert.alert('Success', `GHS ${repayAmount} repayment recorded.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setRepayLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ ...Typography.body1, color: Colors.textSecondary }}>Loan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc          = statusConfig[loan.status] || statusConfig.PENDING;
  const progress    = loan.amountRepaid / loan.amount;
  const outstanding = loan.amount - loan.amountRepaid;
  const heroBg      = loan.status === 'OVERDUE' ? Colors.error : loan.status === 'REPAID' ? Colors.success : Colors.primary;
  const name        = loan.member?.user?.fullName || '—';
  const isOwner     = loan.member?.user?.id === user?.id;
  const canRepay    = (isAdmin || isOwner) && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE');
  const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Card>
          <View style={styles.memberRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(name)}</Text></View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{name}</Text>
              <Text style={styles.memberSub}>Requested {new Date(loan.createdAt).toLocaleDateString()}</Text>
            </View>
            <Badge label={sc.label} type={sc.type} />
          </View>
        </Card>

        <View style={[styles.amountHero, { backgroundColor: heroBg }]}>
          <Text style={styles.amountLabel}>Loan Amount</Text>
          <Text style={styles.amountValue}>GHS {loan.amount.toLocaleString()}</Text>
          <View style={styles.amountRow}>
            {[
              ['Repaid',      `GHS ${loan.amountRepaid.toLocaleString()}`],
              ['Outstanding', `GHS ${outstanding.toLocaleString()}`],
              ['Total Due',   `GHS ${loan.totalDue?.toLocaleString()}`],
            ].map(([label, value], i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.amountDivider} />}
                <View style={styles.amountStat}>
                  <Text style={styles.amountStatLabel}>{label}</Text>
                  <Text style={styles.amountStatValue}>{value}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Repayment Progress</Text>
              <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: loan.status === 'OVERDUE' ? Colors.error : Colors.success }]} />
            </View>
            <Text style={styles.progressSub}>Due by {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Loan Information</Text>
        <Card>
          {[
            ['Interest Rate', `${loan.interestRate}%`],
            ['Due Date',      loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'],
            ['Date Requested',new Date(loan.createdAt).toLocaleDateString()],
            ['Purpose',       loan.purpose || '—'],
          ].map(([label, value], i) => (
            <View key={i} style={[styles.infoRow, i < 3 && styles.rowBorder]}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        {loan.repayments?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Repayment History</Text>
            <Card>
              {loan.repayments.map((r, i) => (
                <View key={r.id} style={[styles.repayRow, i < loan.repayments.length - 1 && styles.rowBorder]}>
                  <View>
                    <Text style={styles.repayDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.repayMethod}>{r.method?.replace('_', ' ')} {r.reference ? `· ${r.reference}` : ''}</Text>
                  </View>
                  <Text style={styles.repayAmount}>GHS {r.amount.toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {showRepayForm && (
          <Card>
            <Text style={styles.repayFormTitle}>
              {isOwner && !isAdmin ? 'Submit Repayment' : 'Record Repayment'}
            </Text>
            {isOwner && !isAdmin && (
              <View style={styles.repayInfoBox}>
                <Text style={styles.repayInfoText}>
                  💡 Enter your MoMo reference after sending payment. The admin will verify it.
                </Text>
              </View>
            )}
            <Input label="Amount (GHS)" placeholder={`Max: GHS ${outstanding.toLocaleString()}`}
              value={repayAmount} onChangeText={setRepayAmount}
              keyboardType="decimal-pad" leftIcon={<Text style={{ fontSize: 16 }}>💵</Text>} />
            <View style={styles.repayBtnRow}>
              <Button title="Cancel" onPress={() => setShowRepayForm(false)} variant="outline" size="md" fullWidth={false} style={{ flex: 1, marginRight: Spacing.sm }} />
              <Button title={isOwner && !isAdmin ? 'Submit' : 'Record'} onPress={handleRepayment} loading={repayLoading} size="md" fullWidth={false} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          {/* Admin actions */}
          {isAdmin && loan.status === 'PENDING' && (
            <Button title="Approve Loan" onPress={handleApprove} size="lg" style={{ marginBottom: Spacing.sm }} />
          )}
          {isAdmin && loan.status === 'ACTIVE' && (
            <Button title="Mark as Fully Repaid" variant="outline" size="md" onPress={handleMarkRepaid} style={{ marginBottom: Spacing.sm }} />
          )}
          {/* Admin or owner can submit repayment */}
          {canRepay && !showRepayForm && (
            <Button
              title={isOwner && !isAdmin ? '💳 Submit Repayment' : 'Record Repayment'}
              onPress={() => setShowRepayForm(true)}
              size="lg"
              style={{ marginBottom: Spacing.sm }}
            />
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  memberInfo: { flex: 1 },
  memberName: { ...Typography.label, color: Colors.textPrimary },
  memberSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  amountHero: { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, alignItems: 'center' },
  amountLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  amountValue: { fontSize: 40, fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  amountRow: { flexDirection: 'row', width: '100%' },
  amountStat: { flex: 1, alignItems: 'center' },
  amountStatLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  amountStatValue: { ...Typography.label, color: Colors.white, marginTop: 2 },
  amountDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressTitle: { ...Typography.label, color: Colors.textPrimary },
  progressPct: { ...Typography.label, color: Colors.success },
  progressBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressSub: { ...Typography.caption, color: Colors.textSecondary },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { ...Typography.body2, color: Colors.textSecondary },
  infoValue: { ...Typography.label, color: Colors.textPrimary },
  repayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  repayDate: { ...Typography.label, color: Colors.textPrimary },
  repayMethod: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  repayAmount: { ...Typography.label, color: Colors.success },
  repayFormTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  repayInfoBox: { backgroundColor: Colors.info + '15', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.info },
  repayInfoText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  repayBtnRow: { flexDirection: 'row', marginTop: Spacing.sm },
  actions: { marginTop: Spacing.sm },
});

export default LoanDetailScreen;
