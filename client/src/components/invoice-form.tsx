import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Item, Invoice, InvoiceLineItem, Tax } from "@shared/schema";

type InvoiceWithDetails = Invoice & {
  customer: Customer;
  lineItems: (InvoiceLineItem & { item: Item })[];
};

type ItemWithTaxes = Item & { taxes: Tax[] };

interface LineItemForm {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
  discount: z.string().or(z.number()).optional(),
});

interface InvoiceFormProps {
  invoice?: InvoiceWithDetails;
  onSuccess: () => void;
}

export default function InvoiceForm({ invoice, onSuccess }: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const { toast } = useToast();

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: items = [] } = useQuery<ItemWithTaxes[]>({
    queryKey: ["/api/items"],
  });

  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber || "",
      customerId: invoice?.customerId || "",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : "",
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
      status: (invoice?.status as "pending" | "paid" | "overdue") || "pending",
      discount: invoice?.discount?.toString() || "0",
    },
  });

  useEffect(() => {
    if (invoice?.lineItems) {
      setLineItems(
        invoice.lineItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
        }))
      );
    }
  }, [invoice]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Invoice created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/invoices/${invoice!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Invoice updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update invoice", variant: "destructive" });
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { itemId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: any) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    const discount = Number(form.watch("discount")) || 0;

    lineItems.forEach((lineItem) => {
      const item = items.find((i) => String(i.id) === String(lineItem.itemId));
      const quantity = Number(lineItem.quantity) || 0;
      const unitPrice = Number(lineItem.unitPrice) || 0;
      
      const lineTotal = quantity * unitPrice;
      subtotal += lineTotal;

      if (item) {
        // Calculate taxes for this line item
        item.taxes.forEach((tax) => {
          totalTax += (lineTotal * Number(tax.percentage)) / 100;
        });
      }
    });

    return {
      subtotal,
      totalTax,
      total: Math.max(0, subtotal + totalTax - discount),
    };
  };

  const totals = calculateTotals();

  const onSubmit = (data: z.infer<typeof invoiceFormSchema>) => {
    if (lineItems.length === 0) {
      toast({ title: "Please add at least one line item", variant: "destructive" });
      return;
    }

    const processedLineItems = lineItems
      .filter((item) => item.itemId && item.quantity > 0)
      .map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

    const invoiceData = {
      ...data,
      issueDate: new Date(data.issueDate).toISOString(),
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      total: totals.total,
      lineItems: processedLineItems,
    };

    if (invoice) {
      updateMutation.mutate(invoiceData);
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            {...form.register("invoiceNumber")}
            placeholder="INV-001"
            data-testid="input-invoice-number"
          />
          {form.formState.errors.invoiceNumber && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.invoiceNumber.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            {...form.register("issueDate")}
            data-testid="input-issue-date"
          />
          {form.formState.errors.issueDate && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.issueDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="customerId">Customer</Label>
          <Select
            value={form.watch("customerId")}
            onValueChange={(value) => form.setValue("customerId", value)}
          >
            <SelectTrigger data-testid="select-customer">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.customerId && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.customerId.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date (Optional)</Label>
          <Input
            id="dueDate"
            type="date"
            {...form.register("dueDate")}
            data-testid="input-due-date"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as "pending" | "paid" | "overdue")}
        >
          <SelectTrigger data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-foreground">Line Items</h4>
          <Button type="button" variant="secondary" onClick={addLineItem} data-testid="button-add-line-item">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {lineItems.map((lineItem, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <Label>Item</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={lineItem.itemId}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateLineItem(index, "itemId", value);
                        const item = items.find((i) => String(i.id) === String(value));
                        if (item) {
                          updateLineItem(index, "unitPrice", parseFloat(item.unitPrice.toString()));
                        }
                      }}
                      data-testid={`select-item-${index}`}
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.name} - ₹{parseFloat(item.unitPrice.toString()).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={lineItem.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                      data-testid={`input-quantity-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Rate (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={lineItem.unitPrice}
                      onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      data-testid={`input-rate-${index}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice Totals */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-lg font-medium text-foreground mb-4">Invoice Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="text-foreground font-medium">₹{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tax:</span>
              <span className="text-foreground font-medium">₹{totals.totalTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">₹</span>
                <Input
                  type="number"
                  className="w-24 h-8 text-right"
                  {...form.register("discount")}
                  data-testid="input-invoice-discount"
                />
              </div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="text-foreground font-semibold">Total:</span>
                <span className="text-foreground font-bold text-lg">₹{totals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-submit-invoice"
        >
          {invoice ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
