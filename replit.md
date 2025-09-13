# Overview

InvoicePro is a full-stack invoice management system built with React and Express. The application provides comprehensive tools for creating, managing, and tracking invoices, customers, items, taxes, and PDF templates. It features a modern UI with real-time data management, form validation, and PDF generation capabilities for professional invoice documents.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod schema validation
- **PDF Generation**: @react-pdf/renderer for creating downloadable invoice PDFs

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL
- **Validation**: Zod schemas for API request/response validation
- **Development**: Hot module replacement with Vite integration

## Data Storage
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema**: Relational design with tables for users, customers, taxes, items, invoices, invoice line items, templates, and item-tax relationships
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## API Structure
- **Pattern**: RESTful API with Express routes
- **Endpoints**: CRUD operations for customers, taxes, items, invoices, and templates
- **Error Handling**: Centralized error handling middleware
- **Request Logging**: Custom middleware for API request logging
- **Data Transfer**: JSON with TypeScript type safety throughout

## Key Features
- **Invoice Management**: Create, edit, delete, and track invoice status (pending, paid, overdue)
- **Customer Database**: Manage customer information including billing addresses and GSTIN
- **Item Catalog**: Product/service items with tax associations and pricing
- **Tax Configuration**: Flexible tax system with percentage-based calculations
- **PDF Templates**: Customizable invoice templates with branding options
- **Dashboard Analytics**: Invoice statistics and quick action shortcuts
- **Form Validation**: Client and server-side validation with user-friendly error messages

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time database connections via ws package

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

## Development Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development banner and error overlay for Replit environment

## Validation and Forms
- **Zod**: Schema validation for both client and server
- **React Hook Form**: Performant form library with minimal re-renders
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Date and Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class management
- **nanoid**: Secure URL-friendly unique ID generation

## Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions