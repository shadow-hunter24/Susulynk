import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { contributionService } from '../../services/contributionService';

const PAYMENT_METHODS = [
  { key: 'MOBILE_MONEY', label: 'Mobile Money', icon: '📱' },
  { key: 'CASH',         label: 'Cash',         icon: '💵' },
  { key: 'BANK_TRANSFER',label: 'Bank Transfer', icon: '🏦' },
];

const getCurrentCycle = () => {
  const d = new Date();
  return d.toLocaleString('en-GH', { month: 'long', year: 'numeric' });
};

const MemberPayScreen = ({ navigation, route }) => {
  const { groupId, group, user } = useAuth();
  const prefillCycle = route.params?.cycle || getCurrentCycle();

  const [form, setForm] = useState({
    amount:    String(group?.contributionAmount || ''),
    cycle:     prefillCycle,
    method:    'MOBILE_MONEY',
    reference: '',
    notes:     '',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (!form.cycle.trim())
      e.cycle = 'Cycle is required';
    if (form.method === 'MOBILE_MONEY' && !form.reference.trim())
      e.reference = 'Please enter your MoMo reference number';
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
        reference: form.reference || undefined,
        notes:     form.notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2500);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit payment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payment Submitted!</Text>
          <Text style={styles.successSub}>
            Your GHS {form.amount} payment for {form.cycle} has been submitted.
          </Text>
          <Text style={styles.successNote}>
            The admin will confirm your payment shortly. You'll receive a notification once confirmed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Submit Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Who is paying */}
          <View style={styles.memberBanner}>
            <Text style={styles.memberBannerText}>💳 Paying as </Text>
            <Text style={styles.memberBannerName}>{user?.fullName}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Amount (GHS) *"
              placeholder={String(group?.contributionAmount || '200')}
              value={form.amount}
              onChangeText={v => update('amount', v)}
              keyboardType="decimal-pad"
              error={errors.amount}
              leftIcon={<Text style={styles.icon}>💰</Text>}
            />

            <Input
              label="Contribution Cycle *"
              placeholder="e.g. June 2026"
              value={form.cycle}
              onChangeText={v => update('cycle', v)}
              error={errors.cycle}
              leftIcon={<Text style={styles.icon}>📅</Text>}
            />

            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(({ key, label, icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.methodBtn, form.method === key && styles.methodBtnActive]}
                  onPress={() => update('method', key)}
                >
                  <Text style={[styles.methodText, form.method === key && styles.methodTextActive]}>
                    {icon} {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.method === 'MOBILE_MONEY' && (
              <Input
                label="MoMo Reference Number *"
                placeholder="e.g. AB123456789"
                value={form.reference}
                onChangeText={v => update('reference', v.toUpperCase())}
                autoCapitalize="characters"
                error={errors.reference}
                leftIcon={<Text style={styles.icon}>#️⃣</Text>}
              />
            )}
            {form.method === 'BANK_TRANSFER' && (
              <Input
                label="Transaction Reference *"
                placeholder="e.g. TRX20260627001"
                value={form.reference}
                onChangeText={v => update('reference', v.toUpperCase())}
                autoCapitalize="characters"
                error={errors.reference}
                leftIcon={<Text style={styles.icon}>#️⃣</Text>}
              />
            )}

            <Input
              label="Notes (optional)"
              placeholder="Any additional info for the admin..."
              value={form.notes}
              onChangeText={v => update('notes', v)}
              multiline
              numberOfLines={2}
            />

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📋 Your payment will be reviewed by the group admin. You'll be notified once it's confirmed.
              </Text>
            </View>

            <Button
              title="Submit Payment"
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: Colors.textSecondary },
  title: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  memberBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  memberBannerText: { ...Typography.body2, color: Colors.textSecondary },
  memberBannerName: { ...Typography.label, color: Colors.primary },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  sectionLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  methodRow: { gap: Spacing.sm, marginBottom: Spacing.md },
  methodBtn: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  methodText: { ...Typography.label, color: Colors.textSecondary },
  methodTextActive: { color: Colors.primary },
  infoBox: { backgroundColor: Colors.info + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.info },
  infoText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { ...Typography.h2, color: Colors.success, marginBottom: Spacing.sm },
  successSub: { ...Typography.body1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  successNote: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});

export default MemberPayScreen;
