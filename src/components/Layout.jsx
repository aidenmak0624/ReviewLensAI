import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { BarChart3, Plus, Home } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline">
              <BarChart3 className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-foreground">
                ReviewLens
                <span className="text-primary ml-0.5">AI</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium no-underline transition-colors",
                  location.pathname === "/"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/new"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium no-underline transition-colors",
                  location.pathname === "/new"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Plus className="h-4 w-4" />
                New Product
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            ReviewLens AI — Review Intelligence Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
