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
import { memberService } from '../../services/memberService';
import { loanService } from '../../services/loanService';

const DURATIONS = ['1 month', '2 months', '3 months', '6 months'];
const RATES     = ['5', '10', '15'];

const NewLoanScreen = ({ navigation }) => {
  const { groupId } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const [members, setMembers]           = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm]   = useState({ amount: '', duration: '3 months', interestRate: '5', purpose: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await memberService.getMembers(groupId, { status: 'ACTIVE' });
        setMembers(data);
      } catch (_) {}
      finally { setMembersLoading(false); }
    })();
  }, [groupId]);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const totalRepayable = form.amount
    ? (Number(form.amount) * (1 + Number(form.interestRate) / 100)).toFixed(2)
    : '0.00';

  const validate = () => {
    const e = {};
    if (!selectedMember) e.member = 'Please select a borrower';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 50) e.amount = 'Minimum loan amount is GHS 50';
    if (!form.purpose.trim()) e.purpose = 'Please state the loan purpose';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Calculate due date from duration
      const months = parseInt(form.duration);
      const due = new Date();
      due.setMonth(due.getMonth() + months);

      await loanService.createLoan(groupId, {
        memberId:     selectedMember.id,
        amount:       Number(form.amount),
        interestRate: Number(form.interestRate),
        purpose:      form.purpose,
        notes:        form.notes || undefined,
        dueDate:      due.toISOString(),
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2200);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create loan');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>🤝</Text>
          <Text style={styles.successTitle}>Loan Created!</Text>
          <Text style={styles.successSub}>GHS {form.amount} loan for {selectedMember?.user?.fullName}</Text>
          <Text style={styles.successNote}>Total repayable: GHS {totalRepayable}</Text>
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
          <Text style={styles.title}>New Loan</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Select Borrower *</Text>
          {errors.member && <Text style={styles.errorText}>{errors.member}</Text>}

          {membersLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll} contentContainerStyle={styles.memberRow}>
              {members.map((m) => (
                <TouchableOpacity key={m.id}
                  style={[styles.memberChip, selectedMember?.id === m.id && styles.memberChipActive]}
                  onPress={() => setSelectedMember(m)}>
                  <View style={styles.chipAvatar}>
                    <Text style={styles.chipAvatarText}>{getInitials(m.user?.fullName)}</Text>
                  </View>
                  <Text style={[styles.chipName, selectedMember?.id === m.id && styles.chipNameActive]}>
                    {m.user?.fullName?.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.form}>
            <Input label="Loan Amount (GHS) *" placeholder="e.g. 500" value={form.amount}
              onChangeText={(v) => update('amount', v)} keyboardType="decimal-pad"
              error={errors.amount} leftIcon={<Text style={styles.icon}>💸</Text>} />

            <Text style={styles.sectionLabel}>Repayment Period</Text>
            <View style={styles.optionGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity key={d}
                  style={[styles.optionBtn, form.duration === d && styles.optionBtnActive]}
                  onPress={() => update('duration', d)}>
                  <Text style={[styles.optionText, form.duration === d && styles.optionTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Interest Rate</Text>
            <View style={styles.rateRow}>
              {RATES.map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.rateBtn, form.interestRate === r && styles.rateBtnActive]}
                  onPress={() => update('interestRate', r)}>
                  <Text style={[styles.rateText, form.interestRate === r && styles.rateTextActive]}>{r}%</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Purpose *" placeholder="e.g. Business expansion, medical..." value={form.purpose}
              onChangeText={(v) => update('purpose', v)} error={errors.purpose} multiline numberOfLines={2} />
            <Input label="Notes (optional)" placeholder="Any collateral or special conditions..." value={form.notes}
              onChangeText={(v) => update('notes', v)} multiline numberOfLines={2} />

            {form.amount && selectedMember && (
              <View style={styles.loanSummary}>
                <Text style={styles.summaryTitle}>Loan Summary</Text>
                {[
                  ['Borrower',  selectedMember.user?.fullName],
                  ['Principal', `GHS ${Number(form.amount).toLocaleString()}`],
                  [`Interest (${form.interestRate}%)`, `GHS ${(Number(form.amount) * Number(form.interestRate) / 100).toFixed(2)}`],
                  ['Duration',  form.duration],
                ].map(([label, value], i) => (
                  <View key={i} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{value}</Text>
                  </View>
                ))}
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={[styles.summaryLabel, { fontWeight: '700', color: Colors.textPrimary }]}>Total Repayable</Text>
                  <Text style={[styles.summaryValue, { color: Colors.primary, fontSize: 16 }]}>GHS {totalRepayable}</Text>
                </View>
              </View>
            )}

            <Button title="Create Loan" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: Spacing.sm }} />
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
  sectionLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.xs },
  memberScroll: { marginBottom: Spacing.lg },
  memberRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  memberChip: { alignItems: 'center', paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, minWidth: 80 },
  memberChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  chipAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  chipAvatarText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  chipName: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  chipNameActive: { color: Colors.white },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  optionBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText: { ...Typography.label, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary },
  rateRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  rateBtn: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  rateBtnActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '10' },
  rateText: { ...Typography.label, color: Colors.textSecondary },
  rateTextActive: { color: Colors.secondary },
  loanSummary: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  summaryTitle: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.label, color: Colors.textPrimary },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.sm },
  successSub: { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center' },
  successNote: { ...Typography.label, color: Colors.secondary, marginTop: Spacing.sm },
});

export default NewLoanScreen;
