import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { contributionService } from '../../services/contributionService';
import { groupService } from '../../services/groupService';

// Only real payment methods — no cash since money goes to the group account
const PAYMENT_METHODS = [
  { key: 'MOBILE_MONEY', label: 'Mobile Money', icon: '📱', refLabel: 'MoMo Reference', refPlaceholder: 'e.g. AB123456789' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦', refLabel: 'Transaction Reference', refPlaceholder: 'e.g. TRX20260627001' },
];

const getCurrentCycle = () => {
  const d = new Date();
  return d.toLocaleString('en-GH', { month: 'long', year: 'numeric' });
};

const MemberPayScreen = ({ navigation, route }) => {
  const { groupId, group: ctxGroup, user } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const prefillCycle = route.params?.cycle || getCurrentCycle();

  const [groupDetails, setGroupDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const [form, setForm] = useState({
    amount:    String(ctxGroup?.contributionAmount || ''),
    cycle:     prefillCycle,
    method:    'MOBILE_MONEY',
    reference: '',
    notes:     '',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load full group details to get MoMo/bank account info
  useEffect(() => {
    (async () => {
      try {
        const g = await groupService.getGroup(groupId);
        setGroupDetails(g);
      } catch (_) {}
      finally { setDetailsLoading(false); }
    })();
  }, [groupId]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const selectedMethod = PAYMENT_METHODS.find(m => m.key === form.method);

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (!form.cycle.trim())
      e.cycle = 'Cycle is required';
    // Reference is always required — it's proof the transfer happened
    if (!form.reference.trim())
      e.reference = `${selectedMethod?.refLabel} is required`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await contributionService.submitPayment(groupId, {
        amount:    Number(form.amount),
        cycle:     form.cycle,
        method:    form.method,
        reference: form.reference.trim(),
        notes:     form.notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2500);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not report payment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payment Reported!</Text>
          <Text style={styles.successSub}>
            GHS {form.amount} for {form.cycle} has been reported.
          </Text>
          <Text style={styles.successNote}>
            The admin will verify your transaction reference and confirm your payment shortly.
            You'll get a notification once it's confirmed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Build account detail lines to display based on selected method
  const momoReady   = groupDetails?.momoNumber;
  const bankReady   = groupDetails?.bankAccount;
  const accountInfo = form.method === 'MOBILE_MONEY'
    ? momoReady
      ? [
          { label: 'Send to (MoMo)', value: groupDetails.momoNumber },
          { label: 'Account Name',   value: groupDetails.momoName || ctxGroup?.name },
        ]
      : null
    : bankReady
      ? [
          { label: 'Bank',           value: groupDetails.bankName },
          { label: 'Account Number', value: groupDetails.bankAccount },
          { label: 'Account Name',   value: groupDetails.bankAccountName || ctxGroup?.name },
        ]
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Report Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Paying-as banner */}
          <View style={styles.memberBanner}>
            <Text style={styles.memberBannerText}>💳 Paying as </Text>
            <Text style={styles.memberBannerName}>{user?.fullName}</Text>
          </View>

          {/* Step 1 — choose method */}
          <Text style={styles.stepLabel}>Step 1 — Choose payment method</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.methodBtn, form.method === key && styles.methodBtnActive]}
                onPress={() => { update('method', key); update('reference', ''); }}
              >
                <Text style={styles.methodIcon}>{icon}</Text>
                <Text style={[styles.methodText, form.method === key && styles.methodTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Step 2 — account details to send to */}
          <Text style={styles.stepLabel}>Step 2 — Send money to this account</Text>
          {detailsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.md }} />
          ) : accountInfo ? (
            <View style={styles.accountCard}>
              {accountInfo.map(({ label, value }, i) => (
                <View key={i} style={[styles.accountRow, i < accountInfo.length - 1 && styles.accountRowBorder]}>
                  <Text style={styles.accountLabel}>{label}</Text>
                  <Text style={styles.accountValue}>{value || '—'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noAccountBox}>
              <Text style={styles.noAccountText}>
                ⚠️ The admin hasn't set up{' '}
                {form.method === 'MOBILE_MONEY' ? 'a MoMo number' : 'bank account details'} yet.
                {'\n'}Contact your group admin for payment details.
              </Text>
            </View>
          )}

          {/* Step 3 — fill in the form */}
          <Text style={styles.stepLabel}>Step 3 — Fill in payment details</Text>
          <View style={styles.form}>
            <Input
              label="Amount (GHS) *"
              placeholder={String(ctxGroup?.contributionAmount || '200')}
              value={form.amount}
              onChangeText={v => update('amount', v)}
              keyboardType="decimal-pad"
              error={errors.amount}
              leftIcon={<Text style={styles.icon}>💰</Text>}
            />

            <Input
              label="Contribution Cycle *"
              placeholder="e.g. July 2026"
              value={form.cycle}
              onChangeText={v => update('cycle', v)}
              error={errors.cycle}
              leftIcon={<Text style={styles.icon}>📅</Text>}
            />

            <Input
              label={`${selectedMethod?.refLabel} *`}
              placeholder={selectedMethod?.refPlaceholder}
              value={form.reference}
              onChangeText={v => update('reference', v.toUpperCase())}
              autoCapitalize="characters"
              error={errors.reference}
              leftIcon={<Text style={styles.icon}>#️⃣</Text>}
            />

            <Input
              label="Notes (optional)"
              placeholder="e.g. sent from Kofi's number"
              value={form.notes}
              onChangeText={v => update('notes', v)}
              multiline
              numberOfLines={2}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📋 The admin will cross-check your reference against the group account statement and confirm your payment.
              </Text>
            </View>

            <Button
              title="Report Payment"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: Colors.textSecondary },
  title: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  memberBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  memberBannerText: { ...Typography.body2, color: Colors.textSecondary },
  memberBannerName: { ...Typography.label, color: Colors.primary },
  stepLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.xs, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 },
  methodRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  methodBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, gap: 4 },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  methodIcon: { fontSize: 28 },
  methodText: { ...Typography.label, color: Colors.textSecondary },
  methodTextActive: { color: Colors.primary },
  accountCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primary + '30', overflow: 'hidden' },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  accountRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  accountLabel: { ...Typography.caption, color: Colors.textSecondary },
  accountValue: { ...Typography.label, color: Colors.textPrimary },
  noAccountBox: { backgroundColor: Colors.warning + '15', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  noAccountText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20 },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  infoBox: { backgroundColor: Colors.info + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.info },
  infoText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { ...Typography.h2, color: Colors.success, marginBottom: Spacing.sm },
  successSub: { ...Typography.body1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  successNote: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

export default MemberPayScreen;
