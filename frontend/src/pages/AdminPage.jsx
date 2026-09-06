import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, MessageSquare, Shield, Activity, 
  ArrowLeft, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { adminService } from '../services/admin.service';
import { FullPageSpinner } from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await adminService.getSystemMetrics();
        setMetrics(data.data.metrics);
      } catch (error) {
        console.error('Failed to fetch admin metrics', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    // Poll every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <FullPageSpinner />;
  if (!metrics) return <div className="p-8 text-center text-white">Failed to load metrics</div>;

  return (
    <div className="min-h-screen bg-surface-900 text-white p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/chat" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-500" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-1">System monitoring and security audit logs.</p>
          </div>
          <Badge variant="primary" className="text-sm px-3 py-1">
            <Activity className="w-4 h-4 mr-2" />
            Live Updates
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-6 border border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-400" />
              </div>
              <Badge variant="default">Total</Badge>
            </div>
            <h3 className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</h3>
            <p className="text-slate-400 text-sm mt-1">Registered Users</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <h3 className="text-3xl font-bold">{metrics.onlineUsers.toLocaleString()}</h3>
            <p className="text-slate-400 text-sm mt-1">Users Online</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-accent-400" />
              </div>
              <Badge variant="default">Total</Badge>
            </div>
            <h3 className="text-3xl font-bold">{metrics.totalMessages.toLocaleString()}</h3>
            <p className="text-slate-400 text-sm mt-1">Messages Sent</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-info-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-info-400" />
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <h3 className="text-3xl font-bold">{metrics.totalConversations.toLocaleString()}</h3>
            <p className="text-slate-400 text-sm mt-1">Conversations</p>
          </div>
        </div>

        {/* Charts & Logs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-surface-700">
            <h3 className="text-lg font-semibold mb-6">User Growth (Last 7 Days)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.usersByDay}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" vertical={false} />
                  <XAxis 
                    dataKey="_id" 
                    stroke="#8b949e" 
                    tick={{ fill: '#8b949e', fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    stroke="#8b949e" 
                    tick={{ fill: '#8b949e', fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2d2d3d', borderRadius: '8px' }}
                    itemStyle={{ color: '#c7d2fe' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="New Users"
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Security Logs */}
          <div className="glass-card rounded-2xl p-6 border border-surface-700 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Security Audit Log</h3>
              <Badge variant="warning" className="text-xs">Last 20</Badge>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
              {metrics.recentSecurityLogs.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-4">No recent security events.</div>
              ) : (
                metrics.recentSecurityLogs.map(log => (
                  <div key={log._id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-800 border border-surface-700/50">
                    {log.success ? (
                      <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-white">{log.action}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        User: {log.userId?.username || 'System'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')} • {log.ipAddress}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
