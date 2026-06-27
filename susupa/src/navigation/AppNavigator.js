import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import MembersScreen from '../screens/main/MembersScreen';
import ContributionsScreen from '../screens/main/ContributionsScreen';
import LoansScreen from '../screens/main/LoansScreen';
import ReportsScreen from '../screens/main/ReportsScreen';

// Detail / form screens
import AddMemberScreen from '../screens/main/AddMemberScreen';
import MemberDetailScreen from '../screens/main/MemberDetailScreen';
import AddContributionScreen from '../screens/main/AddContributionScreen';
import NewLoanScreen from '../screens/main/NewLoanScreen';
import LoanDetailScreen from '../screens/main/LoanDetailScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

import Colors from '../theme/colors';
import Typography from '../theme/typography';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon component
const TabIcon = ({ emoji, focused, label }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  </View>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { ...Typography.caption, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />, tabBarLabel: 'Members' }}
      />
      <Tab.Screen
        name="Contributions"
        component={ContributionsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />, tabBarLabel: 'Savings' }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" focused={focused} />, tabBarLabel: 'Loans' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />, tabBarLabel: 'Reports' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
        {/* Auth Stack */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Main App */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Detail / Modal screens */}
        <Stack.Screen
          name="AddMember"
          component={AddMemberScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
        <Stack.Screen
          name="AddContribution"
          component={AddContributionScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="NewLoan"
          component={NewLoanScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
