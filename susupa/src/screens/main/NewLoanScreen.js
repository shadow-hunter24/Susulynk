import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const MEMBERS = [
  { id: '1', name: 'Ama Owusu', initials: 'AO', savings: 'GHS 2,400' },
  { id: '2', name: 'Kwame Asante', initials: 'KA', savings: 'GHS 1,800' },
  { id: '3', name: 'Abena Sarpong', initials: 'AS', savings: 'GHS 2,200' },
  { id: '4', name: 'Yaw Darko', initials: 'YD', savings: 'GHS 600' },
  { id: '5', name: 'Akosua Mensah', initials: 'AM', savings: 'GHS 2,000' },
];

const DURATIONS = ['1 month', '2 months', '3 months', '6 months'];
const INTEREST_RATES = ['5%', '10%', '15%'];

const NewLoanScreen = ({ navigation }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({
    amount: '', duration: '3 months', interestRate: '5%', purpose: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const totalRepayable = form.amount
    ? (Number(form.amount) * (1 + parseFloat(form.interestRate) / 100)).toFixed(2)
    : '0.00';

  const validate = () => {
    const e = {};
    if (!selectedMember) e.member = 'Please select a member';
    if (!form.amount || isNaN(Number(form.amount))) e.amount = 'Enter a valid loan amount';
    else if (Number(form.amount) < 50) e.amount = 'Minimum loan amount is GHS 50';
    if (!form.purpose.trim()) e.purpose = 'Please state the loan purpose';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2200);
    }, 1400);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>🤝</Text>
          <Text style={styles.successTitle}>Loan Approved!</Text>
          <Text style={styles.successSub}>
            GHS {form.amount} loan for {selectedMember?.name}
          </Text>
          <Text style={styles.successNote}>Total repayable: GHS {totalRepayable}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Loan</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Member Selection */}
          <Text style={styles.sectionLabel}>Select Borrower *</Text>
          {errors.member && <Text style={styles.errorText}>{errors.member}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll} contentContainerStyle={styles.memberRow}>
            {MEMBERS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberChip, selectedMember?.id === m.id && styles.memberChipActive]}
                onPress={() => setSelectedMember(m)}
              >
                <View style={styles.chipAvatar}>
                  <Text style={styles.chipAvatarText}>{m.initials}</Text>
                </View>
                <Text style={[styles.chipName, selectedMember?.id === m.id && styles.chipNameActive]}>
                  {m.name.split(' ')[0]}
                </Text>
                <Text style={[styles.chipSavings, selectedMember?.id === m.id && { color: 'rgba(255,255,255,0.8)' }]}>
                  {m.savings}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.form}>
            <Input
              label="Loan Amount (GHS) *"
              placeholder="e.g. 500"
              value={form.amount}
              onChangeText={(v) => update('amount', v)}
              keyboardType="decimal-pad"
              error={errors.amount}
              leftIcon={<Text style={styles.icon}>💸</Text>}
            />

            {/* Duration */}
            <Text style={styles.sectionLabel}>Repayment Period</Text>
            <View style={styles.optionGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.optionBtn, form.duration === d && styles.optionBtnActive]}
                  onPress={() => update('duration', d)}
                >
                  <Text style={[styles.optionText, form.duration === d && styles.optionTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interest Rate */}
            <Text style={styles.sectionLabel}>Interest Rate</Text>
            <View style={styles.rateRow}>
              {INTEREST_RATES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rateBtn, form.interestRate === r && styles.rateBtnActive]}
                  onPress={() => update('interestRate', r)}
                >
                  <Text style={[styles.rateText, form.interestRate === r && styles.rateTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Purpose *"
              placeholder="e.g. Business expansion, medical expenses..."
              value={form.purpose}
              onChangeText={(v) => update('purpose', v)}
              error={errors.purpose}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Additional Notes (optional)"
              placeholder="Any collateral or special conditions..."
              value={form.notes}
              onChangeText={(v) => update('notes', v)}
              multiline
              numberOfLines={2}
            />

            {/* Loan Summary */}
            {form.amount && selectedMember && (
              <View style={styles.loanSummary}>
                <Text style={styles.summaryTitle}>Loan Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Borrower</Text>
                  <Text style={styles.summaryValue}>{selectedMember.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Principal</Text>
                  <Text style={styles.summaryValue}>GHS {Number(form.amount).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Interest ({form.interestRate})</Text>
                  <Text style={styles.summaryValue}>
                    GHS {(Number(form.amount) * parseFloat(form.interestRate) / 100).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={[styles.summaryLabel, { fontWeight: '700', color: Colors.textPrimary }]}>Total Repayable</Text>
                  <Text style={[styles.summaryValue, { color: Colors.primary, fontSize: 16 }]}>GHS {totalRepayable}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{form.duration}</Text>
                </View>
              </View>
            )}

            <Button
              title="Approve Loan"
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
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: Colors.textSecondary },
  title: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  sectionLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.xs },
  memberScroll: { marginBottom: Spacing.lg },
  memberRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  memberChip: {
    alignItems: 'center', paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, minWidth: 80,
  },
  memberChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  chipAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.secondary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  chipAvatarText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  chipName: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  chipNameActive: { color: Colors.white },
  chipSavings: { ...Typography.caption, color: Colors.textMuted, fontSize: 10 },
  form: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  icon: { fontSize: 16 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  optionBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText: { ...Typography.label, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary },
  rateRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  rateBtn: {
    flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  rateBtnActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '10' },
  rateText: { ...Typography.label, color: Colors.textSecondary },
  rateTextActive: { color: Colors.secondary },
  loanSummary: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  summaryTitle: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryTotal: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.sm, marginTop: Spacing.xs,
  },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.label, color: Colors.textPrimary },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.sm },
  successSub: { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center' },
  successNote: { ...Typography.label, color: Colors.secondary, marginTop: Spacing.sm },
});

export default NewLoanScreen;
