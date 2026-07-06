import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Radius, Spacing } from '../theme/spacing';
import Typography from '../theme/typography';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const { Colors } = useTheme();

  const variantStyles = {
    primary:   { bg: Colors.primary,  border: null,           labelColor: Colors.white },
    secondary: { bg: Colors.secondary,border: null,           labelColor: Colors.white },
    outline:   { bg: 'transparent',   border: Colors.primary, labelColor: Colors.primary },
    ghost:     { bg: 'transparent',   border: null,           labelColor: Colors.primary },
    danger:    { bg: Colors.error,    border: null,           labelColor: Colors.white },
  };

  const sizeStyles = {
    sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md, fontSize: 14 },
    md: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg, fontSize: 16 },
    lg: { paddingVertical: Spacing.md,     paddingHorizontal: Spacing.xl, fontSize: 18 },
  };

  const vs = variantStyles[variant] || variantStyles.primary;
  const ss = sizeStyles[size] || sizeStyles.md;

  const containerStyle = {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: vs.bg,
    paddingVertical: ss.paddingVertical,
    paddingHorizontal: ss.paddingHorizontal,
    ...(vs.border ? { borderWidth: 1.5, borderColor: vs.border } : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...((disabled || loading) ? { opacity: 0.5 } : {}),
  };

  const labelStyle = {
    ...Typography.button,
    color: vs.labelColor,
    fontSize: ss.fontSize,
  };

  return (
    <TouchableOpacity style={[containerStyle, style]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && <View style={{ marginRight: Spacing.sm }}>{icon}</View>}
          <Text style={[labelStyle, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
