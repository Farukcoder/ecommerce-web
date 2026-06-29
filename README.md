# Ecommerce Web

This is a modern ecommerce web application built with Next.js, React, Tailwind CSS, and TypeScript.

## Project Overview

This project is the frontend part of a feature-rich online store where users can:

- browse products
- add items to the cart
- proceed to checkout
- sign up or log in
- manage their wishlist
- track orders
- switch currency and theme

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand-style context-based state management

## Prerequisites

Make sure your system has the following installed:

- Node.js 18+ (recommended 20+)
- npm or pnpm
- Git

## Installation

Go to the project folder:

```bash
git clone <your-repository-url>
cd ecommerce-web
```

Install the dependencies:

```bash
npm install
```

## Environment Setup

Create a `.env.local` file in the project root and add the following value:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

> If your backend API is running on a different host or port, update this URL accordingly.

## Run the Project

To start the application in development mode:

```bash
npm run dev
```

Then open your browser at:

```text
http://localhost:3000
```

## Build for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Lint Check

```bash
npm run lint
```

## Project Structure

```text
app/           # Next.js pages and layouts
components/    # Reusable UI components
lib/           # API helpers, utilities, and app logic
public/        # Static assets
styles/        # Global styles
```

## Notes

- This project is a frontend application, so the backend API must be running.
- If the API is unavailable, some pages may not load data properly.

## Author

Ecommerce Web Project
