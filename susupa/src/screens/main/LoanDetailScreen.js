import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const repaymentHistory = [
  { date: 'Jun 15, 2026', amount: 300, method: 'Mobile Money', ref: 'MM123456' },
  { date: 'May 20, 2026', amount: 200, method: 'Cash', ref: '-' },
];

const statusConfig = {
  active: { label: 'Active', type: 'info' },
  repaid: { label: 'Fully Repaid', type: 'success' },
  overdue: { label: 'Overdue', type: 'error' },
  pending: { label: 'Pending Approval', type: 'warning' },
};

const LoanDetailScreen = ({ navigation, route }) => {
  const loan = route.params?.loan || {
    id: '1', member: 'Abena Sarpong', initials: 'AS',
    amount: 1000, repaid: 500, requested: 'Jun 1, 2026',
    due: 'Aug 1, 2026', status: 'active', interest: '5%',
  };

  const [showRepayForm, setShowRepayForm] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);

  const sc = statusConfig[loan.status];
  const progress = loan.repaid / loan.amount;
  const outstanding = loan.amount - loan.repaid;
  const totalDue = (loan.amount * 1.05).toFixed(0);

  const handleRepayment = () => {
    if (!repayAmount || isNaN(Number(repayAmount)) || Number(repayAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid repayment amount.');
      return;
    }
    setRepayLoading(true);
    setTimeout(() => {
      setRepayLoading(false);
      setShowRepayForm(false);
      Alert.alert('Success', `GHS ${repayAmount} repayment recorded.`);
    }, 1200);
  };

  const handleApproveLoan = () => {
    Alert.alert('Approve Loan', `Approve GHS ${loan.amount.toLocaleString()} loan for ${loan.member}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Member + Status */}
        <Card>
          <View style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{loan.initials}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{loan.member}</Text>
              <Text style={styles.memberSub}>Requested {loan.requested}</Text>
            </View>
            <Badge label={sc.label} type={sc.type} />
          </View>
        </Card>

        {/* Amount Hero */}
        <View style={[styles.amountHero, {
          backgroundColor: loan.status === 'overdue' ? Colors.error : loan.status === 'repaid' ? Colors.success : Colors.primary,
        }]}>
          <Text style={styles.amountLabel}>Loan Amount</Text>
          <Text style={styles.amountValue}>GHS {loan.amount.toLocaleString()}</Text>
          <View style={styles.amountRow}>
            <View style={styles.amountStat}>
              <Text style={styles.amountStatLabel}>Repaid</Text>
              <Text style={styles.amountStatValue}>GHS {loan.repaid.toLocaleString()}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountStat}>
              <Text style={styles.amountStatLabel}>Outstanding</Text>
              <Text style={styles.amountStatValue}>GHS {outstanding.toLocaleString()}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountStat}>
              <Text style={styles.amountStatLabel}>Total Due</Text>
              <Text style={styles.amountStatValue}>GHS {totalDue}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        {(loan.status === 'active' || loan.status === 'overdue') && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Repayment Progress</Text>
              <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${progress * 100}%`,
                backgroundColor: loan.status === 'overdue' ? Colors.error : Colors.success,
              }]} />
            </View>
            <Text style={styles.progressSub}>Due by {loan.due}</Text>
          </View>
        )}

        {/* Loan Details */}
        <Text style={styles.sectionTitle}>Loan Information</Text>
        <Card>
          {[
            { label: 'Interest Rate', value: loan.interest },
            { label: 'Due Date', value: loan.due },
            { label: 'Date Requested', value: loan.requested },
            { label: 'Purpose', value: 'Business expansion' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i < 3 && styles.rowBorder]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </Card>

        {/* Repayment History */}
        {repaymentHistory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Repayment History</Text>
            <Card>
              {repaymentHistory.map((r, i) => (
                <View key={i} style={[styles.repayRow, i < repaymentHistory.length - 1 && styles.rowBorder]}>
                  <View>
                    <Text style={styles.repayDate}>{r.date}</Text>
                    <Text style={styles.repayMethod}>{r.method} · {r.ref}</Text>
                  </View>
                  <Text style={styles.repayAmount}>GHS {r.amount.toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Record Repayment Form */}
        {showRepayForm && (
          <Card>
            <Text style={styles.repayFormTitle}>Record Repayment</Text>
            <Input
              label="Amount (GHS)"
              placeholder={`Max: GHS ${outstanding.toLocaleString()}`}
              value={repayAmount}
              onChangeText={setRepayAmount}
              keyboardType="decimal-pad"
              leftIcon={<Text style={{ fontSize: 16 }}>💵</Text>}
            />
            <View style={styles.repayBtnRow}>
              <Button
                title="Cancel"
                onPress={() => setShowRepayForm(false)}
                variant="outline"
                size="md"
                fullWidth={false}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                title="Record"
                onPress={handleRepayment}
                loading={repayLoading}
                size="md"
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {loan.status === 'pending' && (
            <Button
              title="Approve Loan"
              onPress={handleApproveLoan}
              size="lg"
              style={{ marginBottom: Spacing.sm }}
            />
          )}
          {(loan.status === 'active' || loan.status === 'overdue') && !showRepayForm && (
            <Button
              title="Record Repayment"
              onPress={() => setShowRepayForm(true)}
              size="lg"
              style={{ marginBottom: Spacing.sm }}
            />
          )}
          {loan.status === 'active' && (
            <Button
              title="Mark as Fully Repaid"
              onPress={() => Alert.alert('Confirm', 'Mark this loan as fully repaid?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => navigation.goBack() },
              ])}
              variant="outline"
              size="md"
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  memberInfo: { flex: 1 },
  memberName: { ...Typography.label, color: Colors.textPrimary },
  memberSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  amountHero: {
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
    alignItems: 'center',
  },
  amountLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  amountValue: { fontSize: 40, fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  amountRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  amountStat: { flex: 1, alignItems: 'center' },
  amountStatLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  amountStatValue: { ...Typography.label, color: Colors.white, marginTop: 2 },
  amountDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressTitle: { ...Typography.label, color: Colors.textPrimary },
  progressPct: { ...Typography.label, color: Colors.success },
  progressBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressSub: { ...Typography.caption, color: Colors.textSecondary },
  sectionTitle: {
    ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { ...Typography.body2, color: Colors.textSecondary },
  infoValue: { ...Typography.label, color: Colors.textPrimary },
  repayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  repayDate: { ...Typography.label, color: Colors.textPrimary },
  repayMethod: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  repayAmount: { ...Typography.label, color: Colors.success },
  repayFormTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  repayBtnRow: { flexDirection: 'row', marginTop: Spacing.sm },
  actions: { marginTop: Spacing.sm },
});

export default LoanDetailScreen;
