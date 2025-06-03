
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuthContext } from '@/components/AppProviders';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { isLoggedIn, logout, isLoading } = useAuthContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold font-headline text-primary hover:opacity-80 transition-opacity">
          PsycheValuator
        </Link>
        <nav className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : isLoggedIn ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/dashboard">
                  <Settings className="mr-2 h-4 w-4 text-[hsl(var(--accent))]" /> Admin
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 text-[hsl(var(--accent))]" /> Keluar
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/login">
                <LogIn className="mr-2 h-4 w-4 text-[hsl(var(--accent))]" /> Login Admin
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

