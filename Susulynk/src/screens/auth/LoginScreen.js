import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [form, setForm]     = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.phone)    e.phone    = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.phone, form.password);
      // AuthContext sets token → AppNavigator switches to authenticated stack automatically
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid phone or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.topSection}>
            <Image source={require('../../../assets/logo.png')} style={styles.logoImg} resizeMode="contain" />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your Susulynk account</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Phone Number"
              placeholder="e.g. 0241234567"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.phone}
              leftIcon={<Text style={styles.inputIcon}>📱</Text>}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
              leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
            />
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
            <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" style={styles.loginBtn} />
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.registerPrompt}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  topSection: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  logoImg: { width: 80, height: 80, borderRadius: 16, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  inputIcon: { fontSize: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -Spacing.sm },
  forgotText: { ...Typography.label, color: Colors.primary },
  loginBtn: { marginTop: Spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  registerPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { ...Typography.body2, color: Colors.textSecondary },
  registerLink: { ...Typography.label, color: Colors.primary },
});

export default LoginScreen;
