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
const PAYOUT_DAYS  = ['1st', '15th', 'Last day'];

const GroupSettingsScreen = ({ navigation }) => {
  const { groupId, group: ctxGroup, switchGroup, logout, isAdmin, user } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [settings, setSettings] = useState(null);
  const [draft,    setDraft]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const g = await groupService.getGroup(groupId);
        const s = {
          groupName:          g.name,
          description:        g.description || '',
          contributionAmount: String(g.contributionAmount),
          payoutDay:          g.payoutDay,
          cycleType:          g.cycleType,
          interestRate:       String(g.interestRate),
          allowLoans:         g.allowLoans,
          requireApproval:    g.requireApproval,
          autoReminders:      g.autoReminders,
          // Payment accounts
          momoNumber:         g.momoNumber || '',
          momoName:           g.momoName || '',
          bankAccount:        g.bankAccount || '',
          bankName:           g.bankName || '',
          bankAccountName:    g.bankAccountName || '',
        };
        setSettings(s);
        setDraft(s);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, [groupId]);

  const update = (field, value) => setDraft({ ...draft, [field]: value });

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
        // Payment accounts
        momoNumber:         draft.momoNumber || null,
        momoName:           draft.momoName || null,
        bankAccount:        draft.bankAccount || null,
        bankName:           draft.bankName || null,
        bankAccountName:    draft.bankAccountName || null,
      });
      setSettings({ ...draft });
      await switchGroup(
        { ...ctxGroup, name: draft.groupName, contributionAmount: Number(draft.contributionAmount) },
        undefined,
      );
      setEditing(false);
      Alert.alert('Saved', 'Group settings updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Leave group (any member, but not the sole admin) ────
  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${settings?.groupName}"? You will lose access to all group data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(groupId);
              // Clear active group from context and redirect to My Groups
              await switchGroup({ id: null, name: null }, 'MEMBER');
              navigation.reset({ index: 0, routes: [{ name: 'MyGroups' }] });
            } catch (err) {
              Alert.alert('Cannot Leave', err.message);
            }
          },
        },
      ]
    );
  };

  // ── Delete group permanently (admin only) ──────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete Group',
      `This will PERMANENTLY delete "${settings?.groupName}" and all its data — contributions, loans, and member records. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for an irreversible action
            Alert.alert(
              'Are you absolutely sure?',
              'Type "delete" below isn\'t possible in this dialog, but confirm you understand this is permanent.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await groupService.deleteGroup(groupId);
                      await switchGroup({ id: null, name: null }, 'MEMBER');
                      navigation.reset({ index: 0, routes: [{ name: 'MyGroups' }] });
                    } catch (err) {
                      Alert.alert('Error', err.message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const SettingRow = ({ icon, label, value, isLast }) => (
    <View style={[styles.settingRow, !isLast && styles.rowBorder]}>
      <View style={styles.settingIconBox}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{value}</Text>
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
        <TouchableOpacity onPress={() => isAdmin && setEditing(true)} style={styles.editBtn}>
          {!editing && isAdmin && <Text style={styles.editText}>Edit</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Group Identity</Text>
        {editing ? (
          <Card>
            <Input label="Group Name" value={draft.groupName} onChangeText={(v) => update('groupName', v)} />
            <Input label="Description (optional)" value={draft.description} onChangeText={(v) => update('description', v)} multiline numberOfLines={3} />
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="business-outline"  label="Group Name"   value={settings.groupName} />
            <SettingRow icon="document-text-outline" label="Description" value={settings.description || '—'} isLast />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Contributions</Text>
        {editing ? (
          <Card>
            <Input label="Contribution Amount (GHS)" value={draft.contributionAmount} onChangeText={(v) => update('contributionAmount', v)} keyboardType="decimal-pad"
              hint={draft.contributionAmount ? `Each member pays GHS ${draft.contributionAmount} per cycle` : undefined} />
            <Text style={styles.fieldLabel}>Contribution Cycle</Text>
            <Text style={styles.fieldHint}>How often do members make their contributions?</Text>
            <View style={styles.cycleGrid}>
              {CYCLE_TYPES.map(({ label, value, desc }) => (
                <TouchableOpacity key={value}
                  style={[styles.cycleBtn, draft.cycleType === value && styles.cycleBtnActive]}
                  onPress={() => update('cycleType', value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cycleBtnLabel, draft.cycleType === value && styles.cycleBtnLabelActive]}>{label}</Text>
                  <Text style={[styles.cycleBtnDesc, draft.cycleType === value && styles.cycleBtnDescActive]}>{desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="wallet-outline" label="Amount per Cycle" value={`GHS ${settings.contributionAmount}`} />
            <SettingRow icon="refresh-outline" label="Cycle"           value={settings.cycleType} isLast />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Payout</Text>
        {editing ? (
          <Card>
            <Text style={styles.fieldLabel}>Payout Day</Text>
            <View style={styles.optionRow}>
              {PAYOUT_DAYS.map((d) => (
                <TouchableOpacity key={d} style={[styles.optionBtn, draft.payoutDay === d && styles.optionBtnActive]} onPress={() => update('payoutDay', d)}>
                  <Text style={[styles.optionText, draft.payoutDay === d && styles.optionTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Loan Interest Rate (%)" value={draft.interestRate} onChangeText={(v) => update('interestRate', v)} keyboardType="decimal-pad"
              hint="Applied to all loans in this group" />
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="calendar-outline"     label="Payout Day"    value={`${settings.payoutDay} of the month`} />
            <SettingRow icon="trending-up-outline"  label="Interest Rate" value={`${settings.interestRate}% per loan`} isLast />
          </Card>
        )}

        {/* ── Payment Accounts ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Payment Accounts</Text>
        {!isAdmin && !settings.momoNumber && !settings.bankAccount && (
          <View style={styles.noAccountNotice}>
            <Text style={styles.noAccountNoticeText}>
              ⚠️ No payment accounts set up yet. Contact your admin.
            </Text>
          </View>
        )}
        {editing ? (
          <Card>
            <Text style={styles.fieldLabel}>Mobile Money</Text>
            <Input label="MoMo Number" placeholder="e.g. 0241234567" value={draft.momoNumber} onChangeText={v => update('momoNumber', v)} keyboardType="phone-pad" />
            <Input label="MoMo Account Name" placeholder="Name on the MoMo account" value={draft.momoName} onChangeText={v => update('momoName', v)} />
            <Text style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>Bank Transfer</Text>
            <Input label="Bank Name" placeholder="e.g. GCB Bank" value={draft.bankName} onChangeText={v => update('bankName', v)} />
            <Input label="Account Number" placeholder="e.g. 1234567890" value={draft.bankAccount} onChangeText={v => update('bankAccount', v)} keyboardType="number-pad" />
            <Input label="Account Holder Name" placeholder="Name on the bank account" value={draft.bankAccountName} onChangeText={v => update('bankAccountName', v)} />
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="phone-portrait-outline" label="MoMo Number"    value={settings.momoNumber || 'Not set'} />
            <SettingRow icon="person-outline"         label="MoMo Name"      value={settings.momoName || 'Not set'} />
            <SettingRow icon="business-outline"       label="Bank"           value={settings.bankName || 'Not set'} />
            <SettingRow icon="card-outline"           label="Account No."    value={settings.bankAccount || 'Not set'} />
            <SettingRow icon="person-outline"         label="Account Name"   value={settings.bankAccountName || 'Not set'} isLast />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Rules & Permissions</Text>
        <Card noPadding>
          {[
            { iconName: 'hand-left-outline',       key: 'allowLoans',      label: 'Allow Loans',            desc: 'Members can request loans from the group fund' },
            { iconName: 'checkmark-circle-outline', key: 'requireApproval', label: 'Require Admin Approval', desc: 'New members need admin approval to join' },
            { iconName: 'notifications-outline',    key: 'autoReminders',   label: 'Auto Reminders',         desc: 'Send automatic contribution reminders' },
          ].map(({ iconName, key, label, desc }, i, arr) => (
            <View key={key} style={[styles.toggleRow, i < arr.length - 1 && styles.rowBorder]}>
              <View style={[styles.settingIconBox, { backgroundColor: Colors.primary + '12' }]}>
                <Ionicons name={iconName} size={18} color={Colors.primary} />
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleDesc}>{desc}</Text>
              </View>
              <Switch
                value={editing ? draft[key] : settings[key]}
                onValueChange={(v) => editing && update(key, v)}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={(editing ? draft[key] : settings[key]) ? Colors.primary : Colors.white}
              />
            </View>
          ))}
        </Card>

        <Text style={[styles.sectionTitle, { color: Colors.error }]}>Danger Zone</Text>
        <Card noPadding>
          <TouchableOpacity style={[styles.dangerRow, styles.rowBorder]} onPress={handleLeave}>
            <View style={[styles.dangerIconBox, { backgroundColor: Colors.error + '12' }]}>
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
              <View style={[styles.dangerIconBox, { backgroundColor: Colors.warning + '15' }]}>
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
              <View style={[styles.dangerIconBox, { backgroundColor: Colors.error + '12' }]}>
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

        {editing && isAdmin && (
          <View style={styles.saveRow}>
            <Button title="Cancel" onPress={() => { setDraft({ ...settings }); setEditing(false); }} variant="outline" size="md" fullWidth={false} style={{ flex: 1, marginRight: Spacing.sm }} />
            <Button title="Save Changes" onPress={handleSave} loading={saving} size="md" fullWidth={false} style={{ flex: 2 }} />
          </View>
        )}
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
  editBtn:             { width: 48, alignItems: 'flex-end' },
  editText:            { ...Typography.label, color: Colors.primary },
  container:           { paddingHorizontal: Spacing.lg },
  sectionTitle:        { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  settingRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  rowBorder:           { borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingIconBox:      { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  settingInfo:         { flex: 1 },
  settingLabel:        { ...Typography.caption, color: Colors.textSecondary },
  settingValue:        { ...Typography.label, color: Colors.textPrimary, marginTop: 2 },
  fieldLabel:          { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  fieldHint:           { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: -Spacing.xs },
  optionRow:           { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  optionBtn:           { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 4, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  optionBtnActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText:          { ...Typography.label, color: Colors.textSecondary },
  optionTextActive:    { color: Colors.primary },
  cycleGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  cycleBtn:            { width: '47%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
  cycleBtnActive:      { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  cycleBtnLabel:       { ...Typography.label, color: Colors.textSecondary },
  cycleBtnLabelActive: { ...Typography.label, color: Colors.primary },
  cycleBtnDesc:        { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  cycleBtnDescActive:  { color: Colors.primary + 'AA' },
  toggleRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  toggleInfo:          { flex: 1 },
  toggleLabel:         { ...Typography.label, color: Colors.textPrimary },
  toggleDesc:          { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  dangerRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  dangerIconBox:       { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  dangerInfo:          { flex: 1 },
  dangerLabel:         { ...Typography.label, color: Colors.error },
  dangerDesc:          { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  saveRow:             { flexDirection: 'row', marginTop: Spacing.lg },
  noAccountNotice:     { backgroundColor: Colors.warning + '15', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  noAccountNoticeText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20 },
});

export default GroupSettingsScreen;
