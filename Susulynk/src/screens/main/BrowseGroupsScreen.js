import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';

const groupColors = ['#1A6B3C', '#F5A623', '#3B82F6', '#22C55E', '#8B5CF6'];

const BrowseGroupsScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const { switchGroup, refreshUser } = useAuth();

  const [groups, setGroups]         = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const data = await groupService.browseGroups(search); setGroups(data); }
    catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleRequest = async (group) => {
    setRequesting(r => ({ ...r, [group.id]: true }));
    try {
      const res = await groupService.requestJoin(group.id);
      if (res.member) {
        await switchGroup({ id: res.member.group.id, name: res.member.group.name, contributionAmount: res.member.group.contributionAmount, currency: res.member.group.currency }, 'MEMBER');
        await refreshUser();
        Alert.alert('Joined!', `You are now a member of "${group.name}".`, [{ text: 'Go to Dashboard', onPress: () => navigation.navigate('MainTabs') }]);
      } else {
        Alert.alert('Request Sent', `Your request to join "${group.name}" has been sent. The admin will review it.`);
        load(true);
      }
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setRequesting(r => ({ ...r, [group.id]: false })); }
  };

  const renderGroup = ({ item, index }) => {
    const admin       = item.members?.[0]?.user?.fullName || '—';
    const memberCount = item._count?.members ?? 0;
    const isRequesting = requesting[item.id];
    const accentColor  = groupColors[index % groupColors.length];

    return (
      <View style={styles.groupCard}>
        <View style={[styles.groupIconBox, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name="business" size={26} color={accentColor} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.description ? <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text> : null}
          <Text style={styles.groupMeta}>{memberCount} member{memberCount !== 1 ? 's' : ''} · GHS {item.contributionAmount}/mo</Text>
          <Text style={styles.groupAdmin}>Admin: {admin}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>{item.cycleType}</Text></View>
            {item.requireApproval
              ? <View style={[styles.tag, { backgroundColor: Colors.warning + '20' }]}><Text style={[styles.tagText, { color: Colors.warning }]}>Approval required</Text></View>
              : <View style={[styles.tag, { backgroundColor: Colors.success + '20' }]}><Text style={[styles.tagText, { color: Colors.success }]}>Open to join</Text></View>
            }
          </View>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, isRequesting && { opacity: 0.6 }]}
          onPress={() => handleRequest(item)}
          disabled={isRequesting}
          activeOpacity={0.8}
        >
          {isRequesting
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.joinBtnText}>{item.requireApproval ? 'Request' : 'Join'}</Text>
          }
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Browse Groups</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateGroup')}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: Spacing.sm }} />
        <TextInput style={styles.searchInput} placeholder="Search groups by name..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtitle}>Groups you're not yet part of</Text>

      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} /> : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No groups found</Text>
              <Text style={styles.emptyText}>{search ? 'Try a different search term.' : 'No public groups available yet.'}</Text>
              <TouchableOpacity style={styles.newGroupBtn} onPress={() => navigation.navigate('CreateGroup')}>
                <Text style={styles.newGroupBtnText}>Start your own group</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  title:         { ...Typography.h2, color: Colors.textPrimary },
  createBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full },
  createBtnText: { ...Typography.label, color: Colors.white },
  searchBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  searchInput:   { flex: 1, ...Typography.body2, color: Colors.textPrimary, paddingVertical: Spacing.sm + 2 },
  subtitle:      { ...Typography.caption, color: Colors.textMuted, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  list:          { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  groupCard:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  groupIconBox:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, marginTop: 2 },
  groupInfo:     { flex: 1, marginRight: Spacing.sm },
  groupName:     { ...Typography.label, color: Colors.textPrimary, marginBottom: 2 },
  groupDesc:     { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  groupMeta:     { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  groupAdmin:    { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xs },
  tagRow:        { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  tag:           { backgroundColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:       { ...Typography.caption, color: Colors.textSecondary, fontSize: 10 },
  joinBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: 'center', minWidth: 64, alignItems: 'center' },
  joinBtnText:   { ...Typography.label, color: Colors.white, fontSize: 13 },
  empty:         { alignItems: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyTitle:    { ...Typography.h3, color: Colors.textPrimary },
  emptyText:     { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
  newGroupBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, marginTop: Spacing.sm },
  newGroupBtnText:{ ...Typography.label, color: Colors.white },
});

export default BrowseGroupsScreen;
