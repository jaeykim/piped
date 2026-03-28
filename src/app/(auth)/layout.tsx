import { Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">Piped</span>
      </Link>
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        {children}
      </div>
    </div>
  );
}
