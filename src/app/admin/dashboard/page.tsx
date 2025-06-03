
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ListChecks, Users, BarChart3 } from "lucide-react";
import Image from "next/image";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Dasbor Admin</CardTitle>
          <CardDescription>Selamat datang di panel kontrol PsycheValuator. Kelola tes, lihat hasil, dan konfigurasikan pengaturan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Image 
            src="https://placehold.co/1200x400.png" 
            alt="Banner Selamat Datang Dasbor Admin" 
            width={1200} 
            height={400} 
            className="rounded-lg object-cover w-full"
            data-ai-hint="abstract technology"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <ListChecks className="h-8 w-8 text-[hsl(var(--accent))] mb-2" />
            <CardTitle className="font-headline">Kelola Tes</CardTitle>
            <CardDescription>Buat, edit, dan hapus tes psikologi beserta pertanyaannya.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/dashboard/tests">
                Ke Manajemen Tes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-50 cursor-not-allowed bg-muted/50">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle className="font-headline">Lihat Analitik (Segera Hadir)</CardTitle>
            <CardDescription>Analisis respons pengguna dan data penyelesaian tes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>
              Jelajahi Analitik <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="opacity-50 cursor-not-allowed bg-muted/50">
          <CardHeader>
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle className="font-headline">Manajemen Pengguna (Segera Hadir)</CardTitle>
            <CardDescription>Lihat dan kelola profil pengguna beserta riwayat tes mereka.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>
              Kelola Pengguna <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

