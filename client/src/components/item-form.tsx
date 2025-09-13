import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertItemSchema, type Item, type Tax } from "@shared/schema";

type ItemWithTaxes = Item & { taxes: Tax[] };

interface ItemFormProps {
  item?: ItemWithTaxes;
  onSuccess: () => void;
}

export default function ItemForm({ item, onSuccess }: ItemFormProps) {
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>(
    item?.taxes.map(tax => tax.id) || []
  );
  const { toast } = useToast();

  const { data: taxes = [] } = useQuery<Tax[]>({
    queryKey: ["/api/taxes"],
  });

  const form = useForm<z.infer<typeof insertItemSchema>>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      unitPrice: item?.unitPrice || "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertItemSchema> & { taxIds: string[] }) => {
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Item created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertItemSchema> & { taxIds: string[] }) => {
      const response = await apiRequest("PUT", `/api/items/${item!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Item updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const handleTaxChange = (taxId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaxIds([...selectedTaxIds, taxId]);
    } else {
      setSelectedTaxIds(selectedTaxIds.filter(id => id !== taxId));
    }
  };

  const onSubmit = (data: z.infer<typeof insertItemSchema>) => {
    const submitData = { ...data, taxIds: selectedTaxIds };
    
    if (item) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Item Name *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter item name"
          data-testid="input-item-name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Enter item description"
          rows={3}
          data-testid="input-item-description"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="unitPrice">Unit Price (₹) *</Label>
        <Input
          id="unitPrice"
          type="number"
          step="0.01"
          min="0"
          {...form.register("unitPrice")}
          placeholder="0.00"
          data-testid="input-item-price"
        />
        {form.formState.errors.unitPrice && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.unitPrice.message}
          </p>
        )}
      </div>

      <div>
        <Label>Applicable Taxes</Label>
        <div className="space-y-2 mt-2">
          {taxes.map((tax) => (
            <div key={tax.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tax-${tax.id}`}
                checked={selectedTaxIds.includes(tax.id)}
                onCheckedChange={(checked) => handleTaxChange(tax.id, checked as boolean)}
                data-testid={`checkbox-tax-${tax.id}`}
              />
              <Label htmlFor={`tax-${tax.id}`} className="text-sm">
                {tax.name} ({tax.percentage}%)
              </Label>
            </div>
          ))}
          {taxes.length === 0 && (
            <p className="text-sm text-muted-foreground">No taxes available. Create taxes first.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-submit-item"
        >
          {item ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
