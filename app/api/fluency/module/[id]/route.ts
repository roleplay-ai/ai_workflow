import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fluency_modules")
    .select(`
      id, title, emoji, concepts, next_module_hint,
      fluency_module_screens(
        id, screen_type, order_index, label, title, body,
        examples, caption, question, options, correct_index, feedback, next_text
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const screens = (data.fluency_module_screens as any[]).sort(
    (a, b) => a.order_index - b.order_index
  );

  return Response.json({ ...data, fluency_module_screens: screens });
}
