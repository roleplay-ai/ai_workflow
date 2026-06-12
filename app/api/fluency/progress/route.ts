import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { module_id } = await req.json();
  if (!module_id) return Response.json({ error: "module_id required" }, { status: 400 });

  const { error } = await supabase
    .from("fluency_module_progress")
    .upsert({ user_id: user.id, module_id });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { module_id } = await req.json();
  if (!module_id) return Response.json({ error: "module_id required" }, { status: 400 });

  const { error } = await supabase
    .from("fluency_module_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("module_id", module_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
