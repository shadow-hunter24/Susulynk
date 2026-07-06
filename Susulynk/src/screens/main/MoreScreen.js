import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const MoreScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const { user, group, isAdmin } = useAuth();
  const styles = makeStyles(Colors);

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const Row = ({ iconName, iconColor, label, sublabel, onPress, isLast, badge }) => (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIconBox, { backgroundColor: (iconColor || Colors.primary) + '15' }]}>
        <Ionicons name={iconName} size={20} color={iconColor || Colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: iconColor || Colors.primary }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Mini profile header */}
      <TouchableOpacity
        style={styles.profileHeader}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.fullName || '—'}</Text>
          <Text style={styles.profileGroup}>{group?.name || 'No group selected'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        <Section title="Finance">
          <Row
            iconName="gift"
            iconColor={Colors.secondary}
            label="Payout Schedule"
            sublabel="Rotation order & upcoming payouts"
            onPress={() => navigation.navigate('Payout')}
          />
          <Row
            iconName="bar-chart"
            iconColor={Colors.info}
            label="Reports"
            sublabel="Financial summary & collection rate"
            onPress={() => navigation.navigate('Reports')}
            isLast
          />
        </Section>

        {isAdmin && (
          <Section title="Admin">
            <Row
              iconName="settings"
              iconColor={Colors.primary}
              label="Group Settings"
              sublabel="Manage contribution, cycle & payment accounts"
              onPress={() => navigation.navigate('GroupSettings')}
            />
            <Row
              iconName="person-add"
              iconColor={Colors.success}
              label="Add Member"
              onPress={() => navigation.navigate('AddMember')}
            />
            <Row
              iconName="mail-open"
              iconColor={Colors.warning}
              label="Join Requests"
              sublabel="Approve or decline pending requests"
              onPress={() => navigation.navigate('JoinRequests')}
              isLast
            />
          </Section>
        )}

        <Section title="My Account">
          <Row
            iconName="notifications"
            iconColor={Colors.primary}
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
          <Row
            iconName="layers"
            iconColor={Colors.info}
            label="My Groups"
            sublabel="Switch between groups"
            onPress={() => navigation.navigate('MyGroups')}
          />
          <Row
            iconName="search"
            iconColor={Colors.secondary}
            label="Browse Groups"
            onPress={() => navigation.navigate('BrowseGroups')}
            isLast
          />
        </Section>

        <Section title="Support">
          <Row
            iconName="help-circle"
            iconColor={Colors.info}
            label="Help & FAQ"
            onPress={() => navigation.navigate('HelpFAQ')}
          />
          <Row
            iconName="chatbubble"
            iconColor={Colors.primary}
            label="Contact Support"
            onPress={() => navigation.navigate('ContactSupport')}
          />
          <Row
            iconName="star"
            iconColor={Colors.secondary}
            label="Rate the App"
            onPress={() => navigation.navigate('RateApp')}
            isLast
          />
        </Section>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText:    { color: Colors.white, fontWeight: '700', fontSize: 16 },
  profileInfo:   { flex: 1 },
  profileName:   { ...Typography.label, color: Colors.textPrimary },
  profileGroup:  { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  container:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  section:       { marginBottom: Spacing.md },
  sectionTitle:  { ...Typography.label, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11, marginBottom: Spacing.sm, marginLeft: 2 },
  sectionCard:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  rowBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIconBox:    { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowInfo:       { flex: 1 },
  rowLabel:      { ...Typography.body1, color: Colors.textPrimary },
  rowSublabel:   { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  rowRight:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  badge:         { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  badgeText:     { color: Colors.white, fontSize: 11, fontWeight: '700' },
});

export default MoreScreen;
