import Header from "@/components/Header";
import { redirect } from "next/navigation";
import React from "react";
import { getCurrentUser } from "@/actions/user.actions";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 text-gray-100">
      <Header user={user} />
      <div className="container py-8">{children}</div>
    </main>
  );
};

export default layout;
