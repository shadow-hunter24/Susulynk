import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { loanService } from '../../services/loanService';

const DURATIONS = [
  { label: '1 month',  value: 1 },
  { label: '2 months', value: 2 },
  { label: '3 months', value: 3 },
  { label: '6 months', value: 6 },
];

const MyLoanRequestScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const { groupId, group, user } = useAuth();

  const [form, setForm]     = useState({ amount: '', duration: 3, purpose: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const interestRate = group?.interestRate || 5;
  const principal    = Number(form.amount) || 0;
  const interest     = parseFloat((principal * interestRate / 100).toFixed(2));
  const totalDue     = parseFloat((principal * (1 + interestRate / 100)).toFixed(2));

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(principal) || principal < 50) e.amount = 'Minimum loan amount is GHS 50';
    if (!form.purpose.trim()) e.purpose = 'Please state the purpose of the loan';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await loanService.requestLoan(groupId, { amount: principal, duration: form.duration, purpose: form.purpose, notes: form.notes || undefined });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2500);
    } catch (err) { Alert.alert('Error', err.message || 'Could not submit loan request'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successSub}>Your GHS {form.amount} loan request has been submitted to the group admin.</Text>
          <Text style={styles.successNote}>You'll receive a notification once the admin reviews your request.</Text>
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
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Request a Loan</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.memberBanner}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.secondary} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.memberBannerText}>Requesting as </Text>
            <Text style={styles.memberBannerName}>{user?.fullName}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Loan Amount (GHS) *"
              placeholder="e.g. 500 (min GHS 50)"
              value={form.amount}
              onChangeText={v => update('amount', v)}
              keyboardType="decimal-pad"
              error={errors.amount}
            />

            <Text style={styles.sectionLabel}>Repayment Period</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.durationBtn, form.duration === value && styles.durationBtnActive]}
                  onPress={() => update('duration', value)}
                >
                  <Text style={[styles.durationText, form.duration === value && styles.durationTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Purpose *"
              placeholder="e.g. Business, medical expenses, school fees..."
              value={form.purpose}
              onChangeText={v => update('purpose', v)}
              error={errors.purpose}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Additional Notes (optional)"
              placeholder="Any extra info for the admin..."
              value={form.notes}
              onChangeText={v => update('notes', v)}
              multiline
              numberOfLines={2}
            />

            {principal >= 50 && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Loan Summary</Text>
                {[
                  ['Principal',                `GHS ${principal.toLocaleString()}`],
                  [`Interest (${interestRate}%)`, `GHS ${interest.toLocaleString()}`],
                  ['Repayment Period',          `${form.duration} month${form.duration > 1 ? 's' : ''}`],
                ].map(([label, value], i) => (
                  <View key={i} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{value}</Text>
                  </View>
                ))}
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total to Repay</Text>
                  <Text style={styles.summaryTotalValue}>GHS {totalDue.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.info} style={{ marginRight: 6 }} />
              <Text style={styles.infoText}>Your request will be reviewed by the group admin. Interest rate is {interestRate}%.</Text>
            </View>

            <Button title="Submit Loan Request" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: Spacing.sm }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  handle:            { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title:             { ...Typography.h4, color: Colors.textPrimary },
  container:         { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  memberBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondary + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  memberBannerText:  { ...Typography.body2, color: Colors.textSecondary },
  memberBannerName:  { ...Typography.label, color: Colors.secondary },
  form:              { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  sectionLabel:      { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  durationRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  durationBtn:       { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  durationBtnActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '10' },
  durationText:      { ...Typography.label, color: Colors.textSecondary },
  durationTextActive:{ color: Colors.secondary },
  summary:           { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  summaryTitle:      { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryTotal:      { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  summaryLabel:      { ...Typography.body2, color: Colors.textSecondary },
  summaryValue:      { ...Typography.label, color: Colors.textPrimary },
  summaryTotalLabel: { ...Typography.label, color: Colors.textPrimary, fontWeight: '700' },
  summaryTotalValue: { ...Typography.h4, color: Colors.secondary },
  infoBox:           { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.info + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.info },
  infoText:          { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18, flex: 1 },
  successScreen:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIconBox:    { marginBottom: Spacing.lg },
  successTitle:      { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.sm },
  successSub:        { ...Typography.body1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  successNote:       { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});

export default MyLoanRequestScreen;
