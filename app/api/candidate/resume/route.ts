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
    const [{ data: candidate }, { data: skills }, { data: currentProfile }, { data: existingEducation }] = await Promise.all([
      admin.from("candidate_profiles").select("preferences, experience_years, seniority, work_mode, industry").eq("user_id", user.id).maybeSingle(),
      admin.from("candidate_skills").select("skill").eq("user_id", user.id).order("skill"),
      admin.from("profiles").select("full_name, phone, headline, location, bio").eq("id", user.id).maybeSingle(),
      admin.from("candidate_education").select("id").eq("user_id", user.id),
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
    const resumeImport = { ...extractedProfile, importedAt: new Date().toISOString() };
    const mergedPreferences = {
      ...preferences,
      target_roles: Array.isArray(preferences.target_roles) && preferences.target_roles.length ? preferences.target_roles : extractedProfile.target_roles,
      work_history: Array.isArray(preferences.work_history) && preferences.work_history.length ? preferences.work_history : extractedProfile.work_history,
      resume_analysis: analysis,
      resume_import: resumeImport,
    };

    const profilePatch = {
      full_name: currentProfile?.full_name?.trim() || extractedProfile.full_name || null,
      phone: currentProfile?.phone?.trim() || extractedProfile.phone || null,
      headline: currentProfile?.headline?.trim() || extractedProfile.headline || null,
      location: currentProfile?.location?.trim() || extractedProfile.location || null,
      bio: currentProfile?.bio?.trim() || extractedProfile.bio || null,
    };
    const { error: profileUpdateError } = await admin.from("profiles").update(profilePatch).eq("id", user.id);
    if (profileUpdateError) throw new Error(`Resume was uploaded but profile details could not be imported: ${profileUpdateError.message}`);

    const { error: candidateError } = await admin.from("candidate_profiles").upsert({
      user_id: user.id,
      experience_years: candidate?.experience_years ?? extractedProfile.experience_years,
      seniority: candidate?.seniority || extractedProfile.seniority,
      work_mode: candidate?.work_mode || null,
      industry: candidate?.industry || null,
      resume_path: path,
      preferences: mergedPreferences,
    }, { onConflict: "user_id" });
    if (candidateError) throw new Error(`Resume was uploaded but professional details could not be imported: ${candidateError.message}`);

    const existingSkillSet = new Set((skills ?? []).map((item) => item.skill.toLowerCase()));
    const newSkills = extractedProfile.skills.filter((skill) => !existingSkillSet.has(skill.toLowerCase())).map((skill) => ({ user_id: user.id, skill: skill.trim() })).filter((item) => item.skill);
    if (newSkills.length) {
      const { error: skillError } = await admin.from("candidate_skills").insert(newSkills);
      if (skillError) throw new Error(`Resume was uploaded but detected skills could not be imported: ${skillError.message}`);
    }

    if (!(existingEducation?.length ?? 0) && extractedProfile.education.length) {
      const educationRows = extractedProfile.education.map((item) => ({ user_id: user.id, institution: item.institution, degree: item.degree || null, field_of_study: item.field_of_study || null, start_year: item.start_year, end_year: item.currently_studying ? null : item.end_year, currently_studying: item.currently_studying }));
      const { error: educationError } = await admin.from("candidate_education").insert(educationRows);
      if (educationError) throw new Error(`Resume was uploaded but education could not be imported: ${educationError.message}`);
    }

    return NextResponse.json({ ok: true, path, analysis, extractedProfile: resumeImport });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload your resume." }, { status: 500 });
  }
}
