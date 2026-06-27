import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { Radius, Spacing } from '../theme/spacing';
import Typography from '../theme/typography';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  hint,
  leftIcon,
  rightIcon,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...rest
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && styles.focused,
        error && styles.errorBorder,
        !editable && styles.disabled,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, multiline && styles.multiline, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.rightIcon}>
            <Text style={styles.toggleText}>{isSecure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  focused: { borderColor: Colors.primary },
  errorBorder: { borderColor: Colors.error },
  disabled: { backgroundColor: Colors.background, opacity: 0.7 },
  input: {
    flex: 1, ...Typography.body1,
    color: Colors.textPrimary, paddingVertical: Spacing.sm + 2,
  },
  multiline: { height: 100, textAlignVertical: 'top' },
  leftIcon: { marginRight: Spacing.sm },
  rightIcon: { marginLeft: Spacing.sm },
  toggleText: { fontSize: 18 },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: Spacing.xs },
  hintText: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
});

export default Input;
