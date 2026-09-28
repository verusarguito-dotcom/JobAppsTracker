import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface Props {
  onLogin: (password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const LoginModal: React.FC<Props> = ({ onLogin, loading, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Job Tracker Login</h2>
            <p className="text-xs text-slate-500">Akses privat pemilik</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-password"
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Masukkan kata sandi..."
          />
          <Button id="login-submit" type="submit" disabled={loading} className="w-full">
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
};
