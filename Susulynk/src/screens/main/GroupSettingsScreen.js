import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';

const PAYOUT_DAYS  = ['1st', '15th', 'Last day'];
const CYCLE_TYPES  = ['Monthly', 'Bi-weekly', 'Weekly'];

const GroupSettingsScreen = ({ navigation }) => {
  const { groupId, group: ctxGroup, switchGroup, isAdmin } = useAuth();
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
      const updated = await groupService.updateGroup(groupId, {
        name:               draft.groupName,
        description:        draft.description,
        contributionAmount: Number(draft.contributionAmount),
        cycleType:          draft.cycleType,
        payoutDay:          draft.payoutDay,
        interestRate:       Number(draft.interestRate),
        allowLoans:         draft.allowLoans,
        requireApproval:    draft.requireApproval,
        autoReminders:      draft.autoReminders,
      });
      setSettings({ ...draft });
      // Update context so the group name reflects everywhere — preserve existing role
      await switchGroup(
        { ...ctxGroup, name: draft.groupName, contributionAmount: Number(draft.contributionAmount) },
        undefined, // keep current role — switchGroup will find it from memberships
      );
      setEditing(false);
      Alert.alert('Saved', 'Group settings updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
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
      <Text style={styles.settingIcon}>{icon}</Text>
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
          <Text style={styles.backText}>←</Text>
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
            <Input label="Group Name" value={draft.groupName} onChangeText={(v) => update('groupName', v)} leftIcon={<Text style={{ fontSize: 16 }}>🏦</Text>} />
            <Input label="Description (optional)" value={draft.description} onChangeText={(v) => update('description', v)} multiline numberOfLines={3} />
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="🏦" label="Group Name"   value={settings.groupName} />
            <SettingRow icon="📝" label="Description"  value={settings.description || '—'} isLast />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Contributions</Text>
        {editing ? (
          <Card>
            <Input label="Contribution Amount (GHS)" value={draft.contributionAmount} onChangeText={(v) => update('contributionAmount', v)} keyboardType="decimal-pad" leftIcon={<Text style={{ fontSize: 16 }}>💰</Text>} />
            <Text style={styles.fieldLabel}>Cycle</Text>
            <View style={styles.optionRow}>
              {CYCLE_TYPES.map((c) => (
                <TouchableOpacity key={c} style={[styles.optionBtn, draft.cycleType === c && styles.optionBtnActive]} onPress={() => update('cycleType', c)}>
                  <Text style={[styles.optionText, draft.cycleType === c && styles.optionTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="💰" label="Amount"    value={`GHS ${settings.contributionAmount} / ${settings.cycleType.toLowerCase()}`} />
            <SettingRow icon="📅" label="Cycle"     value={settings.cycleType} isLast />
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
            <Input label="Loan Interest Rate (%)" value={draft.interestRate} onChangeText={(v) => update('interestRate', v)} keyboardType="decimal-pad" leftIcon={<Text style={{ fontSize: 16 }}>📈</Text>} />
          </Card>
        ) : (
          <Card noPadding>
            <SettingRow icon="📅" label="Payout Day"   value={`${settings.payoutDay} of the month`} />
            <SettingRow icon="📈" label="Interest Rate" value={`${settings.interestRate}%`} isLast />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Rules & Permissions</Text>
        <Card noPadding>
          {[
            { icon: '🤝', key: 'allowLoans',      label: 'Allow Loans',            desc: 'Members can request loans from the group fund' },
            { icon: '✅', key: 'requireApproval', label: 'Require Admin Approval', desc: 'New members need admin approval to join' },
            { icon: '🔔', key: 'autoReminders',   label: 'Auto Reminders',         desc: 'Send automatic contribution reminders' },
          ].map(({ icon, key, label, desc }, i, arr) => (
            <View key={key} style={[styles.toggleRow, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.toggleIcon}>{icon}</Text>
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
        {isAdmin && (
        <Card>
          <TouchableOpacity style={styles.dangerRow} onPress={() =>
            Alert.alert('Archive Group', 'This will archive the group and stop all activity.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Archive', style: 'destructive', onPress: async () => {
                try {
                  await groupService.archiveGroup(groupId);
                  navigation.goBack();
                } catch (err) { Alert.alert('Error', err.message); }
              }},
            ])
          }>
            <Text style={styles.dangerIcon}>📦</Text>
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerLabel}>Archive Group</Text>
              <Text style={styles.dangerDesc}>Suspend all group activity</Text>
            </View>
            <Text style={styles.dangerArrow}>›</Text>
          </TouchableOpacity>
        </Card>
        )}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  editBtn: { width: 48, alignItems: 'flex-end' },
  editText: { ...Typography.label, color: Colors.primary },
  container: { paddingHorizontal: Spacing.lg },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingIcon: { fontSize: 20, marginRight: Spacing.md, width: 28 },
  settingInfo: { flex: 1 },
  settingLabel: { ...Typography.caption, color: Colors.textSecondary },
  settingValue: { ...Typography.label, color: Colors.textPrimary, marginTop: 2 },
  fieldLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  optionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  optionBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 4, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  optionText: { ...Typography.label, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  toggleIcon: { fontSize: 20, marginRight: Spacing.md, width: 28 },
  toggleInfo: { flex: 1 },
  toggleLabel: { ...Typography.label, color: Colors.textPrimary },
  toggleDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  dangerRow: { flexDirection: 'row', alignItems: 'center' },
  dangerIcon: { fontSize: 20, marginRight: Spacing.md },
  dangerInfo: { flex: 1 },
  dangerLabel: { ...Typography.label, color: Colors.error },
  dangerDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  dangerArrow: { fontSize: 22, color: Colors.error },
  saveRow: { flexDirection: 'row', marginTop: Spacing.lg },
});

export default GroupSettingsScreen;
