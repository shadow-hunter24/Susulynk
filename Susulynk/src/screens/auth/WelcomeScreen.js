import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Button from '../../components/Button';
import Colors from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import Typography from '../../theme/typography';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>Susulynk</Text>
        <Text style={styles.tagline}>Digital Savings, Together</Text>
      </View>

      {/* Feature Cards */}
      <View style={styles.features}>
        {[
          { icon: '💰', title: 'Track Contributions', desc: 'Record every member\'s savings in real time' },
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

      {/* CTA Buttons */}
      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('Register')}
          variant="primary"
          size="lg"
        />
        <View style={styles.spacer} />
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  brand: {
    ...Typography.h1,
    color: Colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    ...Typography.body1,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: { fontSize: 28, marginRight: Spacing.md },
  featureText: { flex: 1 },
  featureTitle: { ...Typography.label, color: Colors.textPrimary },
  featureDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  actions: {
    paddingBottom: Spacing.xl,
  },
  spacer: { height: Spacing.sm },
});

export default WelcomeScreen;
