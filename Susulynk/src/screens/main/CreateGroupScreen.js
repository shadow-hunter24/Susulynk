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
import { groupService } from '../../services/groupService';

const CYCLE_TYPES  = ['Monthly', 'Bi-weekly', 'Weekly'];
const PAYOUT_DAYS  = ['1st', '15th', 'Last day'];
const CURRENCIES   = ['GHS', 'USD', 'GBP'];

const CreateGroupScreen = ({ navigation }) => {
  const { switchGroup, refreshUser } = useAuth();

  const [form, setForm] = useState({
    name:               '',
    description:        '',
    contributionAmount: '200',
    cycleType:          'Monthly',
    payoutDay:          '15th',
    currency:           'GHS',
    interestRate:       '5',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Group name is required';
    if (!form.contributionAmount || isNaN(Number(form.contributionAmount)) || Number(form.contributionAmount) <= 0)
      e.contributionAmount = 'Enter a valid contribution amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const newGroup = await groupService.createGroup({
        name:               form.name.trim(),
        description:        form.description.trim() || undefined,
        contributionAmount: Number(form.contributionAmount),
        cycleType:          form.cycleType,
        payoutDay:          form.payoutDay,
        currency:           form.currency,
        interestRate:       Number(form.interestRate),
      });

      // Switch active group context to the new group — creator is always ADMIN
      await switchGroup(
        { id: newGroup.id, name: newGroup.name, contributionAmount: newGroup.contributionAmount, currency: newGroup.currency },
        'ADMIN',
      );
      await refreshUser();

      Alert.alert('Group Created! 🎉', `"${newGroup.name}" is ready. You've been set as Admin.`, [
        { text: 'Go to Dashboard', onPress: () => navigation.navigate('MainTabs') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconSection}>
            <View style={styles.groupIcon}>
              <Text style={styles.groupIconText}>🏦</Text>
            </View>
            <Text style={styles.subtitle}>Set up your Susu group</Text>
          </View>

          {/* Group Identity */}
          <Text style={styles.sectionLabel}>Group Identity</Text>
          <View style={styles.card}>
            <Input
              label="Group Name *"
              placeholder="e.g. Accra Women Susu"
              value={form.name}
              onChangeText={(v) => update('name', v)}
              error={errors.name}
              leftIcon={<Text style={styles.icon}>🏦</Text>}
            />
            <Input
              label="Description (optional)"
              placeholder="What is this group about?"
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Contribution Settings */}
          <Text style={styles.sectionLabel}>Contribution Settings</Text>
          <View style={styles.card}>
            <Input
              label="Contribution Amount *"
              placeholder="e.g. 200"
              value={form.contributionAmount}
              onChangeText={(v) => update('contributionAmount', v)}
              keyboardType="decimal-pad"
              error={errors.contributionAmount}
              leftIcon={<Text style={styles.icon}>💰</Text>}
            />

            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.optionRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.optionBtn, form.currency === c && styles.optionBtnActive]}
                  onPress={() => update('currency', c)}
                >
                  <Text style={[styles.optionText, form.currency === c && styles.optionTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Contribution Cycle</Text>
            <View style={styles.optionRow}>
              {CYCLE_TYPES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.optionBtn, form.cycleType === c && styles.optionBtnActive]}
                  onPress={() => update('cycleType', c)}
                >
                  <Text style={[styles.optionText, form.cycleType === c && styles.optionTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payout Settings */}
          <Text style={styles.sectionLabel}>Payout Settings</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Payout Day</Text>
            <View style={styles.optionRow}>
              {PAYOUT_DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.optionBtn, form.payoutDay === d && styles.optionBtnActive]}
                  onPress={() => update('payoutDay', d)}
                >
                  <Text style={[styles.optionText, form.payoutDay === d && styles.optionTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Loan Interest Rate (%)"
              placeholder="e.g. 5"
              value={form.interestRate}
              onChangeText={(v) => update('interestRate', v)}
              keyboardType="decimal-pad"
              leftIcon={<Text style={styles.icon}>📈</Text>}
            />
          </View>

          {/* Summary preview */}
          {form.name.trim() !== '' && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Preview</Text>
              {[
                ['Group', form.name],
                ['Contribution', `${form.currency} ${form.contributionAmount} / ${form.cycleType.toLowerCase()}`],
                ['Payout Day', `${form.payoutDay} of the month`],
                ['Interest Rate', `${form.interestRate}%`],
              ].map(([label, value], i) => (
                <View key={i} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{label}</Text>
                  <Text style={styles.previewValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          <Button
            title="Create Group"
            onPress={handleCreate}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="md"
            style={{ marginTop: Spacing.xs }}
          />

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  iconSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  groupIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  groupIconText: { fontSize: 40 },
  subtitle: { ...Typography.body2, color: Colors.textSecondary },
  sectionLabel: {
    ...Typography.label, color: Colors.textSecondary,
    marginBottom: Spacing.sm, marginTop: Spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  icon: { fontSize: 16 },
  fieldLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  optionBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 4,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText: { ...Typography.label, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary },
  preview: {
    backgroundColor: Colors.primary + '08', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  previewTitle: { ...Typography.label, color: Colors.primary, marginBottom: Spacing.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  previewLabel: { ...Typography.body2, color: Colors.textSecondary },
  previewValue: { ...Typography.label, color: Colors.textPrimary },
});

export default CreateGroupScreen;
