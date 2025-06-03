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
          <CardTitle className="text-3xl font-headline text-primary">Admin Dashboard</CardTitle>
          <CardDescription>Welcome to the PsycheValuator control panel. Manage tests, view results, and configure settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Image 
            src="https://placehold.co/1200x400.png" 
            alt="Admin Dashboard Welcome Banner" 
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
            <CardTitle className="font-headline">Manage Tests</CardTitle>
            <CardDescription>Create, edit, and delete psychological tests and their questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/dashboard/tests">
                Go to Test Management <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-50 cursor-not-allowed bg-muted/50">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle className="font-headline">View Analytics (Coming Soon)</CardTitle>
            <CardDescription>Analyze user responses and test completion data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>
              Explore Analytics <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="opacity-50 cursor-not-allowed bg-muted/50">
          <CardHeader>
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle className="font-headline">User Management (Coming Soon)</CardTitle>
            <CardDescription>View and manage user profiles and their test history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>
              Manage Users <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
