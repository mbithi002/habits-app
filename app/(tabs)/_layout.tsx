import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#f5f5f5" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#f5f5f5",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#f6ad55",
        tabBarInactiveTintColor: "#666666",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Habits",
          tabBarIcon: ({ color, focused }) => {
            return (
              <MaterialCommunityIcons
                name="calendar-today"
                size={24}
                color={focused ? color : "black"}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ color, focused }) => {
            return (
              <MaterialCommunityIcons
                name="chart-line"
                size={24}
                color={focused ? color : "black"}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="add-habit"
        options={{
          title: "Add Habit",
          tabBarIcon: ({ color, focused }) => {
            return (
              <MaterialCommunityIcons
                name="plus-circle"
                size={24}
                color={focused ? color : "black"}
              />
            );
          },
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
