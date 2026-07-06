import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Typography from '../theme/typography';
import { Spacing } from '../theme/spacing';

const Header = ({ title, subtitle, leftAction, rightAction, transparent = false, light = false }) => {
  const { Colors } = useTheme();
  const textColor = light ? Colors.white : Colors.textPrimary;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
      backgroundColor: transparent ? 'transparent' : Colors.surface,
      borderBottomWidth: transparent ? 0 : 1,
      borderBottomColor: Colors.border,
    }}>
      <View style={{ width: 60, alignItems: 'flex-start' }}>
        {leftAction && (
          <TouchableOpacity onPress={leftAction.onPress} style={{ padding: Spacing.xs }}>
            {leftAction.icon || (
              <Text style={{ ...Typography.label, color: light ? Colors.white : Colors.primary }}>
                {leftAction.label}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ ...Typography.h4, color: textColor }} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={{ ...Typography.caption, color: light ? 'rgba(255,255,255,0.8)' : Colors.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={{ width: 60, alignItems: 'flex-end' }}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={{ padding: Spacing.xs }}>
            {rightAction.icon || (
              <Text style={{ ...Typography.label, color: light ? Colors.white : Colors.primary }}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Header;
