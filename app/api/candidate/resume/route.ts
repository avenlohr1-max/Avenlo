import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { analyzeResume, extractResumeText } from "@/lib/resume-analysis";
import { extractCandidateProfile } from "@/lib/resume-profile";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "candidate") return NextResponse.json({ error: "Only candidate accounts can upload a resume here." }, { status: 403 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a resume file first." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Resume must be 10 MB or smaller." }, { status: 400 });

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Upload a PDF, DOC, or DOCX file." }, { status: 400 });
    }

    const fileType = extension as "pdf" | "doc" | "docx";
    const admin = createAdminClient();
    const [{ data: candidate }, { data: skills }] = await Promise.all([
      admin.from("candidate_profiles").select("preferences").eq("user_id", user.id).maybeSingle(),
      admin.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
    ]);

    const bucket = await admin.storage.getBucket("candidate-documents");
    if (bucket.error) {
      const created = await admin.storage.createBucket("candidate-documents", {
        public: false,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: [...ALLOWED_TYPES],
      });
      if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
        throw new Error(`Resume storage is not ready: ${created.error.message}`);
      }
    }

    const path = `${user.id}/resume.${extension}`;
    const upload = await admin.storage.from("candidate-documents").upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
    if (upload.error) throw new Error(`Resume upload failed: ${upload.error.message}`);

    let analysis;
    let extractedProfile;
    try {
      const extracted = await extractResumeText(file, fileType);
      analysis = analyzeResume({
        text: extracted.text,
        fileName: file.name,
        fileType,
        pageCount: extracted.pageCount,
        candidateSkills: (skills ?? []).map((item) => item.skill),
      });
      extractedProfile = extractCandidateProfile(extracted.text, analysis.detectedSkills, analysis.summary);
    } catch (parseError) {
      analysis = {
        version: 1 as const,
        analyzedAt: new Date().toISOString(),
        fileName: file.name,
        fileType,
        wordCount: 0,
        pageCount: null,
        score: 0,
        contact: { email: false, phone: false },
        sections: [],
        candidateSkills: (skills ?? []).map((item) => item.skill),
        detectedSkills: [],
        quantifiedBullets: 0,
        actionBullets: 0,
        bulletCount: 0,
        summary: null,
        strengths: [],
        improvements: ["The resume was stored, but its text could not be extracted. Try exporting it again as a text-based PDF or DOCX."],
        parserNote: parseError instanceof Error ? parseError.message : "Resume text extraction failed.",
      };
      extractedProfile = extractCandidateProfile("", [], null);
    }

    const preferences = candidate?.preferences && typeof candidate.preferences === "object" ? candidate.preferences : {};
    const { error: profileError } = await admin.from("candidate_profiles").upsert({
      user_id: user.id,
      resume_path: path,
      preferences: { ...preferences, resume_analysis: analysis, resume_import: extractedProfile },
    }, { onConflict: "user_id" });
    if (profileError) throw new Error(`Resume was uploaded but could not update your profile: ${profileError.message}`);

    return NextResponse.json({ ok: true, path, analysis, extractedProfile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload your resume." }, { status: 500 });
  }
}
