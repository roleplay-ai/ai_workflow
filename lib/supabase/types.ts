export type Role = "user" | "admin" | "superadmin";

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  created_by: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
  role: Role;
  created_at: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  time_estimate_minutes: number | null;
  points: number;
  tools: string[];
  tags: string[];
  functions: string[];
  position: number;
  published: boolean;
  is_featured: boolean;
  is_locked: boolean;
  is_mastery: boolean;
  hero_position: number | null;
  category: string;
  created_at: string;
  thumbnail_url: string | null;
};

export type ActivityTag = {
  id: string;
  name: string;
  icon_url: string | null;
  created_at: string;
};

export type ActivityFunction = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export type ToolDeepDiveLinkType = "external" | "html";

export type ToolDeepDive = {
  id: string;
  title: string;
  url: string | null;
  link_type: ToolDeepDiveLinkType;
  html_path: string | null;
  description: string | null;
  tool: string | null;
  position: number;
  published: boolean;
  created_at: string;
};

export type ActivityCompany = {
  activity_id: string;
  company_id: string;
};

export type ToolLogo = {
  tool: string;
  logo_url: string;
  updated_at: string;
};

export type AIMasteryProgress = {
  user_id: string;
  module_id: string;
  completed_at: string;
};



export type SlideImage = { url: string; caption?: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

export type ActivityStep = {
  id: string;
  activity_id: string;
  step_number: number;
  slide_number: number;
  title: string;
  what_learner_sees: string;
  what_this_means: string;
  what_to_do: string[];
  if_stuck: string;
  callout: string;
  coach_next: string;
  created_at: string;
};

export type PromptTemplate = {
  label: string;
  text: string;
};

export type DownloadFile = {
  label: string;
  url: string;
  type: "pdf" | "ppt" | "xlsx" | "doc" | "other";
};

export type ActivityContent = {
  id: string;
  activity_id: string;
  // Slides tab
  slide_images: SlideImage[];
  // Workflow tab — raw markdown; steps parsed from it on the fly
  workflow_markdown: string | null;
  // Quiz tab
  quiz: QuizQuestion[];
  // Goals & Access tab
  goals: string[];           // bullet list of what learner will achieve
  access_needed: string[];   // tools/accounts they need access to
  // Prompts tab
  prompts: PromptTemplate[];
  // Downloads tab — files uploaded to storage
  downloads: DownloadFile[];
  // Video tab — optional activity walkthrough video
  video_url?: string | null;
  updated_at: string;
};


export type ChatLog = {
  id: string;
  user_id: string;
  activity_id: string;
  step_index: number;
  step_title: string;
  user_message: string;
  ai_response: string;
  navigated_to_step: number | null;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  activity_id: string;
  status: "not_started" | "in_progress" | "completed";
  completed_steps: number[];  // array of step indices the user has ticked
  quiz_score: number | null;
  completed_at: string | null;
  updated_at: string;
  video_watched?: boolean;    // true once learner has watched ≥80% of the video
};

// Supabase generic Database type
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: { name: string; domain?: string | null; created_by?: string | null };
        Update: { name?: string; domain?: string | null };
      };
      profiles: {
        Row: Profile;
        Insert: { id: string; email?: string | null; full_name?: string | null; avatar_url?: string | null; company_id?: string | null; role?: Role };
        Update: { email?: string | null; full_name?: string | null; avatar_url?: string | null; company_id?: string | null; role?: Role };
      };
      activities: {
        Row: Activity;
        Insert: { title: string; description?: string | null; level?: Activity["level"]; time_estimate_minutes?: number | null; points?: number; tools?: string[]; tags?: string[]; functions?: string[]; position?: number; published?: boolean; is_featured?: boolean; is_locked?: boolean; category?: string };
        Update: { title?: string; description?: string | null; level?: Activity["level"]; time_estimate_minutes?: number | null; points?: number; tools?: string[]; tags?: string[]; functions?: string[]; position?: number; published?: boolean; is_featured?: boolean; is_locked?: boolean; category?: string };
      };
      activity_companies: {
        Row: ActivityCompany;
        Insert: { activity_id: string; company_id: string };
        Update: never;
      };
      tool_logos: {
        Row: ToolLogo;
        Insert: { tool: string; logo_url: string; updated_at?: string };
        Update: { logo_url?: string; updated_at?: string };
      };
      activity_content: {
        Row: ActivityContent;
        Insert: Omit<ActivityContent, "id">;
        Update: Partial<Omit<ActivityContent, "id" | "activity_id">>;
      };
      activity_steps: {
        Row: ActivityStep;
        Insert: Omit<ActivityStep, "id" | "created_at">;
        Update: Partial<Omit<ActivityStep, "id" | "activity_id" | "created_at">>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: { user_id: string; activity_id: string; status?: UserProgress["status"]; completed_steps?: number[]; quiz_score?: number | null; completed_at?: string | null; updated_at?: string };
        Update: { status?: UserProgress["status"]; completed_steps?: number[]; quiz_score?: number | null; completed_at?: string | null; updated_at?: string; video_watched?: boolean };
      };
      chat_logs: {
        Row: ChatLog;
        Insert: Omit<ChatLog, "id" | "created_at">;
        Update: never;
      };
      tool_deep_dives: {
        Row: ToolDeepDive;
        Insert: { title: string; url?: string | null; link_type?: ToolDeepDiveLinkType; html_path?: string | null; description?: string | null; tool?: string | null; position?: number; published?: boolean };
        Update: { title?: string; url?: string | null; link_type?: ToolDeepDiveLinkType; html_path?: string | null; description?: string | null; tool?: string | null; position?: number; published?: boolean };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
