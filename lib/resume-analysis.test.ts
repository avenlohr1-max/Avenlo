import { expect, test } from "vitest";
import { analyzeResume } from "./resume-analysis";

test("case variants do not inflate detected skills or resume readiness", () => {
  const args = { text: "Skills: SQL, Python, Excel", fileName: "synthetic.pdf", fileType: "pdf" as const };
  const baseline = analyzeResume(args);
  const withProfile = analyzeResume({ ...args, candidateSkills: ["sql", "SQL", "python", "excel"] });
  expect(withProfile.detectedSkills).toEqual(["Excel", "Python", "SQL"]);
  expect(withProfile.score).toBe(baseline.score);
});
