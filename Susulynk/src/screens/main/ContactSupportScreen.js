import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking, Alert, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

const SUPPORT_EMAIL   = 'support@susulynk.com';
const SUPPORT_PHONE   = '+233 20 000 0000';
const WHATSAPP_NUMBER = '233200000000';

const TOPICS = ['Account issue', 'Contribution problem', 'Loan question', 'Payout concern', 'Technical bug', 'Other'];

const ContactSupportScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const { user } = useAuth();

  const [topic,   setTopic]   = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const openEmail = () => {
    const subject = encodeURIComponent(`[Susulynk Support] ${topic || 'General enquiry'}`);
    const body    = encodeURIComponent(`Name: ${user?.fullName || ''}\nPhone: ${user?.phone || ''}\n\n${message}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert('Could not open email', `Please email us at ${SUPPORT_EMAIL}`)
    );
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Hi Susulynk Support,\n\nName: ${user?.fullName || ''}\nPhone: ${user?.phone || ''}\nTopic: ${topic || 'General'}\n\n${message}`);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`).catch(() =>
      Alert.alert('WhatsApp not available', `Please call us at ${SUPPORT_PHONE}`)
    );
  };

  const openPhone = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`).catch(() =>
      Alert.alert('Could not open dialler', `Please call ${SUPPORT_PHONE}`)
    );
  };

  const handleSend = async () => {
    if (!topic) { Alert.alert('Select a topic', 'Please choose a topic before sending.'); return; }
    if (message.trim().length < 10) { Alert.alert('Message too short', 'Please describe your issue in more detail.'); return; }
    setSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      openEmail();
      setSent(true);
    } finally { setSending(false); }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <View style={styles.successIconBox}>
            <Ionicons name="mail" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successSub}>Your support request has been sent. We typically respond within 24 hours.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.quickRow}>
            {[
              { icon: 'call', label: 'Call Us', value: SUPPORT_PHONE, onPress: openPhone },
              { icon: 'logo-whatsapp', label: 'WhatsApp', value: 'Chat with us', onPress: openWhatsApp },
              { icon: 'mail', label: 'Email', value: SUPPORT_EMAIL, onPress: openEmail },
            ].map(({ icon, label, value, onPress }) => (
              <TouchableOpacity key={label} style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
                <View style={[styles.quickIconBox, { backgroundColor: Colors.primary + '15' }]}>
                  <Ionicons name={icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
                <Text style={styles.quickValue} numberOfLines={1}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hoursBanner}>
            <Ionicons name="time-outline" size={18} color={Colors.info} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.hoursText}>Support hours: Monday – Friday, 8 AM – 6 PM GMT</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send a Message</Text>
            <Text style={styles.formSub}>Describe your issue and we'll get back to you by email.</Text>

            <View style={styles.userInfoRow}>
              {[['Name', user?.fullName || '—'], ['Phone', user?.phone || '—']].map(([label, val]) => (
                <View key={label} style={styles.userInfoItem}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <Text style={styles.userInfoValue}>{val}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Topic *</Text>
            <View style={styles.topicGrid}>
              {TOPICS.map(t => (
                <TouchableOpacity key={t} style={[styles.topicBtn, topic === t && styles.topicBtnActive]} onPress={() => setTopic(t)} activeOpacity={0.8}>
                  <Text style={[styles.topicText, topic === t && styles.topicTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Message *</Text>
            <TextInput
              style={[styles.messageInput, { color: Colors.textPrimary, borderColor: Colors.border, backgroundColor: Colors.background }]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={Colors.textMuted}
              multiline numberOfLines={5} textAlignVertical="top"
              value={message} onChangeText={setMessage}
            />

            <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.7 }]} onPress={handleSend} disabled={sending} activeOpacity={0.85}>
              {sending ? <ActivityIndicator color={Colors.white} /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="send" size={16} color={Colors.white} />
                  <Text style={styles.sendBtnText}>Send Message</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.faqNudge} onPress={() => navigation.navigate('HelpFAQ')} activeOpacity={0.8}>
            <View style={[styles.faqNudgeIconBox, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.faqNudgeTitle}>Check the FAQ first</Text>
              <Text style={styles.faqNudgeSub}>Many questions are answered there.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:      { ...Typography.h4, color: Colors.textPrimary },
  container:        { paddingHorizontal: Spacing.lg },
  quickRow:         { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickCard:        { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  quickIconBox:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  quickLabel:       { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  quickValue:       { ...Typography.caption, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  hoursBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.info + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.info },
  hoursText:        { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  formCard:         { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  formTitle:        { ...Typography.h4, color: Colors.textPrimary, marginBottom: 4 },
  formSub:          { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.md },
  userInfoRow:      { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  userInfoItem:     { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.sm },
  userInfoValue:    { ...Typography.body2, color: Colors.textPrimary, marginTop: 2 },
  fieldLabel:       { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 },
  topicGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  topicBtn:         { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  topicBtnActive:   { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  topicText:        { ...Typography.caption, color: Colors.textSecondary },
  topicTextActive:  { color: Colors.primary, fontWeight: '600' },
  messageInput:     { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.md, minHeight: 120, ...Typography.body2, marginBottom: Spacing.md },
  sendBtn:          { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm + 4, alignItems: 'center' },
  sendBtnText:      { ...Typography.label, color: Colors.white, fontSize: 15 },
  faqNudge:         { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  faqNudgeIconBox:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  faqNudgeTitle:    { ...Typography.label, color: Colors.textPrimary },
  faqNudgeSub:      { ...Typography.caption, color: Colors.textSecondary },
  successScreen:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIconBox:   { marginBottom: Spacing.lg },
  successTitle:     { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.sm },
  successSub:       { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 26 },
  doneBtn:          { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  doneBtnText:      { ...Typography.label, color: Colors.white },
});

export default ContactSupportScreen;
