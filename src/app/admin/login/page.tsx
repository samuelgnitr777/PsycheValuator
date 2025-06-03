'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAdmin, isAdminLoggedIn } from '@/lib/authService';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/AppProviders';


export default function AdminLoginPage() {
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
  
  // Effect to sync with context, in case another tab logs in/out
  useEffect(() => {
    if (contextIsLoggedIn) {
      router.replace('/admin/dashboard');
    }
  }, [contextIsLoggedIn, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = loginAdmin(password);

    if (success) {
      setIsLoggedIn(true); // Update context
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      router.push('/admin/dashboard');
    } else {
      setError('Invalid password. Please try again.');
      toast({ title: 'Login Failed', description: 'Invalid password.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
       <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
          <CardDescription>Enter your password to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              {isLoading ? 'Logging in...' : <> <LogIn className="mr-2 h-4 w-4" /> Login </>}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            This is a restricted area. Authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
