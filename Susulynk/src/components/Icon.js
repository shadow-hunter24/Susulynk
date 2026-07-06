/**
 * Susulynk Icon wrapper
 * Single import point — uses Ionicons (clean, modern, works on iOS & Android).
 * Usage: <Icon name="wallet-outline" size={22} color={Colors.primary} />
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const Icon = ({ name, size = 22, color = '#1A6B3C', style }) => (
  <Ionicons name={name} size={size} color={color} style={style} />
);

export default Icon;
