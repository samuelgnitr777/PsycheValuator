
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAdmin, isAdminLoggedIn } from '@/lib/authService';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, LogIn, Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/AppProviders';


export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setIsLoggedIn, isLoggedIn: contextIsLoggedIn } = useAuthContext();

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace('/admin/dashboard');
    }
  }, [router]);
  
  useEffect(() => {
    if (contextIsLoggedIn) {
      router.replace('/admin/dashboard');
    }
  }, [contextIsLoggedIn, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Email dan kata sandi tidak boleh kosong.');
      setIsLoading(false);
      toast({ title: 'Login Gagal', description: 'Email dan kata sandi tidak boleh kosong.', variant: 'destructive' });
      return;
    }

    const result = await loginAdmin(email, password);

    if (result.success) {
      setIsLoggedIn(true); 
      toast({ title: 'Login Berhasil', description: 'Mengarahkan ke dasbor...' });
      router.push('/admin/dashboard');
    } else {
      const errorMessage = result.error || 'Email atau kata sandi tidak valid. Silakan coba lagi.';
      setError(errorMessage);
      toast({ title: 'Login Gagal', description: errorMessage, variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
       <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-headline">Login Admin</CardTitle>
          <CardDescription>Masukkan email dan kata sandi Anda untuk mengakses dasbor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sedang masuk...' : <> <LogIn className="mr-2 h-4 w-4" /> Masuk </>}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Ini adalah area terbatas. Hanya untuk personel yang berwenang.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

