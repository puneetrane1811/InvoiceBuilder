import { 
  users, customers, taxes, items, invoices, invoiceLineItems, templates, itemTaxes,
  type User, type InsertUser, type Customer, type InsertCustomer,
  type Tax, type InsertTax, type Item, type InsertItem,
  type Invoice, type InsertInvoice, type InvoiceLineItem, type InsertInvoiceLineItem,
  type Template, type InsertTemplate, type ItemTax
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
    const [user] = await db.insert(users).values(insertUser).returning();
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
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
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
    const [newTax] = await db.insert(taxes).values(tax).returning();
    return newTax;
  }

  async updateTax(id: string, tax: Partial<InsertTax>): Promise<Tax> {
    const [updatedTax] = await db
      .update(taxes)
      .set(tax)
      .where(eq(taxes.id, id))
      .returning();
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
    const [newItem] = await db.insert(items).values(item).returning();
    
    if (taxIds.length > 0) {
      const itemTaxData = taxIds.map(taxId => ({
        itemId: newItem.id,
        taxId
      }));
      await db.insert(itemTaxes).values(itemTaxData);
    }
    
    return newItem;
  }

  async updateItem(id: string, item: Partial<InsertItem>, taxIds: string[]): Promise<Item> {
    const [updatedItem] = await db
      .update(items)
      .set(item)
      .where(eq(items.id, id))
      .returning();

    // Update item taxes
    await db.delete(itemTaxes).where(eq(itemTaxes.itemId, id));
    
    if (taxIds.length > 0) {
      const itemTaxData = taxIds.map(taxId => ({
        itemId: id,
        taxId
      }));
      await db.insert(itemTaxes).values(itemTaxData);
    }
    
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
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    
    if (lineItems.length > 0) {
      const lineItemsWithInvoiceId = lineItems.map(item => ({
        ...item,
        invoiceId: newInvoice.id
      }));
      await db.insert(invoiceLineItems).values(lineItemsWithInvoiceId);
    }
    
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>, lineItems: InsertInvoiceLineItem[]): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();

    // Update line items
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
    
    if (lineItems.length > 0) {
      const lineItemsWithInvoiceId = lineItems.map(item => ({
        ...item,
        invoiceId: id
      }));
      await db.insert(invoiceLineItems).values(lineItemsWithInvoiceId);
    }
    
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getInvoiceStats(): Promise<{ total: number; paid: number; pending: number; overdue: number }> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        paid: sql<number>`count(*) filter (where status = 'paid')`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        overdue: sql<number>`count(*) filter (where status = 'overdue')`
      })
      .from(invoices);

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
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template> {
    const [updatedTemplate] = await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }
}

export const storage = new DatabaseStorage();
