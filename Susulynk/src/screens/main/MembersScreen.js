import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import Badge from '../../components/Badge';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';

// Mask phone: show first 3 and last 2 digits only e.g. 024*****67
const maskPhone = (phone = '') => {
  if (phone.length < 6) return '•••••';
  return phone.slice(0, 3) + '•'.repeat(phone.length - 5) + phone.slice(-2);
};

const MembersScreen = ({ navigation }) => {
  const { groupId, isAdmin, user } = useAuth();
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const avatarColors = [Colors.primary, Colors.secondary, Colors.info, Colors.success, '#8B5CF6', '#EC4899'];
  const [members, setMembers]     = useState([]);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('active');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!groupId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      // 'all' tab → pass status=ALL so backend returns every status (admin only)
      if (filter === 'all') {
        params.status = 'ALL';
      } else {
        params.status = filter.toUpperCase();
      }
      const data = await memberService.getMembers(groupId, params);
      setMembers(data);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [groupId, search, filter]);

  useEffect(() => { load(); }, [load]);

  // Re-fetch whenever we come back to this screen (e.g. after approving a request)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load(true));
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const renderMember = ({ item, index }) => {
    const name    = item.user?.fullName || '—';
    const rawPhone = item.user?.phone || '—';
    // Only admins and the member themselves see full phone numbers (deontology: minimal exposure)
    const isSelf  = item.user?.id === user?.id;
    const phone   = (isAdmin || isSelf) ? rawPhone : maskPhone(rawPhone);
    const status  = item.status?.toLowerCase();
    const role    = item.role?.toLowerCase();
    const joined  = new Date(item.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

    const badgeType = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'neutral';

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
        activeOpacity={0.85}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColors[index % avatarColors.length] }]}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {role === 'admin' && <Text style={styles.adminBadge}>👑</Text>}
          </View>
          <Text style={styles.phone}>{phone}</Text>
          <Text style={styles.contributions}>
            {item._count?.contributions ?? 0} contributions
          </Text>
        </View>
        <View style={styles.right}>
          <Badge label={status} type={badgeType} size="sm" />
          <Text style={styles.joined}>Joined {joined}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const counts = {
    all:      members.length,
    active:   members.filter(m => m.status === 'ACTIVE').length,
    pending:  members.filter(m => m.status === 'PENDING').length,
    inactive: members.filter(m => m.status === 'INACTIVE').length,
  };

  // Tabs visible to regular members: active only
  // Tabs visible to admins: all, active, pending, inactive
  const filterTabs = isAdmin
    ? ['active', 'pending', 'all', 'inactive']
    : ['active'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMember')}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
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
        {filterTabs.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' ? ` (${counts[f]})` : ` (${counts.all})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {filter === 'pending' ? 'No pending requests' : 'No members found'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full },
  addBtnText: { ...Typography.label, color: Colors.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, ...Typography.body2, color: Colors.textPrimary, paddingVertical: Spacing.sm + 2 },
  clearIcon: { fontSize: 14, color: Colors.textMuted, padding: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  separator: { height: Spacing.sm },
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
