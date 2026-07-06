import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Auth
import WelcomeScreen      from '../screens/auth/WelcomeScreen';
import LoginScreen        from '../screens/auth/LoginScreen';
import RegisterScreen     from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPScreen          from '../screens/auth/OTPScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main tabs
import DashboardScreen      from '../screens/main/DashboardScreen';
import MembersScreen        from '../screens/main/MembersScreen';
import ContributionsScreen  from '../screens/main/ContributionsScreen';
import LoansScreen          from '../screens/main/LoansScreen';
import ReportsScreen        from '../screens/main/ReportsScreen';
import PayoutScreen         from '../screens/main/PayoutScreen';

// Detail / modal
import AddMemberScreen      from '../screens/main/AddMemberScreen';
import MemberDetailScreen   from '../screens/main/MemberDetailScreen';
import AddContributionScreen from '../screens/main/AddContributionScreen';
import NewLoanScreen        from '../screens/main/NewLoanScreen';
import LoanDetailScreen     from '../screens/main/LoanDetailScreen';
import ProfileScreen        from '../screens/main/ProfileScreen';
import EditProfileScreen    from '../screens/main/EditProfileScreen';
import GroupSettingsScreen  from '../screens/main/GroupSettingsScreen';
import NotificationsScreen  from '../screens/main/NotificationsScreen';
import CreateGroupScreen    from '../screens/main/CreateGroupScreen';
import MyGroupsScreen       from '../screens/main/MyGroupsScreen';
import BrowseGroupsScreen   from '../screens/main/BrowseGroupsScreen';
import JoinRequestsScreen   from '../screens/main/JoinRequestsScreen';
import MemberPayScreen      from '../screens/main/MemberPayScreen';
import MyLoanRequestScreen  from '../screens/main/MyLoanRequestScreen';
import HelpFAQScreen        from '../screens/main/HelpFAQScreen';
import ContactSupportScreen from '../screens/main/ContactSupportScreen';
import RateAppScreen        from '../screens/main/RateAppScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ name, focused, color }) {
  return <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />;
}

function MainTabs() {
  const { Colors } = useTheme();
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
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard"     component={DashboardScreen}
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Members"       component={MembersScreen}
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="people" focused={focused} color={color} />, tabBarLabel: 'Members' }} />
      <Tab.Screen name="Contributions" component={ContributionsScreen}
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="wallet" focused={focused} color={color} />, tabBarLabel: 'Savings' }} />
      <Tab.Screen name="Loans"         component={LoansScreen}
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="hand-left" focused={focused} color={color} />, tabBarLabel: 'Loans' }} />
      <Tab.Screen name="Payout"        component={PayoutScreen}
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="gift" focused={focused} color={color} />, tabBarLabel: 'Payout' }} />
      <Tab.Screen name="Reports"       component={ReportsScreen}
        options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="bar-chart" focused={focused} color={color} />, tabBarLabel: 'Reports' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, loading } = useAuth();
  const { Colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // ── Authenticated stack ──────────────────────────
          <>
            <Stack.Screen name="MainTabs"       component={MainTabs} />
            <Stack.Screen name="AddMember"      component={AddMemberScreen}       options={{ presentation: 'modal' }} />
            <Stack.Screen name="AddContribution" component={AddContributionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="NewLoan"        component={NewLoanScreen}         options={{ presentation: 'modal' }} />
            <Stack.Screen name="MemberDetail"   component={MemberDetailScreen} />
            <Stack.Screen name="LoanDetail"     component={LoanDetailScreen} />
            <Stack.Screen name="Profile"        component={ProfileScreen} />
            <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
            <Stack.Screen name="GroupSettings"  component={GroupSettingsScreen} />
            <Stack.Screen name="Notifications"  component={NotificationsScreen} />
            <Stack.Screen name="CreateGroup"    component={CreateGroupScreen} />
            <Stack.Screen name="MyGroups"       component={MyGroupsScreen} />
            <Stack.Screen name="BrowseGroups"   component={BrowseGroupsScreen} />
            <Stack.Screen name="JoinRequests"   component={JoinRequestsScreen} />
            <Stack.Screen name="MemberPay"      component={MemberPayScreen}      options={{ presentation: 'modal' }} />
            <Stack.Screen name="MyLoanRequest"  component={MyLoanRequestScreen}  options={{ presentation: 'modal' }} />
            <Stack.Screen name="HelpFAQ"        component={HelpFAQScreen} />
            <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
            <Stack.Screen name="RateApp"        component={RateAppScreen} />
            {/* Also needed from Profile → Change Password */}
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OTP"            component={OTPScreen} />
            <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
          </>
        ) : (
          // ── Guest stack ─────────────────────────────────
          <>
            <Stack.Screen name="Welcome"        component={WelcomeScreen} />
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OTP"            component={OTPScreen} />
            <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
