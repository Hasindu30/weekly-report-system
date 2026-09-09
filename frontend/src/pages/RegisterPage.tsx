import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, FormField, Input } from '../components/ui';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ firstName, lastName, email, password });
      navigate('/login', { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md">
      <div className="space-y-1 mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Account</h1>
        <p className="text-xs text-slate-500">
          Register to author and manage weekly reports with your team.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name" htmlFor="firstName" required>
            <Input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Alice"
              autoComplete="given-name"
            />
          </FormField>

          <FormField label="Last Name" htmlFor="lastName" required>
            <Input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
            />
          </FormField>
        </div>

        <FormField label="Email Address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice.smith@example.com"
            autoComplete="email"
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          helperText="Minimum 8 characters"
          required
        >
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm Password" htmlFor="confirmPassword" required>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </Card>
  );
}
