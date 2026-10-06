export type ResumeSection = {
  key: string;
  label: string;
  present: boolean;
};

export type ResumeAnalysis = {
  version: 1;
  analyzedAt: string;
  fileName: string;
  fileType: "pdf" | "docx" | "doc";
  wordCount: number;
  pageCount: number | null;
  score: number;
  contact: { email: boolean; phone: boolean };
  sections: ResumeSection[];
  candidateSkills: string[];
  detectedSkills: string[];
  quantifiedBullets: number;
  actionBullets: number;
  bulletCount: number;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  parserNote?: string;
};

const SKILL_ALIASES: Array<[string, string[]]> = [
  ["JavaScript", ["javascript", "js"]], ["TypeScript", ["typescript", "ts"]], ["React", ["react", "reactjs"]],
  ["Next.js", ["next.js", "nextjs"]], ["Node.js", ["node.js", "nodejs"]], ["Python", ["python"]],
  ["Java", ["java"]], ["C++", ["c++", "cpp"]], ["C#", ["c#", "csharp"]], ["SQL", ["sql"]],
  ["PostgreSQL", ["postgresql", "postgres"]], ["MySQL", ["mysql"]], ["MongoDB", ["mongodb", "mongo"]],
  ["AWS", ["aws", "amazon web services"]], ["Azure", ["azure"]], ["GCP", ["gcp", "google cloud"]],
  ["Docker", ["docker"]], ["Kubernetes", ["kubernetes", "k8s"]], ["Git", ["git", "github", "gitlab"]],
  ["REST APIs", ["rest api", "restful api", "rest apis"]], ["GraphQL", ["graphql"]], ["Figma", ["figma"]],
  ["Excel", ["excel", "microsoft excel"]], ["Power BI", ["power bi"]], ["Tableau", ["tableau"]],
  ["Machine Learning", ["machine learning", "ml"]], ["Data Analysis", ["data analysis", "data analytics"]],
  ["Project Management", ["project management"]], ["Agile", ["agile"]], ["Scrum", ["scrum"]],
  ["Communication", ["communication"]], ["Leadership", ["leadership"]], ["Problem Solving", ["problem solving"]],
];

const SECTION_ALIASES: Array<[string, string, string[]]> = [
  ["summary", "Profile / Summary", ["summary", "profile", "professional summary", "objective", "about me"]],
  ["experience", "Experience", ["experience", "work experience", "professional experience", "employment history"]],
  ["education", "Education", ["education", "academic background", "qualifications"]],
  ["skills", "Skills", ["skills", "technical skills", "core skills", "competencies"]],
  ["projects", "Projects", ["projects", "selected projects", "personal projects"]],
  ["certifications", "Certifications", ["certifications", "licenses", "credentials"]],
];

const ACTION_VERBS = /\b(achieved|built|created|designed|developed|delivered|deployed|drove|enabled|improved|increased|launched|led|managed|migrated|optimized|reduced|resolved|scaled|streamlined|automated)\b/i;
const QUANTITY = /(\b\d+(?:\.\d+)?\s?%|\b\d+(?:\.\d+)?\s?(?:x|k|m|million|thousand|users|clients|customers|projects|people|hours|days)|[$€£₹]\s?\d[\d,.]*|\b\d[\d,.]*\+)/i;

function cleanText(input: string) {
  return input.replace(/\u0000/g, " ").replace(/[\t\r]+/g, " ").replace(/ +/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function hasPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, "i").test(text);
}

function findSummary(text: string) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const index = lines.findIndex((line) => /^(professional )?(summary|profile|objective|about me)$/i.test(line));
  if (index < 0) return null;
  const body = lines.slice(index + 1, index + 5).filter((line) => !/^(experience|education|skills|projects|certifications)$/i.test(line));
  return body.join(" ").slice(0, 420) || null;
}

