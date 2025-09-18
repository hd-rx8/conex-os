# AI Rules for CONEX.HUB Application

This document outlines the core technologies and libraries used in the CONEX.HUB application, along with guidelines for their usage.

## Tech Stack Overview

*   **Frontend Framework**: React with TypeScript for building dynamic user interfaces.
*   **Build Tool**: Vite for a fast development experience and optimized builds.
*   **Styling**: Tailwind CSS for a utility-first approach to styling, including custom themes and gradients defined in `tailwind.config.ts`.
*   **UI Components**: shadcn/ui, built on Radix UI primitives, for accessible, customizable, and visually consistent UI components.
*   **Routing**: React Router DOM for declarative client-side navigation.
*   **State Management/Data Fetching**: React Query for efficient server state management, caching, and synchronization.
*   **Authentication & Database**: Supabase for backend services, including user authentication and database interactions.
*   **Form Management**: React Hook Form for robust form handling, integrated with Zod for schema validation.
*   **Icons**: Lucide React for a comprehensive set of SVG icons.
*   **Notifications**: Sonner for elegant and customizable toast notifications.
*   **Charting**: Recharts for creating interactive data visualizations and charts.
*   **Date Utilities**: date-fns for parsing, formatting, and manipulating dates.

## Library Usage Rules

To maintain consistency, performance, and best practices, please adhere to the following rules when developing:

*   **UI Components**:
    *   **Always** prioritize using components from `shadcn/ui`.
    *   If a specific component is not available or requires significant customization, create a **new component file** that wraps or extends existing `shadcn/ui` primitives or Radix UI components. **Do not modify existing `shadcn/ui` files directly.**
*   **Styling**:
    *   **Exclusively** use Tailwind CSS classes for all styling. Avoid inline styles or separate CSS files unless absolutely necessary for global styles (e.g., `src/index.css`).
    *   Leverage the custom colors and gradients defined in `tailwind.config.ts` for brand consistency.
*   **Routing**:
    *   Use `react-router-dom` for all application navigation.
    *   Keep the main application routes defined within `src/App.tsx`.
*   **Data Fetching/Server State**:
    *   Use `@tanstack/react-query` for all asynchronous data fetching, caching, and server state management.
*   **Authentication**:
    *   All authentication-related tasks (login, signup, logout, session management) must be handled using `@supabase/supabase-js`.
*   **Database Interactions**:
    *   All database operations (fetching, inserting, updating, deleting data) should be performed using `@supabase/supabase-js`.
*   **Forms**:
    *   Use `react-hook-form` for managing form state, validation, and submission.
    *   Integrate `zod` with `@hookform/resolvers` for schema-based form validation.
*   **Icons**:
    *   Use `lucide-react` for all icons throughout the application.
*   **Notifications**:
    *   Use `sonner` for displaying toast notifications to users. The `Toaster` component from `sonner` is already configured in `App.tsx`.
*   **Charts**:
    *   For any data visualization or charting requirements, use `recharts`.
*   **Date Manipulation**:
    *   Utilize `date-fns` for any date formatting, parsing, or manipulation tasks.