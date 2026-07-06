import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Radius, Spacing } from '../theme/spacing';
import Typography from '../theme/typography';

const StatCard = ({ label, value, iconName, color, trend, trendUp }) => {
  const { Colors } = useTheme();
  const tint = color || Colors.primary;

  return (
    <View style={{
      backgroundColor: Colors.surface, borderRadius: Radius.lg,
      padding: Spacing.md, borderTopWidth: 3, borderTopColor: tint,
      flex: 1, shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
      shadowRadius: 6, elevation: 2, margin: Spacing.xs,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {iconName && (
          <View style={{
            width: 44, height: 44, borderRadius: Radius.md,
            backgroundColor: tint + '18', alignItems: 'center',
            justifyContent: 'center', marginRight: Spacing.sm,
          }}>
            <Ionicons name={iconName} size={22} color={tint} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 }}>{label}</Text>
          <Text style={{ ...Typography.h3, color: tint }}>{value}</Text>
          {trend && (
            <Text style={{ ...Typography.caption, color: trendUp ? Colors.success : Colors.error, marginTop: 2 }}>
              {trendUp ? '▲' : '▼'} {trend}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default StatCard;
