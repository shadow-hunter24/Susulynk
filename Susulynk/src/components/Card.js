import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Radius, Spacing } from '../theme/spacing';

const Card = ({ children, onPress, style, noPadding = false }) => {
  const { Colors } = useTheme();

  const cardStyle = {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: noPadding ? 0 : Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.md,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
};

export default Card;
