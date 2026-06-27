import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';
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

const AddContributionScreen = ({ navigation }) => {
  const { groupId } = useAuth();
  const [members, setMembers]         = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm]   = useState({ amount: '200', method: 'MOBILE_MONEY', reference: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cycle = getCurrentCycle();

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

  const validate = () => {
    const e = {};
    if (!selectedMember) e.member = 'Please select a member';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await contributionService.recordContribution(groupId, {
        memberId:  selectedMember.id,
        amount:    Number(form.amount),
        cycle,
        method:    form.method,
        reference: form.reference || undefined,
        notes:     form.notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2000);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not record contribution');
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
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Contribution Recorded!</Text>
          <Text style={styles.successSub}>
            GHS {form.amount} recorded for {selectedMember?.user?.fullName}
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
          <Text style={styles.title}>Record Contribution</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Select Member *</Text>
          {errors.member && <Text style={styles.errorText}>{errors.member}</Text>}

          {membersLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll} contentContainerStyle={styles.memberRow}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, selectedMember?.id === m.id && styles.memberChipActive]}
                  onPress={() => setSelectedMember(m)}
                >
                  <View style={styles.chipAvatar}>
                    <Text style={[styles.chipAvatarText, selectedMember?.id === m.id && { color: Colors.white }]}>
                      {getInitials(m.user?.fullName)}
                    </Text>
                  </View>
                  <Text style={[styles.chipName, selectedMember?.id === m.id && styles.chipNameActive]}>
                    {m.user?.fullName?.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.form}>
            <Input label="Amount (GHS) *" placeholder="200" value={form.amount}
              onChangeText={(v) => update('amount', v)} keyboardType="decimal-pad"
              error={errors.amount} leftIcon={<Text style={styles.icon}>💰</Text>} />

            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(({ key, label, icon }) => (
                <TouchableOpacity key={key}
                  style={[styles.methodBtn, form.method === key && styles.methodBtnActive]}
                  onPress={() => update('method', key)}>
                  <Text style={[styles.methodText, form.method === key && styles.methodTextActive]}>
                    {icon} {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Reference (optional)" placeholder="e.g. MOMO1234XYZ" value={form.reference}
              onChangeText={(v) => update('reference', v)} autoCapitalize="characters"
              leftIcon={<Text style={styles.icon}>#️⃣</Text>} />
            <Input label="Notes (optional)" placeholder="Any additional notes..." value={form.notes}
              onChangeText={(v) => update('notes', v)} multiline numberOfLines={3} />

            {selectedMember && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Summary</Text>
                {[
                  ['Member', selectedMember.user?.fullName],
                  ['Amount', `GHS ${form.amount || '0'}`],
                  ['Method', PAYMENT_METHODS.find(m => m.key === form.method)?.label],
                  ['Cycle',  cycle],
                ].map(([label, value], i) => (
                  <View key={i} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={[styles.summaryValue, label === 'Amount' && { color: Colors.success }]}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            <Button title="Record Contribution" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: Spacing.sm }} />
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
  sectionLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.xs },
  memberScroll: { marginBottom: Spacing.lg },
  memberRow: { gap: Spacing.sm, paddingRight: Spacing.lg },
  memberChip: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, minWidth: 72 },
  memberChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  chipAvatarText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  chipName: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  chipNameActive: { color: Colors.white },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  methodRow: { gap: Spacing.sm, marginBottom: Spacing.md },
  methodBtn: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  methodText: { ...Typography.label, color: Colors.textSecondary },
  methodTextActive: { color: Colors.primary },
  summary: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  summaryTitle: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { ...Typography.body2, color: Colors.textSecondary },
  summaryValue: { ...Typography.label, color: Colors.textPrimary },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { ...Typography.h2, color: Colors.success, marginBottom: Spacing.sm },
  successSub: { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center' },
});

export default AddContributionScreen;
