import LoginForm from "./login-form";
import { getSafeNextPath } from "@/lib/auth/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return <LoginForm nextPath={getSafeNextPath(next) ?? undefined} />;
}
