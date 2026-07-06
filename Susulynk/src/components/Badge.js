import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Radius, Spacing } from '../theme/spacing';

const Badge = ({ label, type = 'neutral', size = 'md' }) => {
  const { Colors } = useTheme();

  const colorMap = {
    success: { bg: '#DCFCE7', text: '#166534' },
    error:   { bg: '#FEE2E2', text: '#991B1B' },
    warning: { bg: '#FEF3C7', text: '#92400E' },
    info:    { bg: '#DBEAFE', text: '#1E40AF' },
    neutral: { bg: Colors.background, text: Colors.textSecondary },
    primary: { bg: '#DCFCE7', text: Colors.primaryDark },
  };

  const c = colorMap[type] || colorMap.neutral;

  return (
    <View style={[{ backgroundColor: c.bg, paddingHorizontal: Spacing.sm + 2, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' }, size === 'sm' && { paddingHorizontal: Spacing.sm, paddingVertical: 2 }]}>
      <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text }, size === 'sm' && { fontSize: 11 }]}>
        {label}
      </Text>
    </View>
  );
};

export default Badge;
