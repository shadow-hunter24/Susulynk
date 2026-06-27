import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { Radius, Spacing } from '../theme/spacing';
import Typography from '../theme/typography';

/**
 * Summary stat card for dashboards
 */
const StatCard = ({ label, value, icon, color = Colors.primary, trend, trendUp }) => {
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {trend && (
            <Text style={[styles.trend, { color: trendUp ? Colors.success : Colors.error }]}>
              {trendUp ? '▲' : '▼'} {trend}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderTopWidth: 3,
    flex: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    margin: Spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 2 },
  value: { ...Typography.h3 },
  trend: { ...Typography.caption, marginTop: 2 },
});

export default StatCard;
