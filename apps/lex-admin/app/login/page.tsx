import { redirect } from "next/navigation";

export default function LoginAlias({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  const from = searchParams?.from ? String(searchParams.from) : "/";
  redirect(`/auth/login?from=${encodeURIComponent(from)}`);
}
