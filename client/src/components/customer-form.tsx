import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCustomerSchema, type Customer } from "@shared/schema";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

export default function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertCustomerSchema>>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      gstin: customer?.gstin || "",
      billingAddress: customer?.billingAddress || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerSchema>) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Customer created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create customer", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerSchema>) => {
      const response = await apiRequest("PUT", `/api/customers/${customer!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Customer updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update customer", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof insertCustomerSchema>) => {
    if (customer) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name / Company Name *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter customer name"
          data-testid="input-customer-name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="Enter email address"
          data-testid="input-customer-email"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          {...form.register("phone")}
          placeholder="Enter phone number"
          data-testid="input-customer-phone"
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="gstin">GSTIN</Label>
        <Input
          id="gstin"
          {...form.register("gstin")}
          placeholder="Enter GSTIN number"
          data-testid="input-customer-gstin"
        />
        {form.formState.errors.gstin && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.gstin.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="billingAddress">Billing Address</Label>
        <Textarea
          id="billingAddress"
          {...form.register("billingAddress")}
          placeholder="Enter billing address"
          rows={3}
          data-testid="input-customer-address"
        />
        {form.formState.errors.billingAddress && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.billingAddress.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-submit-customer"
        >
          {customer ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
