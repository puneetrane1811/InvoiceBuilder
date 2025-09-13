import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import Customers from "@/pages/customers";
import Items from "@/pages/items";
import Taxes from "@/pages/taxes";
import Templates from "@/pages/templates";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/customers" component={Customers} />
          <Route path="/items" component={Items} />
          <Route path="/taxes" component={Taxes} />
          <Route path="/templates" component={Templates} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
