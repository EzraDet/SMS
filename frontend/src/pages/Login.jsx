import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { School, Lock, User, LogIn } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.fullName || user.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      superadmin: { u: 'superadmin', p: 'password123' },
      admin: { u: 'admin', p: 'password123' },
      teacher: { u: 'teacher1', p: 'password123' },
    };
    if (creds[role]) {
      setUsername(creds[role].u);
      setPassword(creds[role].p);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
              <School className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-bold text-lg">School Management</h1>
              <p className="text-xs text-white/70">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Everything you need to run your school.
          </h2>
          <p className="text-white/70 mt-4 text-sm leading-relaxed">
            Students, teachers, classes, subjects, attendance, scores, report
            cards and more — all in one place.
          </p>
        </div>

        <p className="text-xs text-white/50 relative z-10">
          © {new Date().getFullYear()} School Management System
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2 bg-primary-600 rounded-xl">
              <School className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-gray-800">School Management</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1 mb-8">
            Sign in to access your dashboard
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              icon={LogIn}
              loading={loading}
              className="w-full justify-center"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3 font-medium">
              Demo accounts (click to fill):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemo('superadmin')}
                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('teacher')}
                className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition"
              >
                Teacher
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              Password for all demo accounts:{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                password123
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
