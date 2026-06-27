import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { authService } from '../../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [phone, setPhone]   = useState('');
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!phone.trim()) { setError('Enter your phone number'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(phone.trim());
      setSent(true);
    } catch (err) {
      // Always show success UI to avoid phone enumeration
      // (backend returns 200 even for unknown numbers)
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.iconBox}>
          <Text style={styles.bigIcon}>🔑</Text>
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the phone number linked to your account. We'll send you a reset code.
        </Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Code Sent!</Text>
            <Text style={styles.successText}>
              If <Text style={{ fontWeight: '700' }}>{phone}</Text> is registered, an OTP has been sent. Enter it below.
            </Text>
            <Button
              title="Enter OTP"
              onPress={() => navigation.navigate('OTP', { phone: phone.trim() })}
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />
            <TouchableOpacity onPress={() => setSent(false)} style={{ marginTop: Spacing.md }}>
              <Text style={styles.retryText}>Use a different number</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Phone Number"
              placeholder="e.g. 0241234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={error}
              leftIcon={<Text style={{ fontSize: 16 }}>📱</Text>}
            />
            <Button title="Send Reset Code" onPress={handleSend} loading={loading} size="lg" />
          </View>
        )}
      </ScrollView>
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
  successBox: { alignItems: 'center', paddingTop: Spacing.lg },
  successIcon: { fontSize: 56, marginBottom: Spacing.md },
  successTitle: { ...Typography.h3, color: Colors.success, marginBottom: Spacing.sm },
  successText: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryText: { ...Typography.label, color: Colors.primary },
});

export default ForgotPasswordScreen;
