import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { Radius, Spacing } from '../theme/spacing';

const Badge = ({ label, type = 'neutral', size = 'md' }) => {
  const colors = {
    success: { bg: '#DCFCE7', text: '#166534' },
    error: { bg: '#FEE2E2', text: '#991B1B' },
    warning: { bg: '#FEF3C7', text: '#92400E' },
    info: { bg: '#DBEAFE', text: '#1E40AF' },
    neutral: { bg: Colors.background, text: Colors.textSecondary },
    primary: { bg: '#DCFCE7', text: Colors.primaryDark },
  };

  const c = colors[type] || colors.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === 'sm' && styles.small]}>
      <Text style={[styles.text, { color: c.text }, size === 'sm' && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 13, fontWeight: '600' },
  small: { paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  smallText: { fontSize: 11 },
});

export default Badge;
