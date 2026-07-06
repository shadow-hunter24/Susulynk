import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Input from '../../components/Input';
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
  const [avatarUri, setAvatarUri]     = useState(user?.avatarUrl || null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Pick photo from library or camera ─────────────────
  const handlePickPhoto = () => {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      {
        text: 'Camera',
        onPress: () => launchPicker('camera'),
      },
      {
        text: 'Photo Library',
        onPress: () => launchPicker('library'),
      },
      {
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => { setAvatarUri(null); setAvatarChanged(true); },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const launchPicker = async (source) => {
    // Request permission
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required.');
        return;
      }
    }

    setUploadingPhoto(true);
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
          });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        // Build a data URI from the base64 string
        const ext  = asset.uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        const dataUri = `data:${mime};base64,${asset.base64}`;
        setAvatarUri(dataUri);
        setAvatarChanged(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not load photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Save profile ───────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.updateProfile({
        fullName:  form.fullName,
        email:     form.email || null,
        bio:       form.bio   || null,
        // Only send avatarUrl if it changed (avoids re-sending large base64 on every save)
        ...(avatarChanged && { avatarUrl: avatarUri }),
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

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar picker ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              activeOpacity={0.85}
              style={styles.avatarWrapper}
              disabled={uploadingPhoto}
            >
              <Avatar
                name={form.fullName}
                uri={avatarUri}
                size={100}
                style={styles.avatarImg}
              />
              {/* Overlay badge */}
              <View style={[styles.cameraBadge, { backgroundColor: Colors.primary }]}>
                {uploadingPhoto
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Ionicons name="camera" size={16} color={Colors.white} />
                }
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Input
              label="Full Name *"
              placeholder="e.g. Kofi Mensah"
              value={form.fullName}
              onChangeText={v => update('fullName', v)}
              error={errors.fullName}
            />
            <Input
              label="Email Address"
              placeholder="e.g. kofi@email.com"
              value={form.email}
              onChangeText={v => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Bio (optional)"
              placeholder="A short description about yourself..."
              value={form.bio}
              onChangeText={v => update('bio', v)}
              multiline
              numberOfLines={3}
            />

            <View style={styles.divider} />

            <Button title="Save Changes" onPress={handleSave} loading={loading} size="lg" />
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="ghost"
              size="md"
              style={{ marginTop: Spacing.xs }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:   { ...Typography.h4, color: Colors.textPrimary },
  container:     { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.sm },
  avatarImg:     {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  cameraBadge:   {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  photoHint:     { ...Typography.caption, color: Colors.textSecondary },
  form:          { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  divider:       { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
});

export default EditProfileScreen;
