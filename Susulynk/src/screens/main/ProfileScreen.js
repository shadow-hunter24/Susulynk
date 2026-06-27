import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, group, logout, isAdmin } = useAuth();
  const [prefs, setPrefs] = useState({ reports: true, darkMode: false });
  const togglePref = (key) => setPrefs({ ...prefs, [key]: !prefs[key] });

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const joinedDate = user?.memberships?.[0]?.group
    ? 'Susulynk member'
    : 'Susulynk member';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        // Navigator auto-switches to guest stack
      }},
    ]);
  };

  const MenuRow = ({ icon, label, value, toggle, prefKey, onPress, isLast }) => (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {toggle && (
          <Switch value={prefs[prefKey]} onValueChange={() => togglePref(prefKey)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={prefs[prefKey] ? Colors.primary : Colors.white} />
        )}
        {onPress && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.userName}>{user?.fullName || '—'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '—'}</Text>
          <View style={styles.badgeRow}>
            {group && <Badge label={group.name} type="primary" />}
            <Badge label={user?.role === 'ADMIN' ? 'Admin 👑' : 'Member'} type={user?.role === 'ADMIN' ? 'success' : 'neutral'} />
          </View>
          <Text style={styles.joinedText}>{joinedDate}</Text>
        </View>

        <View style={styles.statsStrip}>
          {[
            [group?.contributionAmount ? `GHS ${group.contributionAmount}/mo` : '—', 'Contribution'],
            [user?.role === 'ADMIN' ? 'Admin' : 'Member', 'Role'],
            [user?.memberships?.length ?? 0, 'Groups'],
          ].map(([value, label], i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <Card noPadding>
          <MenuRow icon="👤" label="Edit Profile"      onPress={() => navigation.navigate('EditProfile')} />
          <MenuRow icon="🔒" label="Change Password"   onPress={() => navigation.navigate('ForgotPassword')} />
          <MenuRow icon="📱" label="Phone Number"      value={user?.phone} isLast />
        </Card>

        <Text style={styles.sectionTitle}>Group</Text>
        <Card noPadding>
          <MenuRow icon="📋" label="My Groups"         onPress={() => navigation.navigate('MyGroups')} />
          <MenuRow icon="🔍" label="Browse Groups"     onPress={() => navigation.navigate('BrowseGroups')} />
          <MenuRow icon="💰" label="Contribution"      value={group ? `GHS ${group.contributionAmount}/mo` : '—'} isLast />
        </Card>

        {/* Create Group is available to everyone — any member can start their own Susu */}
        <Text style={styles.sectionTitle}>Start a New Susu</Text>
        <Card noPadding>
          <MenuRow icon="➕" label="Create New Group"  onPress={() => navigation.navigate('CreateGroup')} isLast />
        </Card>

        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <Card noPadding>
              <MenuRow icon="🏦" label="Group Settings"  onPress={() => navigation.navigate('GroupSettings')} />
              <MenuRow icon="👥" label="Manage Members"  onPress={() => navigation.navigate('MainTabs', { screen: 'Members' })} />
              <MenuRow icon="📩" label="Join Requests"   onPress={() => navigation.navigate('JoinRequests')} isLast />
            </Card>
          </>
        )}

        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card noPadding>
          <MenuRow icon="🔔" label="Notifications"     onPress={() => navigation.navigate('Notifications')} />
          <MenuRow icon="📊" label="Monthly Reports"   toggle prefKey="reports" />
          <MenuRow icon="🌙" label="Dark Mode"         toggle prefKey="darkMode" isLast />
        </Card>

        <Text style={styles.sectionTitle}>Support</Text>
        <Card noPadding>
          <MenuRow icon="❓" label="Help & FAQ"        onPress={() => {}} />
          <MenuRow icon="📞" label="Contact Support"   onPress={() => {}} />
          <MenuRow icon="⭐" label="Rate the App"      onPress={() => {}} isLast />
        </Card>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Susulynk v1.0.0</Text>
          <Text style={styles.appInfoText}>Built with ❤️ for Ghanaian Susu groups</Text>
        </View>

        <Button title="Sign Out" onPress={handleLogout} variant="outline" size="lg"
          style={{ borderColor: Colors.error, marginBottom: Spacing.sm }}
          textStyle={{ color: Colors.error }} />

        <View style={{ height: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  profileCard: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  userName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  userPhone: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs, flexWrap: 'wrap', justifyContent: 'center' },
  joinedText: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  statsStrip: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statValue: { ...Typography.h4, color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
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
