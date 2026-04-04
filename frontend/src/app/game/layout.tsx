import { AuthGuard } from "@/components/auth/AuthGuard";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
