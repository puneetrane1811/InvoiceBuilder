import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TaxForm from "@/components/tax-form";
import type { Tax } from "@shared/schema";

export default function Taxes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const { toast } = useToast();

  const { data: taxes = [], isLoading } = useQuery<Tax[]>({
    queryKey: ["/api/taxes"],
  });

  const deleteTaxMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/taxes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
      toast({ title: "Tax deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete tax", variant: "destructive" });
    },
  });

  const filteredTaxes = taxes.filter(tax =>
    tax.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Taxes</h2>
            <p className="text-muted-foreground">Configure tax rates and types</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search taxes..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-taxes"
              />
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-tax">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tax
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Tax</DialogTitle>
                </DialogHeader>
                <TaxForm
                  onSuccess={() => {
                    setIsCreateModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 pb-6 overflow-hidden pt-6">
        <Card className="h-full">
          <CardContent className="p-0">
            <div className="px-4 py-3 bg-muted border-b border-border">
              <h3 className="text-sm font-medium text-foreground">All Taxes</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Name</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading taxes...
                      </TableCell>
                    </TableRow>
                  ) : filteredTaxes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No taxes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTaxes.map((tax) => (
                      <TableRow key={tax.id} className="hover:bg-accent transition-colors">
                        <TableCell>
                          <p className="text-sm font-medium text-foreground">{tax.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{tax.percentage}%</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">
                            {tax.createdAt ? new Date(tax.createdAt).toLocaleDateString() : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTax(tax)}
                              data-testid={`button-edit-tax-${tax.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTaxMutation.mutate(tax.id)}
                              disabled={deleteTaxMutation.isPending}
                              data-testid={`button-delete-tax-${tax.id}`}
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

      {/* Edit Tax Dialog */}
      <Dialog open={!!editingTax} onOpenChange={() => setEditingTax(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tax</DialogTitle>
          </DialogHeader>
          {editingTax && (
            <TaxForm
              tax={editingTax}
              onSuccess={() => {
                setEditingTax(null);
                queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
