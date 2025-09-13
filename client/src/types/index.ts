export interface InvoiceStats {
  total: string;
  paid: string;
  pending: string;
  overdue: string;
}

export interface InvoiceCalculation {
  subtotal: number;
  totalTax: number;
  total: number;
}

export interface LineItemCalculation {
  lineTotal: number;
  taxAmount: number;
  taxes: Array<{
    name: string;
    percentage: number;
    amount: number;
  }>;
}
