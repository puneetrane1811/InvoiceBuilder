import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Users, 
  Package, 
  Calculator, 
  Palette
} from "lucide-react";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/items", label: "Items", icon: Package },
  { href: "/taxes", label: "Taxes", icon: Calculator },
  { href: "/templates", label: "PDF Templates", icon: Palette },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">InvoicePro</h1>
            <p className="text-sm text-muted-foreground">v2.1.0</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-link-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 mt-auto">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
