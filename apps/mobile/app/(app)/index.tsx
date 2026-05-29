import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { clearTokens } from '@/lib/auth';

export default function ProjectsScreen() {
  const router = useRouter();

  async function handleLogout() {
    await clearTokens();
    router.replace('/(auth)/login');
  }

  return (
    <View style={s.container}>
      <Text style={s.placeholder}>Liste des projets — à implémenter</Text>
      <TouchableOpacity style={s.logout} onPress={handleLogout}>
        <Text style={s.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 24 },
  placeholder: { color: '#6B7280', fontSize: 15, marginBottom: 32 },
  logout: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  logoutText: { color: '#374151', fontSize: 14 },
});
