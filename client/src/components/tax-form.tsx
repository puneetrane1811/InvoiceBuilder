import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTaxSchema, type Tax } from "@shared/schema";

interface TaxFormProps {
  tax?: Tax;
  onSuccess: () => void;
}

export default function TaxForm({ tax, onSuccess }: TaxFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertTaxSchema>>({
    resolver: zodResolver(insertTaxSchema),
    defaultValues: {
      name: tax?.name || "",
      percentage: tax?.percentage || "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTaxSchema>) => {
      const response = await apiRequest("POST", "/api/taxes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tax created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create tax", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTaxSchema>) => {
      const response = await apiRequest("PUT", `/api/taxes/${tax!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tax updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update tax", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof insertTaxSchema>) => {
    if (tax) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Tax Name *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="e.g., CGST, SGST, IGST"
          data-testid="input-tax-name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="percentage">Percentage *</Label>
        <Input
          id="percentage"
          type="number"
          step="0.01"
          min="0"
          max="100"
          {...form.register("percentage")}
          placeholder="0.00"
          data-testid="input-tax-percentage"
        />
        {form.formState.errors.percentage && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.percentage.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-submit-tax"
        >
          {tax ? "Update Tax" : "Create Tax"}
        </Button>
      </div>
    </form>
  );
}
