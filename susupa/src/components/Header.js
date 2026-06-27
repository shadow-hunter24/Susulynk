import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { Spacing } from '../theme/spacing';

const Header = ({ title, subtitle, leftAction, rightAction, transparent = false, light = false }) => {
  const textColor = light ? Colors.white : Colors.textPrimary;

  return (
    <View style={[styles.header, transparent && styles.transparent]}>
      <View style={styles.left}>
        {leftAction && (
          <TouchableOpacity onPress={leftAction.onPress} style={styles.actionBtn}>
            {leftAction.icon ? leftAction.icon : (
              <Text style={[styles.actionText, { color: light ? Colors.white : Colors.primary }]}>
                {leftAction.label}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: light ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.actionBtn}>
            {rightAction.icon ? rightAction.icon : (
              <Text style={[styles.actionText, { color: light ? Colors.white : Colors.primary }]}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  transparent: { backgroundColor: 'transparent', borderBottomWidth: 0 },
  left: { width: 60, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 60, alignItems: 'flex-end' },
  title: { ...Typography.h4 },
  subtitle: { ...Typography.caption, marginTop: 2 },
  actionBtn: { padding: Spacing.xs },
  actionText: { ...Typography.label },
});

export default Header;
