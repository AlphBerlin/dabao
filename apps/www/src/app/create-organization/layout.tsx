import { ReactNode } from "react";

export default function CreateOrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="border-b bg-background h-16 flex items-center px-6">
        <div className="container mx-auto flex justify-center">
          <h1 className="text-xl font-semibold">Dabao</h1>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          © {new Date().getFullYear()} Dabao Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}