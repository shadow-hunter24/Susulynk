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
import { memberService } from '../../services/memberService';

const AddMemberScreen = ({ navigation }) => {
  const { groupId } = useAuth();
  const [form, setForm]     = useState({ fullName: '', phone: '', email: '', role: 'MEMBER', notes: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phone.trim())    e.phone    = 'Phone number is required';
    else if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await memberService.addMember(groupId, {
        fullName: form.fullName,
        phone:    form.phone,
        email:    form.email || undefined,
        role:     form.role,
        notes:    form.notes || undefined,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add member');
    } finally {
      setLoading(false);
    }
  };

  const initials = form.fullName
    ? form.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Member</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Input label="Full Name *" placeholder="e.g. Akosua Mensah" value={form.fullName}
              onChangeText={(v) => update('fullName', v)} error={errors.fullName}
              leftIcon={<Text style={styles.icon}>👤</Text>} />
            <Input label="Phone Number *" placeholder="e.g. 0241234567" value={form.phone}
              onChangeText={(v) => update('phone', v)} keyboardType="phone-pad"
              autoCapitalize="none" error={errors.phone}
              leftIcon={<Text style={styles.icon}>📱</Text>} />
            <Input label="Email (optional)" placeholder="e.g. akosua@email.com" value={form.email}
              onChangeText={(v) => update('email', v)} keyboardType="email-address"
              autoCapitalize="none" error={errors.email}
              leftIcon={<Text style={styles.icon}>✉️</Text>} />

            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleRow}>
              {['MEMBER', 'ADMIN'].map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                  onPress={() => update('role', r)}>
                  <Text style={styles.roleIcon}>{r === 'ADMIN' ? '👑' : '👤'}</Text>
                  <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Notes (optional)" placeholder="Any additional notes..." value={form.notes}
              onChangeText={(v) => update('notes', v)} multiline numberOfLines={3} />

            <Button title="Add Member" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: Spacing.sm }} />
            <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" size="md" style={{ marginTop: Spacing.xs }} />
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
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  roleLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm + 4, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.xs },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  roleIcon: { fontSize: 16 },
  roleText: { ...Typography.label, color: Colors.textSecondary },
  roleTextActive: { color: Colors.primary },
});

export default AddMemberScreen;
