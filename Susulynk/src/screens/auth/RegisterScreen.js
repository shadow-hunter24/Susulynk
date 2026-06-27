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

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '',
    groupName: '', groupRole: 'member',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const validateStep1 = () => {
    const e = {};
    if (!form.fullName) e.fullName = 'Full name is required';
    if (!form.phone)    e.phone    = 'Phone number is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register({
        fullName:  form.fullName,
        phone:     form.phone,
        email:     form.email || undefined,
        password:  form.password,
        groupName: form.groupName || undefined,
        groupRole: form.groupRole,
      });
      // token saved → navigator switches automatically
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Please try again');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            {step === 2 && (
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{step === 1 ? 'Create Account' : 'Group Details'}</Text>
            <Text style={styles.subtitle}>{step === 1 ? 'Step 1 of 2 — Personal Info' : 'Step 2 of 2 — Your Group'}</Text>
            <Text style={styles.appName}>Susulynk</Text>
          </View>

          <View style={styles.progressRow}>
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, step === 2 && styles.progressActive]} />
          </View>

          {step === 1 && (
            <View style={styles.form}>
              <Input label="Full Name" placeholder="e.g. Kofi Mensah" value={form.fullName}
                onChangeText={(v) => update('fullName', v)} error={errors.fullName}
                leftIcon={<Text style={styles.icon}>👤</Text>} />
              <Input label="Phone Number" placeholder="0241234567" value={form.phone}
                onChangeText={(v) => update('phone', v)} keyboardType="phone-pad"
                autoCapitalize="none" error={errors.phone}
                leftIcon={<Text style={styles.icon}>📱</Text>} />
              <Input label="Email (optional)" placeholder="kofi@email.com" value={form.email}
                onChangeText={(v) => update('email', v)} keyboardType="email-address"
                autoCapitalize="none" error={errors.email}
                leftIcon={<Text style={styles.icon}>✉️</Text>} />
              <Input label="Password" placeholder="Min. 6 characters" value={form.password}
                onChangeText={(v) => update('password', v)} secureTextEntry
                autoCapitalize="none" error={errors.password}
                leftIcon={<Text style={styles.icon}>🔒</Text>} />
              <Input label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword}
                onChangeText={(v) => update('confirmPassword', v)} secureTextEntry
                autoCapitalize="none" error={errors.confirmPassword}
                leftIcon={<Text style={styles.icon}>🔒</Text>} />
              <Button title="Continue" onPress={handleNext} size="lg" style={{ marginTop: Spacing.sm }} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <Input label="Group Name" placeholder="e.g. Accra Women Susu" value={form.groupName}
                onChangeText={(v) => update('groupName', v)}
                leftIcon={<Text style={styles.icon}>🏦</Text>} />
              <Text style={styles.roleLabel}>Your Role</Text>
              <View style={styles.roleRow}>
                {['member', 'admin'].map((role) => (
                  <TouchableOpacity key={role}
                    style={[styles.roleBtn, form.groupRole === role && styles.roleSelected]}
                    onPress={() => update('groupRole', role)}>
                    <Text style={[styles.roleText, form.groupRole === role && styles.roleTextSelected]}>
                      {role === 'admin' ? '👑 Admin' : '👤 Member'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.hint}>Admins can manage members, loans and settings.</Text>

              {/* Deontology: informed consent — users must know what data is shared before joining */}
              <View style={styles.consentBox}>
                <Text style={styles.consentTitle}>📋 Group Transparency Notice</Text>
                <Text style={styles.consentText}>
                  By joining a Susu group on Susulynk, all group members can see:
                  {'\n'}• Your contribution status each cycle
                  {'\n'}• Your payout position in the rotation
                  {'\n'}• Your first name and initial on loan records
                  {'\n\n'}Your full phone number is only visible to group admins. This transparency is how Susu groups maintain trust and accountability.
                </Text>
              </View>

              <Button title="Create Account" onPress={handleSubmit} size="lg" loading={loading} style={{ marginTop: Spacing.md }} />
            </View>
          )}

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  backBtn: { marginBottom: Spacing.sm },
  backText: { ...Typography.label, color: Colors.primary },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xs },
  appName: { ...Typography.h3, color: Colors.primary, marginTop: Spacing.xs },
  progressRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  roleLabel: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  roleBtn: { flex: 1, paddingVertical: Spacing.sm + 4, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  roleSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  roleText: { ...Typography.label, color: Colors.textSecondary },
  roleTextSelected: { color: Colors.primary },
  hint: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  consentBox: { backgroundColor: Colors.primary + '10', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  consentTitle: { ...Typography.label, color: Colors.primary, marginBottom: Spacing.xs },
  consentText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  loginText: { ...Typography.body2, color: Colors.textSecondary },
  loginLink: { ...Typography.label, color: Colors.primary },
});

export default RegisterScreen;
