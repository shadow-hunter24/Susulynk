import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';

const CYCLE_TYPES = [
  { label: 'Weekly',         value: 'Weekly',         desc: 'Every 7 days' },
  { label: 'Bi-weekly',      value: 'Bi-weekly',      desc: 'Every 2 weeks' },
  { label: 'Monthly',        value: 'Monthly',        desc: 'Once a month' },
  { label: 'Every 2 Months', value: 'Every 2 Months', desc: 'Every 2 months' },
];
const PAYOUT_DAYS = ['1st', '15th', 'Last day'];

const GroupSettingsScreen = ({ navigation }) => {
  const { groupId, group: ctxGroup, switchGroup, isAdmin } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [draft,   setDraft]   = useState(null);
  const [dirty,   setDirty]   = useState(false); // track unsaved changes

  useEffect(() => {
    (async () => {
      try {
        const g = await groupService.getGroup(groupId);
        setDraft({
          groupName:          g.name,
          description:        g.description || '',
          contributionAmount: String(g.contributionAmount),
          payoutDay:          g.payoutDay,
          cycleType:          g.cycleType,
          interestRate:       String(g.interestRate),
          allowLoans:         g.allowLoans,
          requireApproval:    g.requireApproval,
          autoReminders:      g.autoReminders,
          momoNumber:         g.momoNumber || '',
          momoName:           g.momoName || '',
          bankAccount:        g.bankAccount || '',
          bankName:           g.bankName || '',
          bankAccountName:    g.bankAccountName || '',
        });
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, [groupId]);

  const update = (field, value) => {
    setDraft(d => ({ ...d, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft.groupName.trim()) { Alert.alert('Validation', 'Group name cannot be empty.'); return; }
    setSaving(true);
    try {
      await groupService.updateGroup(groupId, {
        name:               draft.groupName,
        description:        draft.description,
        contributionAmount: Number(draft.contributionAmount),
        cycleType:          draft.cycleType,
        payoutDay:          draft.payoutDay,
        interestRate:       Number(draft.interestRate),
        allowLoans:         draft.allowLoans,
        requireApproval:    draft.requireApproval,
        autoReminders:      draft.autoReminders,
        momoNumber:         draft.momoNumber || null,
        momoName:           draft.momoName || null,
        bankAccount:        draft.bankAccount || null,
        bankName:           draft.bankName || null,
        bankAccountName:    draft.bankAccountName || null,
      });
      await switchGroup(
        { ...ctxGroup, name: draft.groupName, contributionAmount: Number(draft.contributionAmount) },
        undefined,
      );
      setDirty(false);
      Alert.alert('Saved', 'Group settings updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Group', `Are you sure you want to leave "${draft?.groupName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        try {
          await groupService.leaveGroup(groupId);
          await switchGroup({ id: null, name: null }, 'MEMBER');
          navigation.reset({ index: 0, routes: [{ name: 'MyGroups' }] });
        } catch (err) { Alert.alert('Cannot Leave', err.message); }
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Group', `This will PERMANENTLY delete "${draft?.groupName}" and all its data. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Forever', style: 'destructive', onPress: () => {
        Alert.alert('Are you absolutely sure?', 'All contributions, loans and member records will be lost.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Delete', style: 'destructive', onPress: async () => {
            try {
              await groupService.deleteGroup(groupId);
              await switchGroup({ id: null, name: null }, 'MEMBER');
              navigation.reset({ index: 0, routes: [{ name: 'MyGroups' }] });
            } catch (err) { Alert.alert('Error', err.message); }
          }},
        ]);
      }},
    ]);
  };

  if (loading || !draft) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color={Colors.primary} style={{ flex: 1 }} /></SafeAreaView>;
  }

  // ── Section label component ──────────────────────────
  const SectionTitle = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  // ── Read-only row for non-admins ──────────────────────
  const InfoRow = ({ iconName, label, value, isLast }) => (
    <View style={[styles.infoRow, !isLast && styles.rowBorder]}>
      <View style={styles.iconBox}>
        <Ionicons name={iconName} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Unsaved changes banner */}
      {dirty && isAdmin && (
        <View style={styles.dirtyBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
          <Text style={styles.dirtyText}>You have unsaved changes</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Group Identity ── */}
        <SectionTitle title="Group Identity" />
        <Card>
          <Input
            label="Group Name"
            value={draft.groupName}
            onChangeText={v => update('groupName', v)}
            editable={isAdmin}
          />
          <Input
            label="Description (optional)"
            placeholder="What is this group about?"
            value={draft.description}
            onChangeText={v => update('description', v)}
            multiline
            numberOfLines={3}
            editable={isAdmin}
          />
        </Card>

        {/* ── Contribution Settings ── */}
        <SectionTitle title="Contribution Settings" />
        <Card>
          <Input
            label="Contribution Amount (GHS)"
            value={draft.contributionAmount}
            onChangeText={v => update('contributionAmount', v)}
            keyboardType="decimal-pad"
            editable={isAdmin}
            hint={draft.contributionAmount ? `Each member pays GHS ${draft.contributionAmount} per cycle` : undefined}
          />
          <Text style={styles.fieldLabel}>Contribution Cycle</Text>
          <Text style={styles.fieldHint}>How often do members make contributions?</Text>
          <View style={styles.cycleGrid}>
            {CYCLE_TYPES.map(({ label, value, desc }) => (
              <TouchableOpacity
                key={value}
                style={[styles.cycleBtn, draft.cycleType === value && styles.cycleBtnActive]}
                onPress={() => isAdmin && update('cycleType', value)}
                activeOpacity={isAdmin ? 0.8 : 1}
              >
                <Text style={[styles.cycleBtnLabel, draft.cycleType === value && styles.cycleBtnLabelActive]}>
                  {label}
                </Text>
                <Text style={[styles.cycleBtnDesc, draft.cycleType === value && styles.cycleBtnDescActive]}>
                  {desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Payout Settings ── */}
        <SectionTitle title="Payout Settings" />
        <Card>
          <Text style={styles.fieldLabel}>Payout Day</Text>
          <Text style={styles.fieldHint}>Which day of the month does the payout happen?</Text>
          <View style={styles.optionRow}>
            {PAYOUT_DAYS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.optionBtn, draft.payoutDay === d && styles.optionBtnActive]}
                onPress={() => isAdmin && update('payoutDay', d)}
                activeOpacity={isAdmin ? 0.8 : 1}
              >
                <Text style={[styles.optionText, draft.payoutDay === d && styles.optionTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Loan Interest Rate (%)"
            value={draft.interestRate}
            onChangeText={v => update('interestRate', v)}
            keyboardType="decimal-pad"
            editable={isAdmin}
            hint="Applied to all member loan requests in this group"
          />
        </Card>

        {/* ── Payment Accounts ── */}
        <SectionTitle title="Payment Accounts" />
        {!isAdmin && !draft.momoNumber && !draft.bankAccount ? (
          <View style={styles.noAccountNotice}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} style={{ marginRight: 8 }} />
            <Text style={styles.noAccountNoticeText}>No payment accounts set up yet. Contact your admin.</Text>
          </View>
        ) : (
          <Card>
            <Text style={styles.subSectionLabel}>Mobile Money</Text>
            <Input
              label="MoMo Number"
              placeholder="e.g. 0241234567"
              value={draft.momoNumber}
              onChangeText={v => update('momoNumber', v)}
              keyboardType="phone-pad"
              editable={isAdmin}
            />
            <Input
              label="MoMo Account Name"
              placeholder="Registered name on the MoMo account"
              value={draft.momoName}
              onChangeText={v => update('momoName', v)}
              editable={isAdmin}
            />
            <View style={styles.divider} />
            <Text style={styles.subSectionLabel}>Bank Transfer</Text>
            <Input
              label="Bank Name"
              placeholder="e.g. GCB Bank, Ecobank"
              value={draft.bankName}
              onChangeText={v => update('bankName', v)}
              editable={isAdmin}
            />
            <Input
              label="Account Number"
              placeholder="e.g. 1234567890"
              value={draft.bankAccount}
              onChangeText={v => update('bankAccount', v)}
              keyboardType="number-pad"
              editable={isAdmin}
            />
            <Input
              label="Account Holder Name"
              placeholder="Name on the bank account"
              value={draft.bankAccountName}
              onChangeText={v => update('bankAccountName', v)}
              editable={isAdmin}
            />
          </Card>
        )}

        {/* ── Rules & Permissions ── */}
        <SectionTitle title="Rules & Permissions" />
        <Card noPadding>
          {[
            { iconName: 'hand-left-outline',        key: 'allowLoans',      label: 'Allow Loans',            desc: 'Members can request loans from the group fund' },
            { iconName: 'checkmark-circle-outline',  key: 'requireApproval', label: 'Require Approval',       desc: 'New members need admin approval to join' },
            { iconName: 'notifications-outline',     key: 'autoReminders',   label: 'Auto Reminders',         desc: 'Send automatic contribution reminders' },
          ].map(({ iconName, key, label, desc }, i, arr) => (
            <View key={key} style={[styles.toggleRow, i < arr.length - 1 && styles.rowBorder]}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '12' }]}>
                <Ionicons name={iconName} size={18} color={Colors.primary} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleDesc}>{desc}</Text>
              </View>
              <Switch
                value={draft[key]}
                onValueChange={v => isAdmin && update(key, v)}
                disabled={!isAdmin}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={draft[key] ? Colors.primary : Colors.white}
              />
            </View>
          ))}
        </Card>

        {/* ── Save button — only shown to admins ── */}
        {isAdmin && (
          <Button
            title={saving ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            size="lg"
            style={{ marginTop: Spacing.md, marginBottom: Spacing.sm, opacity: dirty ? 1 : 0.5 }}
            disabled={!dirty}
          />
        )}

        {/* ── Danger Zone ── */}
        <SectionTitle title="Danger Zone" />
        <Card noPadding>
          <TouchableOpacity style={[styles.dangerRow, styles.rowBorder]} onPress={handleLeave}>
            <View style={[styles.iconBox, { backgroundColor: Colors.error + '12' }]}>
              <Ionicons name="exit-outline" size={18} color={Colors.error} />
            </View>
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerLabel}>Leave Group</Text>
              <Text style={styles.dangerDesc}>Remove yourself from this group</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={[styles.dangerRow, styles.rowBorder]}
              onPress={() => Alert.alert('Archive Group', 'This will archive the group and stop all activity.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Archive', style: 'destructive', onPress: async () => {
                  try { await groupService.archiveGroup(groupId); navigation.goBack(); }
                  catch (err) { Alert.alert('Error', err.message); }
                }},
              ])}>
              <View style={[styles.iconBox, { backgroundColor: Colors.warning + '15' }]}>
                <Ionicons name="archive-outline" size={18} color={Colors.warning} />
              </View>
              <View style={styles.dangerInfo}>
                <Text style={[styles.dangerLabel, { color: Colors.warning }]}>Archive Group</Text>
                <Text style={styles.dangerDesc}>Suspend all group activity</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.warning} />
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity style={styles.dangerRow} onPress={handleDelete}>
              <View style={[styles.iconBox, { backgroundColor: Colors.error + '12' }]}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </View>
              <View style={styles.dangerInfo}>
                <Text style={styles.dangerLabel}>Delete Group</Text>
                <Text style={styles.dangerDesc}>Permanently delete all group data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.error} />
            </TouchableOpacity>
          )}
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:                { flex: 1, backgroundColor: Colors.background },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:             { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:         { ...Typography.h4, color: Colors.textPrimary },
  dirtyBanner:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.warning + '18', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: Colors.warning + '40' },
  dirtyText:           { ...Typography.caption, color: Colors.warning, fontWeight: '600' },
  container:           { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  sectionTitle:        { ...Typography.label, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11, marginTop: Spacing.md, marginBottom: Spacing.sm, marginLeft: 2 },
  subSectionLabel:     { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  divider:             { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  fieldLabel:          { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs },
  fieldHint:           { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  // Cycle grid
  cycleGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  cycleBtn:            { width: '47%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
  cycleBtnActive:      { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  cycleBtnLabel:       { ...Typography.label, color: Colors.textSecondary },
  cycleBtnLabelActive: { color: Colors.primary },
  cycleBtnDesc:        { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  cycleBtnDescActive:  { color: Colors.primary + 'AA' },
  // Payout day chips
  optionRow:           { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  optionBtn:           { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  optionBtnActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText:          { ...Typography.label, color: Colors.textSecondary },
  optionTextActive:    { color: Colors.primary },
  // Info rows (read-only)
  infoRow:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  rowBorder:           { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBox:             { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  infoLabel:           { ...Typography.caption, color: Colors.textSecondary },
  infoValue:           { ...Typography.label, color: Colors.textPrimary, marginTop: 2 },
  // Toggle rows
  toggleRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  toggleInfo:          { flex: 1 },
  toggleLabel:         { ...Typography.label, color: Colors.textPrimary },
  toggleDesc:          { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  // Danger rows
  dangerRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  dangerInfo:          { flex: 1 },
  dangerLabel:         { ...Typography.label, color: Colors.error },
  dangerDesc:          { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  // No account notice
  noAccountNotice:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning + '15', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  noAccountNoticeText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
});

export default GroupSettingsScreen;
