import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';
import { contributionService } from '../../services/contributionService';

const PAYMENT_METHODS = [
  { key: 'MOBILE_MONEY',  label: 'Mobile Money',  icon: 'phone-portrait-outline', refLabel: 'MoMo Reference' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer',  icon: 'business-outline',       refLabel: 'Transaction Reference' },
];

const getCurrentCycle = () => new Date().toLocaleString('en-GH', { month: 'long', year: 'numeric' });

const AddContributionScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const { groupId, group } = useAuth();

  const [members, setMembers]               = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({ amount: String(group?.contributionAmount || '200'), method: 'MOBILE_MONEY', reference: '', notes: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cycle = getCurrentCycle();

  useEffect(() => {
    (async () => {
      try { const data = await memberService.getMembers(groupId, { status: 'ACTIVE' }); setMembers(data); }
      catch (_) {}
      finally { setMembersLoading(false); }
    })();
  }, [groupId]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const selectedMethod = PAYMENT_METHODS.find(m => m.key === form.method);

  const validate = () => {
    const e = {};
    if (!selectedMember) e.member = 'Please select a member';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.reference.trim()) e.reference = `${selectedMethod?.refLabel} is required`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await contributionService.recordContribution(groupId, {
        memberId: selectedMember.id, amount: Number(form.amount), cycle,
        method: form.method, reference: form.reference.trim(), notes: form.notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 2000);
    } catch (err) { Alert.alert('Error', err.message || 'Could not record contribution'); }
    finally { setLoading(false); }
  };

  const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Contribution Recorded!</Text>
          <Text style={styles.successSub}>GHS {form.amount} recorded as PAID for {selectedMember?.user?.fullName}</Text>
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
          <Text style={styles.title}>Record Contribution</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.infoBannerText}>Use this to record a payment you've already verified in the group account. Marked as Paid immediately.</Text>
          </View>

          <Text style={styles.sectionLabel}>Select Member *</Text>
          {errors.member && <Text style={styles.errorText}>{errors.member}</Text>}
          {membersLoading ? <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.lg }} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll} contentContainerStyle={styles.memberRow}>
              {members.map((m) => (
                <TouchableOpacity key={m.id}
                  style={[styles.memberChip, selectedMember?.id === m.id && styles.memberChipActive]}
                  onPress={() => setSelectedMember(m)}>
                  <View style={[styles.chipAvatar, selectedMember?.id === m.id && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
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
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(({ key, label, icon }) => (
                <TouchableOpacity key={key}
                  style={[styles.methodBtn, form.method === key && styles.methodBtnActive]}
                  onPress={() => { update('method', key); update('reference', ''); }}>
                  <Ionicons name={icon} size={22} color={form.method === key ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.methodText, form.method === key && styles.methodTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Amount (GHS) *" placeholder={String(group?.contributionAmount || '200')}
              value={form.amount} onChangeText={v => update('amount', v)} keyboardType="decimal-pad" error={errors.amount} />
            <Input label={`${selectedMethod?.refLabel} *`} placeholder="From the group account statement"
              value={form.reference} onChangeText={v => update('reference', v.toUpperCase())} autoCapitalize="characters" error={errors.reference} />
            <Input label="Notes (optional)" placeholder="e.g. early payment, partial payment..."
              value={form.notes} onChangeText={v => update('notes', v)} multiline numberOfLines={2} />

            {selectedMember && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Summary</Text>
                {[['Member', selectedMember.user?.fullName], ['Cycle', cycle], ['Amount', `GHS ${form.amount || '0'}`], ['Method', PAYMENT_METHODS.find(m => m.key === form.method)?.label], ['Status', 'Will be marked PAID']].map(([label, value], i) => (
                  <View key={i} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={[styles.summaryValue, label === 'Status' && { color: Colors.success }]}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            <Button title="Record as Paid" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: Spacing.sm }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  handle:          { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title:           { ...Typography.h4, color: Colors.textPrimary },
  container:       { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  infoBanner:      { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.info + '15', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.info },
  infoBannerText:  { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
  sectionLabel:    { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  errorText:       { ...Typography.caption, color: Colors.error, marginBottom: Spacing.xs },
  memberScroll:    { marginBottom: Spacing.lg },
  memberRow:       { gap: Spacing.sm, paddingRight: Spacing.lg },
  memberChip:      { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, minWidth: 72 },
  memberChipActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipAvatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  chipAvatarText:  { fontSize: 12, fontWeight: '700', color: Colors.primary },
  chipName:        { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  chipNameActive:  { color: Colors.white },
  form:            { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  methodRow:       { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  methodBtn:       { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 4, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  methodText:      { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  methodTextActive:{ color: Colors.primary },
  summary:         { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  summaryTitle:    { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel:    { ...Typography.body2, color: Colors.textSecondary },
  summaryValue:    { ...Typography.label, color: Colors.textPrimary },
  successScreen:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIconBox:  { marginBottom: Spacing.lg },
  successTitle:    { ...Typography.h2, color: Colors.success, marginBottom: Spacing.sm },
  successSub:      { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center' },
});

export default AddContributionScreen;
