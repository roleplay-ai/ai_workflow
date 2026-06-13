import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

function buildPreInitScript(completedJson: string): string {
  return `<script>
(function(){
  try {
    localStorage.setItem('aiMasteryFinalCompleted', '${completedJson}');
  } catch(e) {}
})();
</script>
`;
}

const BRIDGE_SCRIPT = `
<script>
(function(){
  var _orig = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(k, v) {
    _orig(k, v);
    if (k === 'aiMasteryFinalCompleted') {
      try { window.parent.postMessage({ type: 'ai-mastery-progress', completedModules: JSON.parse(v) }, '*'); } catch(e) {}
    }
  };
})();
</script>
`;

// When ?moduleId= is supplied, hide chrome (sidebar, bottom-nav) and
// auto-navigate to that single module so guests see only its content.
function buildPreviewScript(moduleId: string): string {
  // Strip anything that isn't safe in a data-attribute selector value
  const safe = moduleId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `<script>
(function(){
  var s = document.createElement('style');
  s.textContent = [
    '.sidebar{display:none!important}',
    '.app{grid-template-columns:1fr!important}',
    '.mobile-menu{display:none!important}',
    '.bottom-nav{display:none!important}'
  ].join('');
  document.head.appendChild(s);

  var target = '${safe}';
  function openTarget() {
    var btn = document.querySelector('[data-open="' + target + '"]');
    if (btn) { btn.click(); return; }
    setTimeout(openTarget, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openTarget);
  } else {
    openTarget();
  }
})();
</script>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("moduleId");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guests see the course in read-only preview mode; progress not saved
  let completedModules: string[] = [];
  if (user) {
    const { data: rows } = await supabase
      .from("ai_mastery_progress")
      .select("module_id")
      .eq("user_id", user.id);
    completedModules = (rows ?? []).map(r => r.module_id as string);
  }
  const completedJson = JSON.stringify(completedModules).replace(/'/g, "\\'");

  let html: string;
  try {
    const filePath = path.join(process.cwd(), "assets", "ai-mastery-course.html");
    html = await readFile(filePath, "utf-8");
  } catch {
    return new NextResponse("Course content unavailable.", { status: 404 });
  }

  // 1. Pre-init: load persisted progress into localStorage before the course JS runs
  const scriptStart = "<script>\nconst modules = [";
  html = html.replace(scriptStart, buildPreInitScript(completedJson) + scriptStart);

  // 2. Preview mode: hide nav chrome and auto-jump to the requested module
  if (moduleId) {
    html = html.replace("</body>", buildPreviewScript(moduleId) + "\n</body>");
  }

  // 3. Bridge: relay progress changes back to the parent frame
  html = html.replace("</body>", BRIDGE_SCRIPT + "\n</body>");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
