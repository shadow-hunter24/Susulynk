import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import Badge from '../../components/Badge';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const MEMBERS = [
  { id: '1', name: 'Ama Owusu', phone: '0241234567', role: 'admin', status: 'active', contributions: 'GHS 2,400', joined: 'Jan 2024', initials: 'AO' },
  { id: '2', name: 'Kwame Asante', phone: '0551234567', role: 'member', status: 'active', contributions: 'GHS 1,800', joined: 'Feb 2024', initials: 'KA' },
  { id: '3', name: 'Abena Sarpong', phone: '0271234567', role: 'member', status: 'active', contributions: 'GHS 2,200', joined: 'Jan 2024', initials: 'AS' },
  { id: '4', name: 'Yaw Darko', phone: '0201234567', role: 'member', status: 'inactive', contributions: 'GHS 600', joined: 'Mar 2024', initials: 'YD' },
  { id: '5', name: 'Akosua Mensah', phone: '0301234567', role: 'member', status: 'active', contributions: 'GHS 2,000', joined: 'Jan 2024', initials: 'AM' },
  { id: '6', name: 'Kofi Boateng', phone: '0241239876', role: 'member', status: 'active', contributions: 'GHS 1,600', joined: 'Apr 2024', initials: 'KB' },
];

const avatarColors = [Colors.primary, Colors.secondary, Colors.info, Colors.success, '#8B5CF6', '#EC4899'];

const MembersScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = MEMBERS.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMember')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {['all', 'active', 'inactive'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' ? ` (${MEMBERS.length})` : ` (${MEMBERS.filter(m => m.status === f).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.memberCard}
            onPress={() => navigation.navigate('MemberDetail', { member: item })}
            activeOpacity={0.85}
          >
            <View style={[styles.avatar, { backgroundColor: avatarColors[index % avatarColors.length] }]}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.role === 'admin' && <Text style={styles.adminBadge}>👑</Text>}
              </View>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.contributions}>Total: {item.contributions}</Text>
            </View>
            <View style={styles.right}>
              <Badge label={item.status} type={item.status === 'active' ? 'success' : 'neutral'} size="sm" />
              <Text style={styles.joined}>Joined {item.joined}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2, borderRadius: Radius.full,
  },
  addBtnText: { ...Typography.label, color: Colors.white },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.textPrimary, paddingVertical: Spacing.sm + 2 },
  clearIcon: { fontSize: 14, color: Colors.textMuted, padding: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  filterTab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...Typography.label, color: Colors.textPrimary },
  adminBadge: { fontSize: 14 },
  phone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  contributions: { ...Typography.caption, color: Colors.primary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  joined: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body1, color: Colors.textSecondary },
});

export default MembersScreen;
