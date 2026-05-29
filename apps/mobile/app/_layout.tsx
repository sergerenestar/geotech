import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAccessToken, refreshTokens } from '@/lib/auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      let token = await getAccessToken();
      if (!token) token = await refreshTokens();
      const inAuth = segments[0] === '(auth)';
      if (!token && !inAuth) router.replace('/(auth)/login');
      if (token && inAuth) router.replace('/(app)');
      setReady(true);
    }
    bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
