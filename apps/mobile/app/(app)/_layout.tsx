import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0F62FE' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#0F62FE',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Projets',
          tabBarLabel: 'Projets',
          tabBarIcon: () => <Text>📁</Text>,
        }}
      />
      <Tabs.Screen
        name="tests/wc/new"
        options={{
          title: 'Nouvel essai',
          tabBarLabel: 'Essai WC',
          tabBarIcon: () => <Text>🧪</Text>,
        }}
      />
    </Tabs>
  );
}
