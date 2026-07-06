import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Linking, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const APP_STORE_URL  = 'https://apps.apple.com/app/susulynk';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.susulynk';
const FEEDBACK_EMAIL = 'feedback@susulynk.com';

const STAR_LABELS       = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
const QUICK_TAGS_POS    = ['Easy to use', 'Saves time', 'Great design', 'Reliable', 'Helps my group', 'Love notifications'];
const QUICK_TAGS_CRIT   = ['Needs more features', 'Occasional bugs', 'Slow loading', 'Confusing navigation', 'Missing dark mode'];

const RateAppScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = makeStyles(Colors);

  const [stars,    setStars]    = useState(0);
  const [hovering, setHovering] = useState(0);
  const [tags,     setTags]     = useState([]);
  const [review,   setReview]   = useState('');
  const [sending,  setSending]  = useState(false);
  const [done,     setDone]     = useState(false);

  const displayed  = hovering || stars;
  const isPositive = displayed >= 4;
  const quickTags  = isPositive ? QUICK_TAGS_POS : QUICK_TAGS_CRIT;

  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const openStore = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => Alert.alert('Could not open store', 'Please search for "Susulynk" in the app store.'));
  };

  const handleSubmit = async () => {
    if (!stars) { Alert.alert('Rate us first', 'Tap a star to give your rating.'); return; }
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      if (stars < 4) {
        const subject = encodeURIComponent(`[Susulynk Feedback] ${stars} star${stars !== 1 ? 's' : ''}`);
        const body    = encodeURIComponent(`Rating: ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}\nTags: ${tags.join(', ') || 'none'}\n\nFeedback:\n${review}`);
        Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`).catch(() => {});
      }
      setDone(true);
    } finally { setSending(false); }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          {stars >= 4 ? (
            <>
              <Ionicons name="star" size={72} color={Colors.secondary} style={{ marginBottom: Spacing.lg }} />
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successSub}>We're glad you love Susulynk. Would you mind leaving a quick review on the store?</Text>
              <TouchableOpacity style={styles.storeBtn} onPress={openStore} activeOpacity={0.85}>
                <Ionicons name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google-playstore'} size={18} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.storeBtnText}>{Platform.OS === 'ios' ? 'Rate on App Store' : 'Rate on Play Store'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.skipBtnText}>Maybe later</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="heart" size={72} color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
              <Text style={styles.successTitle}>Thanks for the feedback</Text>
              <Text style={styles.successSub}>Your input helps us improve Susulynk for everyone.</Text>
              <TouchableOpacity style={styles.storeBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={styles.storeBtnText}>Back to Profile</Text>
              </TouchableOpacity>
            </>
          )}
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
          <Text style={styles.headerTitle}>Rate the App</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Ionicons name="heart" size={48} color={Colors.white} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.heroTitle}>Enjoying Susulynk?</Text>
            <Text style={styles.heroSub}>Your feedback helps us build a better app for every Susu group in Ghana.</Text>
          </View>

          <View style={styles.ratingCard}>
            <Text style={styles.ratingPrompt}>How would you rate your experience?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setStars(n)} onPressIn={() => setHovering(n)} onPressOut={() => setHovering(0)} style={styles.starBtn} activeOpacity={0.8}>
                  <Ionicons name={n <= displayed ? 'star' : 'star-outline'} size={44} color={n <= displayed ? Colors.secondary : Colors.border} />
                </TouchableOpacity>
              ))}
            </View>
            {displayed > 0 && <Text style={styles.starLabel}>{STAR_LABELS[displayed]}</Text>}
          </View>

          {stars > 0 && (
            <View style={styles.tagsCard}>
              <Text style={styles.tagsTitle}>{isPositive ? 'What do you love most?' : 'What could be better?'}</Text>
              <View style={styles.tagsGrid}>
                {quickTags.map(tag => (
                  <TouchableOpacity key={tag} style={[styles.tag, tags.includes(tag) && styles.tagActive]} onPress={() => toggleTag(tag)} activeOpacity={0.8}>
                    <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {stars > 0 && (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Anything else to add? (optional)</Text>
              <TextInput
                style={[styles.reviewInput, { color: Colors.textPrimary, borderColor: Colors.border, backgroundColor: Colors.background }]}
                placeholder={isPositive ? 'Tell us what you enjoy most...' : 'Tell us how we can improve...'}
                placeholderTextColor={Colors.textMuted}
                multiline numberOfLines={4} textAlignVertical="top"
                value={review} onChangeText={setReview}
              />
            </View>
          )}

          {stars > 0 && (
            <TouchableOpacity style={[styles.submitBtn, sending && { opacity: 0.7 }]} onPress={handleSubmit} disabled={sending} activeOpacity={0.85}>
              {sending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit Rating</Text>}
            </TouchableOpacity>
          )}

          <View style={{ height: Spacing.xl }} />
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
  container:     { paddingHorizontal: Spacing.lg },
  hero:          { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
  heroTitle:     { ...Typography.h3, color: Colors.white, marginBottom: Spacing.xs },
  heroSub:       { ...Typography.body2, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  ratingCard:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, alignItems: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  ratingPrompt:  { ...Typography.body1, color: Colors.textPrimary, marginBottom: Spacing.lg, textAlign: 'center' },
  starsRow:      { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  starBtn:       { padding: 4 },
  starLabel:     { ...Typography.h4, color: Colors.secondary, marginTop: Spacing.xs },
  tagsCard:      { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  tagsTitle:     { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.md },
  tagsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag:           { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  tagActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  tagText:       { ...Typography.caption, color: Colors.textSecondary },
  tagTextActive: { color: Colors.primary, fontWeight: '600' },
  reviewCard:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  reviewTitle:   { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.md },
  reviewInput:   { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.md, minHeight: 100, ...Typography.body2 },
  submitBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.sm + 4, alignItems: 'center', marginBottom: Spacing.sm },
  submitBtnText: { ...Typography.label, color: Colors.white, fontSize: 15 },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successTitle:  { ...Typography.h2, color: Colors.primary, marginBottom: Spacing.sm },
  successSub:    { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 26 },
  storeBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, marginBottom: Spacing.md },
  storeBtnText:  { ...Typography.label, color: Colors.white },
  skipBtn:       { paddingVertical: Spacing.sm },
  skipBtnText:   { ...Typography.body2, color: Colors.textMuted },
});

export default RateAppScreen;
