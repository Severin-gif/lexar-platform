import { NextRequest } from "next/server";
import { adminProxy } from "@/lib/adminProxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminProxy(req, {
    path: `/admin/users/${params.id}/plan`
  });
}
