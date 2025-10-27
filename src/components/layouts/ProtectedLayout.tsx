import { Outlet, Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import Header from '@/components/Header';

export function ProtectedLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-x-hidden">
            <div className="container mx-auto max-w-7xl">
              <Outlet />
            </div>
            
            {/* Footer */}
            <footer className="border-t bg-card/50 mt-12 py-6">
              <div className="container mx-auto max-w-7xl px-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Capittal
                  </p>
                  <div className="flex items-center gap-4">
                    <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Términos y Condiciones
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
