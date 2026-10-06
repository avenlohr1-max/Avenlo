export type ExtractedEducation = {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
  currently_studying: boolean;
};

export type ExtractedWork = {
  company: string;
  title: string;
  location: string;
  start_year: number | null;
  end_year: number | null;
  currently_working: boolean;
  description: string;
};

export type ExtractedCandidateProfile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  target_roles: string[];
  experience_years: number | null;
  seniority: string | null;
  education: ExtractedEducation[];
  work_history: ExtractedWork[];
};

const SECTION_HEADINGS: Record<string, RegExp> = {
  summary: /^(professional\s+)?(summary|profile|objective|about\s+me)$/i,
  experience: /^(professional\s+)?(experience|work\s+experience|employment\s+history)$/i,
  education: /^(education|academic\s+background|qualifications)$/i,
  skills: /^(technical\s+)?(skills|core\s+skills|competencies)$/i,
  projects: /^(selected\s+)?projects$/i,
  certifications: /^(certifications|licenses|credentials)$/i,
};

const DATE_RANGE = /(19\d{2}|20\d{2})\s*(?:-|–|—|to)\s*(19\d{2}|20\d{2}|present|current|now)/i;
const YEAR = /\b(19\d{2}|20\d{2})\b/g;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+?\d[\d ()-]{7,}\d)/;

function linesOf(text: string) {
  return text.split(/\n+/).map((line) => line.replace(/^[\s•▪◦*\-]+/, "").trim()).filter(Boolean);
}

function isHeading(line: string) {
  return Object.values(SECTION_HEADINGS).some((pattern) => pattern.test(line));
}

function sectionLines(lines: string[], section: RegExp) {
  const start = lines.findIndex((line) => section.test(line));
  if (start < 0) return [];
  const result: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (isHeading(lines[index])) break;
    result.push(lines[index]);
  }
  return result;
}

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function firstContactLine(lines: string[]) {
  return lines.findIndex((line) => EMAIL.test(line) || PHONE.test(line));
}

function extractIdentity(lines: string[]) {
  const contactIndex = firstContactLine(lines);
  const top = lines.slice(0, Math.min(contactIndex >= 0 ? contactIndex + 1 : 8, 8));
  const name = top.find((line) => {
    if (EMAIL.test(line) || PHONE.test(line) || isHeading(line)) return false;
    if (/https?:\/\//i.test(line) || /\b(linkedin|github)\.com\b/i.test(line)) return false;
    return /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line);
  }) || null;
  const email = lines.join(" ").match(EMAIL)?.[0] ?? null;
  const phone = lines.join(" ").match(PHONE)?.[0]?.trim() ?? null;
  const nameIndex = name ? lines.indexOf(name) : -1;
  const candidates = nameIndex >= 0 ? lines.slice(nameIndex + 1, contactIndex >= 0 ? contactIndex : nameIndex + 4) : [];
  const headline = candidates.find((line) => line.length >= 4 && line.length <= 100 && !EMAIL.test(line) && !PHONE.test(line) && !isHeading(line) && !/https?:\/\//i.test(line)) ?? null;
  const location = candidates.find((line) => /,\s*[A-Za-z]{2,}|\b(India|USA|UK|Canada|Australia|Singapore|UAE)\b/i.test(line) && line !== headline) ?? null;
  return { name, email, phone, headline, location };
}

function extractSkills(text: string, lines: string[]) {
  const skillLines = sectionLines(lines, SECTION_HEADINGS.skills);
  const skills = skillLines.join(",").split(/[,|•;]+/).map(clean).filter(Boolean);
  if (skills.length) return [...new Set(skills)].slice(0, 30);
  return [];
}

function extractEducation(lines: string[]): ExtractedEducation[] {
  const rows = sectionLines(lines, SECTION_HEADINGS.education);
  const entries: ExtractedEducation[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const line = rows[index];
    const years = [...line.matchAll(YEAR)].map((match) => Number(match[1]));
    const range = line.match(DATE_RANGE);
    if (!years.length && !range && index > 0) continue;
    const institution = clean(rows[Math.max(0, index - (years.length || range ? 1 : 0))]);
    const degreeLine = rows.slice(Math.max(0, index - 1), Math.min(rows.length, index + 2)).find((candidate) => /\b(b\.?[a-z]*|m\.?[a-z]*|ph\.?d|bachelor|master|doctor|diploma|degree|engineering|computer science|business|commerce|arts|science)\b/i.test(candidate));
    if (!institution || isHeading(institution)) continue;
    const start = range ? Number(range[1]) : years[0] ?? null;
    const endToken = range?.[2] ?? (years[1] ? String(years[1]) : null);
    const current = Boolean(endToken && /present|current|now/i.test(endToken));
    const end = current ? null : (endToken ? Number(endToken) : null);
    const duplicate = entries.some((entry) => entry.institution.toLowerCase() === institution.toLowerCase());
    if (!duplicate) entries.push({ institution, degree: degreeLine && degreeLine !== institution ? degreeLine : "", field_of_study: "", start_year: start, end_year: end, currently_studying: current });
  }
  return entries.slice(0, 8);
}

function extractWork(lines: string[]): ExtractedWork[] {
  const rows = sectionLines(lines, SECTION_HEADINGS.experience);
  const entries: ExtractedWork[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const range = rows[index].match(DATE_RANGE);
    if (!range) continue;
    const previous = rows.slice(Math.max(0, index - 3), index).filter((line) => line.length <= 100);
    const title = previous.at(-1) || "";
    const company = previous.at(-2) || "";
    const current = /present|current|now/i.test(range[2]);
    const start = Number(range[1]);
    const end = current ? null : Number(range[2]);
    const description = rows.slice(index + 1, Math.min(rows.length, index + 5)).join(" ").slice(0, 800);
    if (!title && !company) continue;
    entries.push({ company, title, location: "", start_year: start, end_year: end, currently_working: current, description });
  }
  return entries.slice(0, 10);
}

export function extractCandidateProfile(text: string, detectedSkills: string[], summary: string | null): ExtractedCandidateProfile {
  const lines = linesOf(text);
  const identity = extractIdentity(lines);
  const education = extractEducation(lines);
  const workHistory = extractWork(lines);
  const years = workHistory.reduce((total, row) => total + Math.max(0, (row.end_year ?? new Date().getFullYear()) - (row.start_year ?? new Date().getFullYear())), 0);
  const experienceYears = years > 0 ? Math.round(years * 2) / 2 : null;
  const seniority = experienceYears == null ? null : experienceYears < 2 ? "Entry level" : experienceYears < 4 ? "Mid-level" : experienceYears < 8 ? "Senior" : experienceYears < 12 ? "Lead" : "Manager";
  const targetRoles = identity.headline ? identity.headline.split(/[|–—,]/).map(clean).filter((value) => value.length > 2).slice(0, 3) : [];
  return {
    full_name: identity.name,
    email: identity.email,
    phone: identity.phone,
    headline: identity.headline,
    location: identity.location,
    bio: summary,
    skills: detectedSkills.length ? detectedSkills : extractSkills(text, lines),
    target_roles: targetRoles,
    experience_years: experienceYears,
    seniority,
    education,
    work_history: workHistory,
  };
}
