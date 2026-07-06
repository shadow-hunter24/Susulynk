import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { authService } from '../../services/authService';

const ResetPasswordScreen = ({ navigation, route }) => {
  const resetToken = route.params?.resetToken || '';
  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.password)               e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.resetPassword(resetToken, form.password);
      setDone(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Reset link expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: Colors.border };
    const score = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ].filter(Boolean).length;
    if (score <= 1) return { level: 1, label: 'Weak',   color: Colors.error };
    if (score === 2) return { level: 2, label: 'Fair',   color: Colors.warning };
    if (score === 3) return { level: 3, label: 'Good',   color: Colors.info };
    return             { level: 4, label: 'Strong', color: Colors.success };
  };

  const strength = getStrength(form.password);

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>🔓</Text>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successSub}>Your password has been updated successfully.</Text>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            style={{ marginTop: Spacing.xl, width: '80%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.iconBox}>
            <Text style={styles.bigIcon}>🔒</Text>
          </View>

          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>Create a strong password for your Susulynk account.</Text>

          <View style={styles.form}>
            <Input
              label="New Password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
              leftIcon={<Text style={{ fontSize: 16 }}>🔒</Text>}
            />

            {/* Strength bar */}
            {form.password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= strength.level ? strength.color : Colors.border },
                    ]}
                  />
                ))}
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            <Input
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={form.confirm}
              onChangeText={(v) => setForm({ ...form, confirm: v })}
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirm}
              leftIcon={<Text style={{ fontSize: 16 }}>🔒</Text>}
            />

            {/* Tips */}
            <View style={styles.hintBox}>
              {[
                'At least 6 characters',
                'Mix of uppercase and lowercase',
                'Include a number or symbol',
              ].map((h, i) => (
                <View key={i} style={styles.hintRow}>
                  <Text style={styles.hintDot}>•</Text>
                  <Text style={styles.hintText}>{h}</Text>
                </View>
              ))}
            </View>

            <Button title="Reset Password" onPress={handleSubmit} loading={loading} size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  backText: { ...Typography.label, color: Colors.primary },
  iconBox: { alignItems: 'center', marginBottom: Spacing.lg },
  bigIcon: { fontSize: 64 },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body1, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 24 },
  form: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  strengthRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.xs, marginTop: -Spacing.sm, marginBottom: Spacing.md,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { ...Typography.caption, fontWeight: '700', marginLeft: Spacing.xs },
  hintBox: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  hintDot: { color: Colors.primary, marginRight: Spacing.sm, fontSize: 16 },
  hintText: { ...Typography.caption, color: Colors.textSecondary },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  successIcon: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.sm },
  successSub: { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});

export default ResetPasswordScreen;
