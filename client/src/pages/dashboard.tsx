import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Users, Package, Calculator, Plus } from "lucide-react";
import type { InvoiceStats } from "@/types";

export default function Dashboard() {
  const { data: invoiceStats, isLoading } = useQuery<InvoiceStats>({
    queryKey: ["/api/invoices/stats"],
  });

  const stats = [
    {
      title: "Total Invoices",
      value: invoiceStats?.total ? Number(invoiceStats.total) : 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Paid",
      value: `₹${invoiceStats?.paid ? Number(invoiceStats.paid) : 0}`,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending",
      value: `₹${invoiceStats?.pending ? Number(invoiceStats.pending) : 0}`,
      icon: FileText,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Overdue",
      value: `₹${invoiceStats?.overdue ? Number(invoiceStats.overdue) : 0}`,
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const quickActions = [
    {
      title: "Create Invoice",
      description: "Generate a new invoice for your customers",
      icon: FileText,
      href: "/invoices",
      color: "bg-primary",
    },
    {
      title: "Add Customer",
      description: "Add new customer to your database",
      icon: Users,
      href: "/customers",
      color: "bg-blue-500",
    },
    {
      title: "Manage Items",
      description: "Add or edit your products and services",
      icon: Package,
      href: "/items",
      color: "bg-green-500",
    },
    {
      title: "Tax Settings",
      description: "Configure tax rates and types",
      icon: Calculator,
      href: "/taxes",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your invoice management system</p>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} data-testid={`stat-card-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">
                        {isLoading ? "..." : stat.value}
                      </p>
                    </div>
                    <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-foreground">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <Link href={action.href}>
                        <Button className="w-full" data-testid={`quick-action-${index}`}>
                          <Plus className="w-4 h-4 mr-2" />
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
