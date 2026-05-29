import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-gradient flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">GeoTech Lab</h1>
          <p className="text-sm text-gray-500 mt-1">Plateforme de gestion géotechnique</p>
        </div>
        <LoginForm />
        <p className="text-xs text-center text-gray-400 mt-6">
          Pas de compte ? Contactez votre administrateur.
        </p>
      </div>
    </div>
  );
}
