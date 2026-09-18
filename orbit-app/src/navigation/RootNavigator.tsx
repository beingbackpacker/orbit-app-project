import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, fonts } from "../theme/theme";

import SignInScreen from "../screens/SignInScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import TasksScreen from "../screens/TasksScreen";
import CalendarScreen from "../screens/CalendarScreen";
import MeetingScreen from "../screens/MeetingScreen";
import InboxScreen from "../screens/InboxScreen";
import ComposeScreen from "../screens/ComposeScreen";
import RemindersScreen from "../screens/RemindersScreen";
import CalculatorScreen from "../screens/CalculatorScreen";
import ChatScreen from "../screens/ChatScreen";
import FocusScreen from "../screens/FocusScreen";
import TeamScreen from "../screens/TeamScreen";
import VaultScreen from "../screens/VaultScreen";

export type RootStackParamList = {
  SignIn: undefined;
  Onboarding: undefined;
  Tabs: undefined;
  Calendar: undefined;
  Meeting: { id: string };
  Compose: { mailId: string; from: string };
  Reminders: undefined;
  Calculator: undefined;
  Focus: undefined;
  Vault: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = { Today: "◐", Tasks: "☰", Orbit: "◎", Mail: "✉", Team: "◈" };

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 15, color: focused ? colors.ink : "#A9A296" }}>{TAB_ICONS[label]}</Text>;
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, color: focused ? colors.ink : "#A9A296" }}>{label}</Text>;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "rgba(245,242,236,0.96)", borderTopColor: colors.border, height: 78, paddingTop: 8 },
        tabBarItemStyle: { borderRadius: 12 }
      }}
    >
      <Tab.Screen name="Today" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Today" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} /> }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Tasks" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Tasks" focused={focused} /> }} />
      <Tab.Screen name="Orbit" component={ChatScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Orbit" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Orbit" focused={focused} /> }} />
      <Tab.Screen name="Mail" component={InboxScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Mail" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Mail" focused={focused} /> }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Team" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Team" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, onboarded } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={!user ? "SignIn" : onboarded ? "Tabs" : "Onboarding"}>
      {!user ? (
        <Stack.Screen name="SignIn" component={SignInScreen} />
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="Meeting" component={MeetingScreen} />
          <Stack.Screen name="Compose" component={ComposeScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Calculator" component={CalculatorScreen} />
          <Stack.Screen name="Focus" component={FocusScreen} options={{ animation: "fade" }} />
          <Stack.Screen name="Vault" component={VaultScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
