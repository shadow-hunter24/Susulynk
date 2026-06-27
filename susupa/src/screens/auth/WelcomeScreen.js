import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import Button from '../../components/Button';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SP</Text>
        </View>
        <Text style={styles.brand}>SusuPa</Text>
        <Text style={styles.tagline}>Digital Savings, Together</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {[
          { icon: '💰', title: 'Track Contributions', desc: "Record every member's savings in real time" },
          { icon: '🤝', title: 'Manage Groups', desc: 'Administer your Susu group with ease' },
          { icon: '📊', title: 'Clear Reports', desc: 'Get instant financial summaries and insights' },
        ].map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Get Started" onPress={() => navigation.navigate('Register')} variant="primary" size="lg" />
        <View style={{ height: Spacing.sm }} />
        <Button title="I already have an account" onPress={() => navigation.navigate('Login')} variant="outline" size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  hero: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  logoText: { fontSize: 36, fontWeight: '800', color: Colors.white },
  brand: { ...Typography.h1, color: Colors.primary, letterSpacing: 1 },
  tagline: { ...Typography.body1, color: Colors.textSecondary, marginTop: Spacing.xs },
  features: { flex: 1, justifyContent: 'center' },
  featureItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  featureIcon: { fontSize: 28, marginRight: Spacing.md },
  featureText: { flex: 1 },
  featureTitle: { ...Typography.label, color: Colors.textPrimary },
  featureDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  actions: { paddingBottom: Spacing.xl },
});

export default WelcomeScreen;
