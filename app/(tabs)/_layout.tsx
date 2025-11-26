// app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import useTimerStore from '../../store/useTimerStore';

export default function TabLayout() {
  const isDarkMode = useTimerStore(state => state.isDarkMode);
  const tintColor = isDarkMode ? '#81b0ff' : '#007AFF';
  const backgroundColor = isDarkMode ? '#1f1f1f' : '#fff'; 


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopColor: isDarkMode ? '#333' : '#eee',
        },
        headerStyle: { backgroundColor: backgroundColor },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer & PB',
          tabBarIcon: ({ color }) => <FontAwesome5 name="stopwatch" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis Log',
          tabBarIcon: ({ color }) => <MaterialIcons name="assessment" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}