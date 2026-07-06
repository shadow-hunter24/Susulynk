import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Auth
import WelcomeScreen        from '../screens/auth/WelcomeScreen';
import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterScreen       from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPScreen            from '../screens/auth/OTPScreen';
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen';

// Tab screens (4 tabs)
import DashboardScreen     from '../screens/main/DashboardScreen';
import MembersScreen       from '../screens/main/MembersScreen';
import ContributionsScreen from '../screens/main/ContributionsScreen';
import LoansScreen         from '../screens/main/LoansScreen';
import MoreScreen          from '../screens/main/MoreScreen';

// Stack screens (navigated to from tabs / quick actions)
import PayoutScreen         from '../screens/main/PayoutScreen';
import ReportsScreen        from '../screens/main/ReportsScreen';
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
  return (
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={24}
      color={color}
    />
  );
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
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ focused, color }) => <TabIcon name="people" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Contributions"
        component={ContributionsScreen}
        options={{
          tabBarLabel: 'Savings',
          tabBarIcon: ({ focused, color }) => <TabIcon name="wallet" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          tabBarLabel: 'Loans',
          tabBarIcon: ({ focused, color }) => <TabIcon name="hand-left" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused, color }) => <TabIcon name="grid" focused={focused} color={color} />,
        }}
      />
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
          <>
            <Stack.Screen name="MainTabs"        component={MainTabs} />
            {/* Finance screens — accessible from More and Dashboard quick actions */}
            <Stack.Screen name="Payout"          component={PayoutScreen} />
            <Stack.Screen name="Reports"         component={ReportsScreen} />
            {/* Member screens */}
            <Stack.Screen name="AddMember"       component={AddMemberScreen}       options={{ presentation: 'modal' }} />
            <Stack.Screen name="MemberDetail"    component={MemberDetailScreen} />
            {/* Contribution screens */}
            <Stack.Screen name="AddContribution" component={AddContributionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="MemberPay"       component={MemberPayScreen}       options={{ presentation: 'modal' }} />
            {/* Loan screens */}
            <Stack.Screen name="NewLoan"         component={NewLoanScreen}         options={{ presentation: 'modal' }} />
            <Stack.Screen name="LoanDetail"      component={LoanDetailScreen} />
            <Stack.Screen name="MyLoanRequest"   component={MyLoanRequestScreen}   options={{ presentation: 'modal' }} />
            {/* Profile & settings */}
            <Stack.Screen name="Profile"         component={ProfileScreen} />
            <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
            <Stack.Screen name="GroupSettings"   component={GroupSettingsScreen} />
            <Stack.Screen name="Notifications"   component={NotificationsScreen} />
            {/* Group management */}
            <Stack.Screen name="CreateGroup"     component={CreateGroupScreen} />
            <Stack.Screen name="MyGroups"        component={MyGroupsScreen} />
            <Stack.Screen name="BrowseGroups"    component={BrowseGroupsScreen} />
            <Stack.Screen name="JoinRequests"    component={JoinRequestsScreen} />
            {/* Support */}
            <Stack.Screen name="HelpFAQ"         component={HelpFAQScreen} />
            <Stack.Screen name="ContactSupport"  component={ContactSupportScreen} />
            <Stack.Screen name="RateApp"         component={RateAppScreen} />
            {/* Auth flows accessible while logged in */}
            <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
            <Stack.Screen name="OTP"             component={OTPScreen} />
            <Stack.Screen name="ResetPassword"   component={ResetPasswordScreen} />
          </>
        ) : (
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
