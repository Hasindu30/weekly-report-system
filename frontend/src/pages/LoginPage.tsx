import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Card, Button, FormField, Input } from '../components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      const targetPath = user.role === UserRole.TEAM_MEMBER ? '/member' : '/manager';
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(typeof message === 'string' ? message : message[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md">
      <div className="space-y-1 mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sign In</h1>
        <p className="text-xs text-slate-500">
          Enter your credentials to access your reporting workspace.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email Address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Create an account
        </Link>
      </div>
    </Card>
  );
}
