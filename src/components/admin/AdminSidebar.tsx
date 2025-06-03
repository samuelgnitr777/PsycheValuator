'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, ListChecks, Users, Settings, LogOut, Brain, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/components/AppProviders';


const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/dashboard/tests', label: 'Manage Tests', icon: ListChecks },
  // Future items:
  // { href: '/admin/dashboard/users', label: 'User Data', icon: Users },
  // { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">
          <Brain className="h-6 w-6 text-[hsl(var(--accent))]" />
          PsycheValuator
        </Link>
        <div className="group-data-[collapsible=icon]:hidden">
         <SidebarTrigger />
        </div>
      </SidebarHeader>
      <Separator className="group-data-[collapsible=icon]:hidden" />
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: 'right', className: "ml-2" }}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  <item.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator className="group-data-[collapsible=icon]:hidden" />
      <SidebarFooter className="p-2 mt-auto">
         <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
            <LogOut className="h-5 w-5 text-[hsl(var(--accent))]" />
            <span className="ml-2 group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
        <Button variant="ghost" asChild className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
           <Link href="/">
             <FileText className="h-5 w-5 text-[hsl(var(--accent))]" />
             <span className="ml-2 group-data-[collapsible=icon]:hidden">View Public Site</span>
           </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
