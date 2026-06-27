import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const ProfileScreen = ({ navigation }) => {
  const [prefs, setPrefs] = useState({
    notifications: true,
    reports: true,
    darkMode: false,
  });

  const user = {
    name: 'Kofi Mensah',
    phone: '0241234567',
    email: 'kofi@email.com',
    role: 'admin',
    initials: 'KM',
    group: 'Accra Women Susu',
    joined: 'January 2024',
  };

  const togglePref = (key) => setPrefs({ ...prefs, [key]: !prefs[key] });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => navigation.replace('Welcome'),
      },
    ]);
  };

  const MenuRow = ({ icon, label, value, toggle, prefKey, screen, isLast }) => (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={screen ? () => navigation.navigate(screen) : undefined}
      activeOpacity={screen ? 0.7 : 1}
      disabled={!screen && !toggle}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {toggle && (
          <Switch
            value={prefs[prefKey]}
            onValueChange={() => togglePref(prefKey)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={prefs[prefKey] ? Colors.primary : Colors.white}
          />
        )}
        {screen && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <View style={styles.badgeRow}>
            <Badge label={user.group} type="primary" />
            <Badge label="Admin 👑" type="success" />
          </View>
          <Text style={styles.joinedText}>Member since {user.joined}</Text>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>GHS 2,400</Text>
            <Text style={styles.statLabel}>Contributed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Months Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>GHS 0</Text>
            <Text style={styles.statLabel}>Loans</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card noPadding>
          <MenuRow icon="👤" label="Edit Profile" screen="EditProfile" />
          <MenuRow icon="🔒" label="Change Password" screen="ChangePassword" />
          <MenuRow icon="📱" label="Phone Number" value={user.phone} isLast />
        </Card>

        {/* Group Section */}
        <Text style={styles.sectionTitle}>Group</Text>
        <Card noPadding>
          <MenuRow icon="🏦" label="Group Settings" screen="GroupSettings" />
          <MenuRow icon="👥" label="Manage Members" screen="Members" />
          <MenuRow icon="💰" label="Contribution Amount" value="GHS 200/mo" isLast />
        </Card>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card noPadding>
          <MenuRow icon="🔔" label="Notifications" toggle prefKey="notifications" />
          <MenuRow icon="📊" label="Monthly Reports" toggle prefKey="reports" />
          <MenuRow icon="🌙" label="Dark Mode" toggle prefKey="darkMode" isLast />
        </Card>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support</Text>
        <Card noPadding>
          <MenuRow icon="❓" label="Help & FAQ" screen="Help" />
          <MenuRow icon="📞" label="Contact Support" screen="Support" />
          <MenuRow icon="⭐" label="Rate the App" screen="Rate" isLast />
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SusuPa v1.0.0</Text>
          <Text style={styles.appInfoText}>Built with ❤️ for Ghanaian Susu groups</Text>
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          size="lg"
          style={{ borderColor: Colors.error, marginBottom: Spacing.sm }}
          textStyle={{ color: Colors.error }}
        />

        <View style={{ height: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  profileCard: {
    alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  userName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  userPhone: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  joinedText: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  statsStrip: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statValue: { ...Typography.h4, color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    ...Typography.label, color: Colors.textSecondary,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { fontSize: 20, marginRight: Spacing.md, width: 28 },
  menuLabel: { ...Typography.body1, color: Colors.textPrimary, flex: 1 },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { ...Typography.body2, color: Colors.textSecondary, marginRight: Spacing.xs },
  chevron: { fontSize: 22, color: Colors.textMuted, marginLeft: 2 },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.lg },
  appInfoText: { ...Typography.caption, color: Colors.textMuted, marginBottom: 2 },
});

export default ProfileScreen;
