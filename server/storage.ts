import { 
  users, customers, taxes, items, invoices, invoiceLineItems, templates, itemTaxes,
  type User, type InsertUser, type Customer, type InsertCustomer,
  type Tax, type InsertTax, type Item, type InsertItem,
  type Invoice, type InsertInvoice, type InvoiceLineItem, type InsertInvoiceLineItem,
  type Template, type InsertTemplate, type ItemTax
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Taxes
  getTaxes(): Promise<Tax[]>;
  getTax(id: string): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(id: string, tax: Partial<InsertTax>): Promise<Tax>;
  deleteTax(id: string): Promise<void>;

  // Items
  getItems(): Promise<(Item & { taxes: Tax[] })[]>;
  getItem(id: string): Promise<(Item & { taxes: Tax[] }) | undefined>;
  createItem(item: InsertItem, taxIds: string[]): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>, taxIds: string[]): Promise<Item>;
  deleteItem(id: string): Promise<void>;

  // Invoices
  getInvoices(): Promise<(Invoice & { customer: Customer; lineItems: (InvoiceLineItem & { item: Item })[] })[]>;
  getInvoice(id: string): Promise<(Invoice & { customer: Customer; lineItems: (InvoiceLineItem & { item: Item })[] }) | undefined>;
  createInvoice(invoice: InsertInvoice, lineItems: InsertInvoiceLineItem[]): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>, lineItems: InsertInvoiceLineItem[]): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getInvoiceStats(): Promise<{ total: number; paid: number; pending: number; overdue: number }>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    await db.insert(users).values({ ...insertUser, id });
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = crypto.randomUUID();
    await db.insert(customers).values({ ...customer, id });
    const [newCustomer] = await db.select().from(customers).where(eq(customers.id, id));
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id));
    
    const [updatedCustomer] = await db.select().from(customers).where(eq(customers.id, id));
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Taxes
  async getTaxes(): Promise<Tax[]> {
    return await db.select().from(taxes).orderBy(desc(taxes.createdAt));
  }

  async getTax(id: string): Promise<Tax | undefined> {
    const [tax] = await db.select().from(taxes).where(eq(taxes.id, id));
    return tax || undefined;
  }

  async createTax(tax: InsertTax): Promise<Tax> {
    const id = crypto.randomUUID();
    await db.insert(taxes).values({ ...tax, id });
    const [newTax] = await db.select().from(taxes).where(eq(taxes.id, id));
    return newTax;
  }

  async updateTax(id: string, tax: Partial<InsertTax>): Promise<Tax> {
    await db
      .update(taxes)
      .set(tax)
      .where(eq(taxes.id, id));
    
    const [updatedTax] = await db.select().from(taxes).where(eq(taxes.id, id));
    return updatedTax;
  }

  async deleteTax(id: string): Promise<void> {
    await db.delete(taxes).where(eq(taxes.id, id));
  }

  // Items
  async getItems(): Promise<(Item & { taxes: Tax[] })[]> {
    const allItems = await db.select().from(items).orderBy(desc(items.createdAt));
    
    const itemsWithTaxes = await Promise.all(
      allItems.map(async (item) => {
        const itemTaxData = await db
          .select({ tax: taxes })
          .from(itemTaxes)
          .innerJoin(taxes, eq(itemTaxes.taxId, taxes.id))
          .where(eq(itemTaxes.itemId, item.id));
        
        return {
          ...item,
          taxes: itemTaxData.map(row => row.tax)
        };
      })
    );
    
    return itemsWithTaxes;
  }

  async getItem(id: string): Promise<(Item & { taxes: Tax[] }) | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    if (!item) return undefined;

    const itemTaxData = await db
      .select({ tax: taxes })
      .from(itemTaxes)
      .innerJoin(taxes, eq(itemTaxes.taxId, taxes.id))
      .where(eq(itemTaxes.itemId, item.id));

    return {
      ...item,
      taxes: itemTaxData.map(row => row.tax)
    };
  }

  async createItem(item: InsertItem, taxIds: string[]): Promise<Item> {
    const id = crypto.randomUUID();
    await db.insert(items).values({ ...item, id });
    const [newItem] = await db.select().from(items).where(eq(items.id, id));
    
    if (taxIds.length > 0) {
      const itemTaxData = taxIds.map(taxId => ({
        id: crypto.randomUUID(),
        itemId: id,
        taxId
      }));
      await db.insert(itemTaxes).values(itemTaxData);
    }
    
    return newItem;
  }

  async updateItem(id: string, item: Partial<InsertItem>, taxIds: string[]): Promise<Item> {
    await db
      .update(items)
      .set(item)
      .where(eq(items.id, id));

    // Update item taxes
    await db.delete(itemTaxes).where(eq(itemTaxes.itemId, id));
    
    if (taxIds.length > 0) {
      const itemTaxData = taxIds.map(taxId => ({
        id: crypto.randomUUID(),
        itemId: id,
        taxId
      }));
      await db.insert(itemTaxes).values(itemTaxData);
    }
    
    const [updatedItem] = await db.select().from(items).where(eq(items.id, id));
    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  // Invoices
  async getInvoices(): Promise<(Invoice & { customer: Customer; lineItems: (InvoiceLineItem & { item: Item })[] })[]> {
    const allInvoices = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt));

    const invoicesWithDetails = await Promise.all(
      allInvoices.map(async (row) => {
        const invoice = row.invoices;
        const customer = row.customers!;

        const lineItemsData = await db
          .select()
          .from(invoiceLineItems)
          .leftJoin(items, eq(invoiceLineItems.itemId, items.id))
          .where(eq(invoiceLineItems.invoiceId, invoice.id));

        const lineItems = lineItemsData.map(row => ({
          ...row.invoice_line_items,
          item: row.items!
        }));

        return {
          ...invoice,
          customer,
          lineItems
        };
      })
    );

    return invoicesWithDetails;
  }

  async getInvoice(id: string): Promise<(Invoice & { customer: Customer; lineItems: (InvoiceLineItem & { item: Item })[] }) | undefined> {
    const [invoiceData] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, id));

    if (!invoiceData) return undefined;

    const invoice = invoiceData.invoices;
    const customer = invoiceData.customers!;

    const lineItemsData = await db
      .select()
      .from(invoiceLineItems)
      .leftJoin(items, eq(invoiceLineItems.itemId, items.id))
      .where(eq(invoiceLineItems.invoiceId, invoice.id));

    const lineItems = lineItemsData.map(row => ({
      ...row.invoice_line_items,
      item: row.items!
    }));

    return {
      ...invoice,
      customer,
      lineItems
    };
  }

  async createInvoice(invoice: InsertInvoice, lineItems: InsertInvoiceLineItem[]): Promise<Invoice> {
    const id = crypto.randomUUID();
    // Ensure numeric fields are correctly handled
    const processedInvoice = {
      ...invoice,
      id,
      subtotal: Number(invoice.subtotal),
      totalTax: Number(invoice.totalTax),
      discount: Number(invoice.discount || 0),
      total: Number(invoice.total)
    };
    
    try {
      const { discount, ...invoiceWithoutDiscount } = processedInvoice;
      await db.insert(invoices).values(processedInvoice);
    } catch (error: any) {
      console.error("Database insert error details:", {
        message: error.message,
        code: error.code,
      });
      // Fallback if column missing
      const errorMessage = error.message || "";
      if (errorMessage.toLowerCase().includes("discount")) {
        console.log("Retrying insertion without discount column...");
        const { discount, ...invoiceWithoutDiscount } = processedInvoice;
        // Explicitly omit discount from the values to avoid any accidental inclusion
        const cleanInvoice = { ...invoiceWithoutDiscount };
        await db.insert(invoices).values(cleanInvoice as any);
      } else {
        throw error;
      }
    }

    const [newInvoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    
    if (lineItems.length > 0) {
      const lineItemsWithInvoiceId = lineItems.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        invoiceId: id,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        quantity: Number(item.quantity)
      }));
      await db.insert(invoiceLineItems).values(lineItemsWithInvoiceId);
    }
    
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>, lineItems: InsertInvoiceLineItem[]): Promise<Invoice> {
    const updateData: any = { ...invoice };
    if (updateData.subtotal !== undefined) updateData.subtotal = Number(updateData.subtotal);
    if (updateData.totalTax !== undefined) updateData.totalTax = Number(updateData.totalTax);
    if (updateData.discount !== undefined) updateData.discount = Number(updateData.discount);
    if (updateData.total !== undefined) updateData.total = Number(updateData.total);

    await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id));

    // Update line items
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
    
    if (lineItems.length > 0) {
      const lineItemsWithInvoiceId = lineItems.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        invoiceId: id,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        quantity: Number(item.quantity)
      }));
      await db.insert(invoiceLineItems).values(lineItemsWithInvoiceId);
    }
    
    const [updatedInvoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getInvoiceStats(): Promise<{ total: number; paid: number; pending: number; overdue: number }> {
    const allInvoices = await db.select().from(invoices);
    
    const stats = {
      total: allInvoices.length,
      paid: allInvoices.filter(i => i.status === 'paid').length,
      pending: allInvoices.filter(i => i.status === 'pending').length,
      overdue: allInvoices.filter(i => i.status === 'overdue').length
    };

    return stats;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const id = crypto.randomUUID();
    await db.insert(templates).values({ ...template, id });
    const [newTemplate] = await db.select().from(templates).where(eq(templates.id, id));
    return newTemplate;
  }

  async updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template> {
    await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id));
    
    const [updatedTemplate] = await db.select().from(templates).where(eq(templates.id, id));
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }
}

export const storage = new DatabaseStorage();
