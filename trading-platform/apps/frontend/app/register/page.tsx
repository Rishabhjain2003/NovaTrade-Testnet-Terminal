'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    binanceApiKey: '',
    binanceSecretKey: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.register(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      router.push('/trade');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-white text-center">Register</CardTitle>
          <CardDescription className="text-center">Create your trading account</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="bg-blue-900/20 border-blue-700 text-blue-200">
            <AlertDescription className="text-sm">
              Get Binance Testnet keys at{' '}
              <a
                href="https://testnet.binance.vision/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                testnet.binance.vision
              </a>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-gray-300">Binance API Key (Testnet)</Label>
              <Input
                id="apiKey"
                type="text"
                value={formData.binanceApiKey}
                onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500 font-mono text-sm"
                placeholder="Enter testnet API key"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-gray-300">Binance Secret Key (Testnet)</Label>
              <Input
                id="secretKey"
                type="password"
                value={formData.binanceSecretKey}
                onChange={(e) => setFormData({ ...formData, binanceSecretKey: e.target.value })}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500 font-mono text-sm"
                placeholder="Enter testnet secret key"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <p className="text-gray-400 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
