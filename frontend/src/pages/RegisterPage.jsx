import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Shield, AtSign } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/uiStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const toast = useToastStore();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Only letters, numbers, and underscores';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      newErrors.password = 'Need uppercase, lowercase, number & special character';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        displayName: form.displayName || form.username,
      });
      toast.success('Account created! Check your email to verify.');
      navigate('/chat', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
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

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
        <p className="text-slate-400 text-sm">
          Join MyChat for secure, encrypted messaging
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          name="username"
          placeholder="cooluser123"
          icon={AtSign}
          value={form.username}
          onChange={handleChange}
          error={errors.username}
          autoComplete="username"
          id="register-username"
        />

        <Input
          label="Display Name (optional)"
          name="displayName"
          placeholder="John Doe"
          icon={User}
          value={form.displayName}
          onChange={handleChange}
          id="register-displayname"
        />

        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
          id="register-email"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          icon={Lock}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
          id="register-password"
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          icon={Lock}
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
          id="register-confirm-password"
        />

        {/* Password requirements */}
        <div className="text-xs text-slate-500 space-y-1">
          <p className={form.password.length >= 8 ? 'text-green-400' : ''}>
            • At least 8 characters
          </p>
          <p className={/(?=.*[A-Z])/.test(form.password) ? 'text-green-400' : ''}>
            • One uppercase letter
          </p>
          <p className={/(?=.*[a-z])/.test(form.password) ? 'text-green-400' : ''}>
            • One lowercase letter
          </p>
          <p className={/(?=.*\d)/.test(form.password) ? 'text-green-400' : ''}>
            • One number
          </p>
          <p className={/(?=.*[@$!%*?&])/.test(form.password) ? 'text-green-400' : ''}>
            • One special character (@$!%*?&)
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          id="register-submit"
        >
          Create Account
        </Button>
      </form>

      {/* Login link */}
      <div className="mt-6 text-center">
        <span className="text-sm text-slate-500">Already have an account? </span>
        <Link
          to="/login"
          className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
