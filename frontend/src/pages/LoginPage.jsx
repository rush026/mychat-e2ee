import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const toast = useToastStore();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.identifier.trim()) newErrors.identifier = 'Email or username is required';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/chat', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    }
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
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
        <p className="text-slate-400 text-sm">
          Sign in with your email or username to continue
        </p>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email or Username"
          name="identifier"
          placeholder="you@example.com or @username"
          icon={Mail}
          value={form.identifier}
          onChange={handleChange}
          error={errors.identifier}
          autoComplete="username"
          id="login-identifier"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          icon={Lock}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          id="login-password"
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          id="login-submit"
        >
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-600" />
        <span className="text-xs text-slate-500">New to MyChat?</span>
        <div className="flex-1 h-px bg-surface-600" />
      </div>

      {/* Register link */}
      <div className="mt-6 text-center">
        <Link
          to="/register"
          className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Create an account →
        </Link>
      </div>
    </AuthLayout>
  );
}
