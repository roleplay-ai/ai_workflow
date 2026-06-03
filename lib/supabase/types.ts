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

export type Module = {
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  published: boolean;
  created_by: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  time_estimate_minutes: number | null;
  points: number;
  tools: string[];
  position: number;
  created_at: string;
};

export type SlideImage = { url: string; caption?: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

export type WorkflowStep = {
  title: string;
  body: string; // markdown body of that step
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
  updated_at: string;
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
      modules: {
        Row: Module;
        Insert: { title: string; description?: string | null; categories?: string[]; published?: boolean; created_by?: string | null };
        Update: { title?: string; description?: string | null; categories?: string[]; published?: boolean };
      };
      activities: {
        Row: Activity;
        Insert: { module_id: string; title: string; description?: string | null; level?: Activity["level"]; time_estimate_minutes?: number | null; points?: number; tools?: string[]; position?: number };
        Update: { title?: string; description?: string | null; level?: Activity["level"]; time_estimate_minutes?: number | null; points?: number; tools?: string[]; position?: number };
      };
      activity_content: {
        Row: ActivityContent;
        Insert: Omit<ActivityContent, "id">;
        Update: Partial<Omit<ActivityContent, "id" | "activity_id">>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: { user_id: string; activity_id: string; status?: UserProgress["status"]; completed_steps?: number[]; quiz_score?: number | null; completed_at?: string | null; updated_at?: string };
        Update: { status?: UserProgress["status"]; completed_steps?: number[]; quiz_score?: number | null; completed_at?: string | null; updated_at?: string };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
