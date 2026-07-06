import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const EditProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email:    user?.email    || '',
    bio:      user?.bio      || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.updateProfile({
        fullName: form.fullName,
        email:    form.email || null,
        bio:      form.bio   || null,
      });
      await refreshUser();
      Alert.alert('Profile Updated', 'Your profile has been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = form.fullName
    .split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.changePhotoBtn}
              onPress={() => Alert.alert('Coming soon', 'Photo upload will be available in the next update.')}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Input label="Full Name *" placeholder="e.g. Kofi Mensah" value={form.fullName}
              onChangeText={(v) => update('fullName', v)} error={errors.fullName}
              leftIcon={<Text style={styles.icon}>👤</Text>} />
            <Input label="Email Address" placeholder="e.g. kofi@email.com" value={form.email}
              onChangeText={(v) => update('email', v)} keyboardType="email-address"
              autoCapitalize="none" error={errors.email}
              leftIcon={<Text style={styles.icon}>✉️</Text>} />
            <Input label="Bio (optional)" placeholder="A short description about yourself..." value={form.bio}
              onChangeText={(v) => update('bio', v)} multiline numberOfLines={3} />

            <View style={styles.divider} />

            <Button title="Save Changes" onPress={handleSave} loading={loading} size="lg" />
            <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" size="md" style={{ marginTop: Spacing.xs }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.white },
  changePhotoBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
  changePhotoText: { ...Typography.label, color: Colors.primary },
  form: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { fontSize: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
});

export default EditProfileScreen;
