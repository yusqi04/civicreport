import RegisterForm from "./register-form";
import { getSafeNextPath } from "@/lib/auth/redirect";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return <RegisterForm nextPath={getSafeNextPath(next) ?? undefined} />;
}
