import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const size = { width: 1200, height: 630 };

const levelColors: Record<string, string> = {
  Beginner: "#4ade80",
  Intermediate: "#facc15",
  Advanced: "#f87171",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("title, level, time_estimate_minutes, category, tools")
    .eq("id", id)
    .single();

  if (!activity) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a1a",
            color: "#fff",
            fontSize: 48,
          }}
        >
          Activity not found
        </div>
      ),
      { ...size }
    );
  }

  const logoData = await readFile(
    join(process.cwd(), "public", "Nudgeable-black.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  const badgeColor = levelColors[activity.level ?? ""] ?? "#a3a3a3";
  const tools = (activity.tools ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Yellow accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "6px",
            background: "#facc15",
            display: "flex",
          }}
        />

        {/* Header: logo + category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              borderRadius: "12px",
              padding: "8px 20px",
            }}
          >
            <img src={logoSrc} height="36" />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#a3a3a3",
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {activity.category}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: activity.title.length > 60 ? 42 : 56,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {activity.title}
          </div>
        </div>

        {/* Footer: badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {activity.level && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: badgeColor,
                color: "#1a1a1a",
                fontSize: 20,
                fontWeight: 600,
                padding: "8px 20px",
                borderRadius: "999px",
              }}
            >
              {activity.level}
            </div>
          )}

          {activity.time_estimate_minutes && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.1)",
                color: "#e5e5e5",
                fontSize: 20,
                padding: "8px 20px",
                borderRadius: "999px",
              }}
            >
              {activity.time_estimate_minutes} min
            </div>
          )}

          {tools.map((tool: string) => (
            <div
              key={tool}
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.08)",
                color: "#d4d4d4",
                fontSize: 18,
                padding: "8px 16px",
                borderRadius: "999px",
              }}
            >
              {tool}
            </div>
          ))}
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "60px",
            display: "flex",
            color: "#525252",
            fontSize: 16,
          }}
        >
          AI Practice Lab
        </div>
      </div>
    ),
    { ...size }
  );
}
