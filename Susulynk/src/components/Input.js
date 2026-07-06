import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
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
  const { Colors } = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [focused, setFocused]   = useState(false);

  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && (
        <Text style={{ ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.xs }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: error ? Colors.error : focused ? Colors.primary : Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        opacity: editable ? 1 : 0.7,
      }}>
        {leftIcon && <View style={{ marginRight: Spacing.sm }}>{leftIcon}</View>}
        <TextInput
          style={[{
            flex: 1,
            ...Typography.body1,
            color: Colors.textPrimary,
            paddingVertical: Spacing.sm + 2,
          }, multiline && { height: 100, textAlignVertical: 'top' }, inputStyle]}
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
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={{ marginLeft: Spacing.sm }}>
            <Text style={{ fontSize: 18 }}>{isSecure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={{ marginLeft: Spacing.sm }}>{rightIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={{ ...Typography.caption, color: Colors.error, marginTop: Spacing.xs }}>{error}</Text>
      ) : hint ? (
        <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs }}>{hint}</Text>
      ) : null}
    </View>
  );
};

export default Input;