function extractSkills(text: string, candidateSkills: string[]) {
  const found = new Set<string>();
  for (const skill of candidateSkills) if (skill && text.toLowerCase().includes(skill.toLowerCase())) found.add(skill);
  for (const [label, aliases] of SKILL_ALIASES) if (aliases.some((alias) => hasPhrase(text, alias))) found.add(label);
  return [...found].sort((a, b) => a.localeCompare(b));
}

export function analyzeResume(args: { text: string; fileName: string; fileType: "pdf" | "docx" | "doc"; pageCount?: number | null; candidateSkills?: string[] }): ResumeAnalysis {
  const text = cleanText(args.text);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const bullets = lines.filter((line) => /^[-•▪◦*]\s+/.test(line) || /^\d+[.)]\s+/.test(line));
  const quantifiedBullets = bullets.filter((line) => QUANTITY.test(line)).length;
  const actionBullets = bullets.filter((line) => ACTION_VERBS.test(line)).length;
  const sections = SECTION_ALIASES.map(([key, label, aliases]) => ({ key, label, present: aliases.some((alias) => hasPhrase(text, alias)) }));
  const candidateSkills = args.candidateSkills ?? [];
  const detectedSkills = extractSkills(text, candidateSkills);
  const contact = { email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text), phone: /(?:\+?\d[\d ()-]{7,}\d)/.test(text) };

  let score = 0;
  score += Math.min(wordCount / 450, 1) * 12;
  score += contact.email ? 5 : 0;
  score += contact.phone ? 3 : 0;
  score += sections.filter((section) => section.present).length / sections.length * 30;
  score += Math.min(bullets.length / 10, 1) * 15;
  score += bullets.length ? Math.min(quantifiedBullets / Math.max(bullets.length, 1), 1) * 12 : 0;
  score += bullets.length ? Math.min(actionBullets / Math.max(bullets.length, 1), 1) * 8 : 0;
  score += Math.min(detectedSkills.length / 8, 1) * 15;
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (contact.email && contact.phone) strengths.push("Contact details are easy to find.");
  if (sections.find((section) => section.key === "experience")?.present) strengths.push("Experience is clearly represented.");
  if (detectedSkills.length >= 5) strengths.push(`${detectedSkills.length} relevant skills were detected from the document.`);
  if (quantifiedBullets >= 2) strengths.push("Several achievements include measurable evidence.");
  if (strengths.length === 0) strengths.push("The document is readable enough to begin structured analysis.");
  if (!contact.email) improvements.push("Add a professional email address near the top.");
  if (!contact.phone) improvements.push("Add a reachable phone number if appropriate for your applications.");
  if (!sections.find((section) => section.key === "experience")?.present) improvements.push("Add a clearly labelled experience section with recent roles and outcomes.");
  if (!sections.find((section) => section.key === "skills")?.present) improvements.push("Add a dedicated skills section so your core capabilities are easy to match.");
  if (quantifiedBullets < 2) improvements.push("Turn more responsibilities into measurable outcomes using numbers, percentages or scale.");
  if (wordCount < 180) improvements.push("The resume looks brief; add enough context to show scope and impact without adding filler.");
  if (detectedSkills.length < 4) improvements.push("Make your most relevant skills explicit and use the same terminology as your target roles.");

  return { version: 1, analyzedAt: new Date().toISOString(), fileName: args.fileName, fileType: args.fileType, wordCount, pageCount: args.pageCount ?? null, score: finalScore, contact, sections, candidateSkills, detectedSkills, quantifiedBullets, actionBullets, bulletCount: bullets.length, summary: findSummary(text), strengths: strengths.slice(0, 4), improvements: improvements.slice(0, 6), parserNote: args.fileType === "doc" ? "Legacy .doc files are stored but their text is not parsed yet. Save as .docx or PDF for full analysis." : undefined };
}

export async function extractResumeText(file: File, fileType: "pdf" | "docx" | "doc") {
  const buffer = await file.arrayBuffer();
  if (fileType === "doc") return { text: "", pageCount: null as number | null };
  if (fileType === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return { text: result.value, pageCount: null as number | null };
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return { text: pages.join("\n"), pageCount: document.numPages };
}
