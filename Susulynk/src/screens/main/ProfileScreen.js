import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { Colors, isDark, toggleDark } = useTheme();
  const { user, group, logout, isAdmin } = useAuth();
  const styles = makeStyles(Colors);
  const [prefs, setPrefs] = useState({ reports: true });

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const MenuRow = ({ iconName, label, value, onPress, isLast, switchValue, onSwitchChange, danger }) => (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.menuIconBox, { backgroundColor: danger ? Colors.error + '15' : Colors.primary + '12' }]}>
        <Ionicons name={iconName} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value !== undefined && <Text style={styles.menuValue}>{value}</Text>}
        {switchValue !== undefined && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={switchValue ? Colors.primary : Colors.white}
          />
        )}
        {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 4 }} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Avatar card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.userName}>{user?.fullName || '—'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '—'}</Text>
          <View style={styles.badgeRow}>
            {group && <Badge label={group.name} type="primary" />}
            <Badge label={user?.role === 'ADMIN' ? 'Admin' : 'Member'} type={user?.role === 'ADMIN' ? 'success' : 'neutral'} />
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            [group?.contributionAmount ? `GHS ${group.contributionAmount}` : '—', 'Contribution'],
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
          <MenuRow iconName="person-outline"    label="Edit Profile"     onPress={() => navigation.navigate('EditProfile')} />
          <MenuRow iconName="lock-closed-outline" label="Change Password" onPress={() => navigation.navigate('ForgotPassword')} />
          <MenuRow iconName="call-outline"      label="Phone Number"     value={user?.phone} isLast />
        </Card>

        <Text style={styles.sectionTitle}>Group</Text>
        <Card noPadding>
          <MenuRow iconName="layers-outline"    label="My Groups"        onPress={() => navigation.navigate('MyGroups')} />
          <MenuRow iconName="search-outline"    label="Browse Groups"    onPress={() => navigation.navigate('BrowseGroups')} />
          <MenuRow iconName="wallet-outline"    label="Contribution"     value={group ? `GHS ${group.contributionAmount}/mo` : '—'} isLast />
        </Card>

        <Text style={styles.sectionTitle}>Start a New Susu</Text>
        <Card noPadding>
          <MenuRow iconName="add-circle-outline" label="Create New Group" onPress={() => navigation.navigate('CreateGroup')} isLast />
        </Card>

        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <Card noPadding>
              <MenuRow iconName="settings-outline"  label="Group Settings"  onPress={() => navigation.navigate('GroupSettings')} />
              <MenuRow iconName="people-outline"    label="Manage Members"  onPress={() => navigation.navigate('MainTabs', { screen: 'Members' })} />
              <MenuRow iconName="mail-open-outline" label="Join Requests"   onPress={() => navigation.navigate('JoinRequests')} isLast />
            </Card>
          </>
        )}

        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card noPadding>
          <MenuRow iconName="notifications-outline" label="Notifications"  onPress={() => navigation.navigate('Notifications')} />
          <MenuRow iconName="bar-chart-outline"     label="Monthly Reports" switchValue={prefs.reports} onSwitchChange={() => setPrefs(p => ({ ...p, reports: !p.reports }))} />
          <MenuRow iconName="moon-outline"          label="Dark Mode"      switchValue={isDark} onSwitchChange={toggleDark} isLast />
        </Card>

        <Text style={styles.sectionTitle}>Support</Text>
        <Card noPadding>
          <MenuRow iconName="help-circle-outline"   label="Help & FAQ"      onPress={() => navigation.navigate('HelpFAQ')} />
          <MenuRow iconName="chatbubble-outline"    label="Contact Support" onPress={() => navigation.navigate('ContactSupport')} />
          <MenuRow iconName="star-outline"          label="Rate the App"    onPress={() => navigation.navigate('RateApp')} isLast />
        </Card>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Susulynk v1.0.0</Text>
          <Text style={styles.appInfoText}>Built with care for Ghanaian Susu groups</Text>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[styles.signOutText, { color: Colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  container:      { paddingHorizontal: Spacing.lg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:    { ...Typography.h4, color: Colors.textPrimary },
  profileCard:    { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatar:         { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText:     { fontSize: 30, fontWeight: '800', color: Colors.white },
  userName:       { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  userPhone:      { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badgeRow:       { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  statsStrip:     { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statItem:       { flex: 1, alignItems: 'center' },
  statDivider:    { width: 1, backgroundColor: Colors.border },
  statValue:      { ...Typography.h4, color: Colors.primary },
  statLabel:      { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle:   { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 },
  menuRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  menuRowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIconBox:    { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  menuLabel:      { ...Typography.body1, color: Colors.textPrimary, flex: 1 },
  menuRight:      { flexDirection: 'row', alignItems: 'center' },
  menuValue:      { ...Typography.body2, color: Colors.textSecondary, marginRight: Spacing.xs },
  appInfo:        { alignItems: 'center', paddingVertical: Spacing.lg },
  appInfoText:    { ...Typography.caption, color: Colors.textMuted, marginBottom: 2 },
  signOutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.error + '12', borderRadius: Radius.lg, paddingVertical: Spacing.sm + 4, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.error + '30' },
  signOutText:    { ...Typography.label, fontSize: 15 },
});

export default ProfileScreen;
