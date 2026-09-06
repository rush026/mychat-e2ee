import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/ui/Button';
import { authService } from '../services/auth.service';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };

    if (token) verify();
    else setStatus('error');
  }, [token]);

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

      <div className="text-center py-12">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
            <p className="text-slate-400 text-sm">Please wait</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto animate-bounce-in">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Email verified!</h2>
            <p className="text-slate-400 text-sm">
              Your email has been verified successfully. You can now enjoy all features.
            </p>
            <Link to="/chat">
              <Button className="mt-4">Go to Chat</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-danger-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification failed</h2>
            <p className="text-slate-400 text-sm">
              This verification link is invalid or has expired.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="mt-4">Back to Login</Button>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
