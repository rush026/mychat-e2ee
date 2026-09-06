import { Shield, Lock, MessageSquare } from 'lucide-react';

/**
 * Auth layout — wraps login/register/forgot-password pages
 * with a premium split-screen design.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">MyChat</h1>
              <p className="text-sm text-primary-200">End-to-End Encrypted</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-start gap-4 glass rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-primary-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">True E2E Encryption</h3>
                <p className="text-primary-200 text-xs mt-1 leading-relaxed">
                  Messages are encrypted on your device using AES-256-GCM. Not even our servers can read them.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 glass rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-accent-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Real-Time Messaging</h3>
                <p className="text-primary-200 text-xs mt-1 leading-relaxed">
                  Instant message delivery with typing indicators, read receipts, and presence status.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 glass rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-pink-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Privacy First</h3>
                <p className="text-primary-200 text-xs mt-1 leading-relaxed">
                  Your private keys never leave your device. We can&apos;t access your messages — by design.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-surface-900">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
