import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_SECTIONS = [
  {
    category: 'Getting Started', icon: 'rocket-outline',
    items: [
      { q: 'What is Susulynk?', a: 'Susulynk is a digital platform for managing Susu (rotating savings) groups. It helps group members track contributions, loans, and payouts — all in one place.' },
      { q: 'How do I join a group?', a: 'Go to Profile → Browse Groups to find a public group and send a join request. The group admin will approve or decline your request.' },
      { q: 'Can I be in multiple groups?', a: 'Yes! You can belong to as many groups as you like. Switch between them from Profile → My Groups.' },
      { q: 'How do I create my own group?', a: 'Tap Profile → Create New Group. Fill in the group name, contribution amount, cycle type, and settings. You become admin automatically.' },
    ],
  },
  {
    category: 'Contributions', icon: 'wallet-outline',
    items: [
      { q: 'How do I make a contribution?', a: 'Tap "Pay Now" from the dashboard. Select your payment method, enter your MoMo or bank transfer reference, and submit. The admin confirms the payment.' },
      { q: 'Where do I send my contribution?', a: 'Payment details (MoMo number or bank account) are set by your group admin and shown on the payment screen.' },
      { q: 'What happens if I miss a contribution?', a: 'Missed contributions are marked Overdue. Contact your group admin — they may apply a late fee depending on your group rules.' },
      { q: 'Can I pay for multiple months at once?', a: 'Each cycle is recorded separately. If you want to pay ahead, contact your admin and they can record the payments for the relevant cycles.' },
    ],
  },
  {
    category: 'Loans', icon: 'hand-left-outline',
    items: [
      { q: 'How do I request a loan?', a: 'From the dashboard tap "Request Loan", enter the amount, repayment period, and purpose, then submit. The admin will review and respond.' },
      { q: 'What is the interest rate?', a: 'Interest rates are set by each group admin. You can see the rate on the loan request screen before you submit.' },
      { q: 'Can I have more than one loan at a time?', a: 'No — only one active or pending loan per group at a time. Fully repay your existing loan before requesting another.' },
      { q: 'How do I repay a loan?', a: 'Go to Loans, tap your active loan, then tap "Submit Repayment". Enter the amount and your payment reference.' },
    ],
  },
  {
    category: 'Payouts', icon: 'gift-outline',
    items: [
      { q: 'How are payouts scheduled?', a: 'Payouts follow the rotation order set by the admin. Each member gets the pot once per cycle. Your position is shown on the Payout screen.' },
      { q: 'When will I receive my payout?', a: 'Check the Payout tab to see your scheduled month and position. The admin marks it paid once funds are sent to you.' },
    ],
  },
  {
    category: 'Account & Security', icon: 'shield-checkmark-outline',
    items: [
      { q: 'How do I change my password?', a: 'Go to Profile → Change Password. You will receive an OTP on your registered phone number to verify the change.' },
      { q: 'How do I update my profile?', a: 'Go to Profile → Edit Profile to update your name, email, or bio.' },
      { q: 'Is my data safe?', a: 'Yes. All data is encrypted in transit and at rest. We never share your personal information with third parties.' },
    ],
  },
];

const FAQItem = ({ item }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => !o);
  };

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={open ? Colors.primary : Colors.textMuted} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
};

const HelpFAQScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection(prev => (prev === i ? null : i));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Ionicons name="help-circle" size={40} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers to the most common questions about Susulynk.</Text>
        </View>

        {FAQ_SECTIONS.map((section, si) => {
          const isOpen = openSection === si;
          return (
            <View key={si} style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(si)} activeOpacity={0.8}>
                <View style={styles.sectionLeft}>
                  <View style={[styles.sectionIconBox, { backgroundColor: Colors.primary + '15' }]}>
                    <Ionicons name={section.icon} size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>{section.category}</Text>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isOpen ? Colors.primary : Colors.textMuted} />
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.sectionBody}>
                  {section.items.map((item, qi) => <FAQItem key={qi} item={item} />)}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Still need help?</Text>
          <Text style={styles.helpText}>If you didn't find your answer here, our support team is ready to assist.</Text>
          <TouchableOpacity style={styles.helpBtn} onPress={() => navigation.navigate('ContactSupport')} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.helpBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors) => StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle:    { ...Typography.h4, color: Colors.textPrimary },
  container:      { paddingHorizontal: Spacing.lg },
  hero:           { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
  heroIconBox:    { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heroTitle:      { ...Typography.h3, color: Colors.white, marginBottom: Spacing.xs },
  heroSub:        { ...Typography.body2, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  section:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.sm, overflow: 'hidden', shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  sectionLeft:    { flexDirection: 'row', alignItems: 'center' },
  sectionIconBox: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  sectionTitle:   { ...Typography.label, color: Colors.textPrimary },
  sectionBody:    { borderTopWidth: 1, borderTopColor: Colors.border },
  faqItem:        { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  faqHeader:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  faqQ:           { ...Typography.body2, color: Colors.textPrimary, flex: 1, fontWeight: '500', paddingRight: Spacing.sm },
  faqA:           { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 22 },
  helpBox:        { backgroundColor: Colors.primary + '10', borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30', alignItems: 'center' },
  helpTitle:      { ...Typography.h4, color: Colors.primary, marginBottom: Spacing.xs },
  helpText:       { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 20 },
  helpBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  helpBtnText:    { ...Typography.label, color: Colors.white },
});

export default HelpFAQScreen;
