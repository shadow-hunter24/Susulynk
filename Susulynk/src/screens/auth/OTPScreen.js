import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { authService } from '../../services/authService';

const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
  const phone = route.params?.phone || '';
  const [otp, setOtp]           = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (text, index) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    setError('');
    // Auto-advance to next box
    if (cleaned && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone, code);
      // res.resetToken is a short-lived JWT for the reset-password step
      navigation.navigate('ResetPassword', { resetToken: res.resetToken, phone });
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authService.forgotPassword(phone);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setResendTimer(60);
      Alert.alert('Code Resent', 'A new OTP has been sent to ' + phone);
    } catch (_) {
      setResendTimer(60); // still reset timer to prevent spam
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.iconBox}>
          <Text style={styles.bigIcon}>📲</Text>
        </View>

        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phoneText}>{phone}</Text>
        </Text>

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputs.current[i] = ref)}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled,
                error && styles.otpBoxError,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Verify Code"
          onPress={handleVerify}
          loading={loading}
          size="lg"
          style={styles.verifyBtn}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive it? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
            <Text style={[styles.resendLink, resendTimer > 0 && styles.resendDisabled]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
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
  subtitle: {
    ...Typography.body1, color: Colors.textSecondary,
    marginBottom: Spacing.xl, lineHeight: 26,
  },
  phoneText: { fontWeight: '700', color: Colors.textPrimary },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  otpBox: {
    width: 48, height: 56,
    borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: 24, fontWeight: '700',
    color: Colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  otpBoxError: { borderColor: Colors.error },
  errorText: {
    ...Typography.caption, color: Colors.error,
    marginBottom: Spacing.md, textAlign: 'center',
  },
  verifyBtn: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendLabel: { ...Typography.body2, color: Colors.textSecondary },
  resendLink: { ...Typography.label, color: Colors.primary },
  resendDisabled: { color: Colors.textMuted },
});

export default OTPScreen;
