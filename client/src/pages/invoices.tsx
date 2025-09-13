import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Download, Edit, Eye, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InvoiceForm from "@/components/invoice-form";
import type { Invoice, Customer, InvoiceLineItem, Item } from "@shared/schema";
import type { InvoiceStats } from "@/types";

type InvoiceWithDetails = Invoice & {
  customer: Customer;
  lineItems: (InvoiceLineItem & { item: Item })[];
};

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithDetails | null>(null);
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<InvoiceWithDetails[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: stats } = useQuery<InvoiceStats>({
    queryKey: ["/api/invoices/stats"],
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
      toast({ title: "Invoice deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete invoice", variant: "destructive" });
    },
  });

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownloadPDF = (invoice: InvoiceWithDetails) => {
    // TODO: Implement PDF generation
    toast({ title: "PDF generation coming soon!" });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
            <p className="text-muted-foreground">Manage your invoices and track payments</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search invoices..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-invoices"
              />
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-invoice">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <InvoiceForm
                  onSuccess={() => {
                    setIsCreateModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.total ? Number(stats.total) : 0}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Paid</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.paid ? Number(stats.paid) : 0}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.pending ? Number(stats.pending) : 0}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-destructive">{stats?.overdue ? Number(stats.overdue) : 0}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-0">
            <div className="px-4 py-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Recent Invoices</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading invoices...
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-accent transition-colors">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-xs font-semibold text-primary">#</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">ID: {invoice.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">{invoice.customer.name}</p>
                            <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{formatDate(invoice.issueDate.toString())}</p>
                          {invoice.dueDate && (
                            <p className="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate.toString())}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.total)}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(invoice.subtotal)} + tax</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingInvoice(invoice)}
                              data-testid={`button-edit-invoice-${invoice.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(invoice)}
                              data-testid={`button-download-pdf-${invoice.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteInvoiceMutation.mutate(invoice.id)}
                              disabled={deleteInvoiceMutation.isPending}
                              data-testid={`button-delete-invoice-${invoice.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <InvoiceForm
              invoice={editingInvoice}
              onSuccess={() => {
                setEditingInvoice(null);
                queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
