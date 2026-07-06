/**
 * Avatar component
 * Shows profile photo if avatarUrl is set, otherwise shows initials.
 * Usage:
 *   <Avatar name="Kofi Mensah" uri={user.avatarUrl} size={48} />
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Avatar = ({ name = '', uri, size = 48, fontSize, bgColor, style }) => {
  const { Colors } = useTheme();
  const initials = name
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const computedFontSize = fontSize || Math.round(size * 0.35);
  const bg = bgColor || Colors.primary;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  return (
    <View style={[containerStyle, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: computedFontSize, fontWeight: '700', color: Colors.white }}>
          {initials}
        </Text>
      )}
    </View>
  );
};

export default Avatar;
