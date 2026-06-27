import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../theme/colors';
import { Radius, Spacing } from '../theme/spacing';

/**
 * Reusable Card component - can be pressable or static
 */
const Card = ({ children, onPress, style, noPadding = false }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, noPadding && styles.noPadding, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  noPadding: { padding: 0 },
});

export default Card;
