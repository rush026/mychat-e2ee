import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '../layouts/AuthLayout';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();
  const toast = useToastStore();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin({ credential: credentialResponse.credential });
      toast.success('Welcome back!');
      navigate('/chat', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login was unsuccessful');
  };

  return (
    <AuthLayout>
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">MyChat</h1>
          <p className="text-xs text-slate-400">End-to-End Encrypted</p>
        </div>
      </div>

      {/* Form header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to MyChat</h2>
        <p className="text-slate-400 text-sm">
          Sign in directly with your Google account
        </p>
      </div>

      {/* Google Login Button */}
      <div className="flex justify-center py-6">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with"
          width="320"
        />
      </div>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-600" />
        <span className="text-xs text-slate-500">Secure & Encrypted</span>
        <div className="flex-1 h-px bg-surface-600" />
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          First time? Logging in will automatically create your account.
        </p>
      </div>
    </AuthLayout>
  );
}
