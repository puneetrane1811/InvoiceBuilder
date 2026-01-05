import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ItemForm from "@/components/item-form";
import type { Item, Tax } from "@shared/schema";

type ItemWithTaxes = Item & { taxes: Tax[] };

export default function Items() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithTaxes | null>(null);
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<ItemWithTaxes[]>({
    queryKey: ["/api/items"],
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    },
  });

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <div className="h-full flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Items</h2>
            <p className="text-muted-foreground">Manage your products and services</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-items"
              />
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <ItemForm
                  onSuccess={() => {
                    setIsCreateModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/items"] });
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
              <h3 className="text-sm font-medium text-foreground">All Items</h3>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Taxes</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading items...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-accent transition-colors">
                        <TableCell>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">{item.description || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.unitPrice)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.taxes.length > 0 ? (
                              item.taxes.map((tax) => (
                                <Badge key={tax.id} variant="secondary" className="text-xs">
                                  {tax.name} ({tax.percentage}%)
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No taxes</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-foreground">
                            {(() => {
                              const unitPrice = parseFloat(item.unitPrice.toString());
                              const taxPercentage = item.taxes.reduce((sum, tax) => sum + parseFloat(tax.percentage.toString()), 0);
                              const totalPrice = unitPrice * (1 + taxPercentage / 100);
                              return formatCurrency(totalPrice.toString());
                            })()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              disabled={deleteItemMutation.isPending}
                              data-testid={`button-delete-item-${item.id}`}
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

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              item={editingItem}
              onSuccess={() => {
                setEditingItem(null);
                queryClient.invalidateQueries({ queryKey: ["/api/items"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
