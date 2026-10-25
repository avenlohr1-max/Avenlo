import { describe, expect, it } from "vitest";
import { extractResumePhone } from "./resume-contact";
import { extractCandidateProfile } from "./resume-profile";

describe("resume contact extraction", () => {
  it("does not import employment or education year ranges as a phone", () => {
    expect(extractResumePhone("Experience: 2024 - 2026\nEducation: 2021 - 2024")).toBeNull();
    expect(extractCandidateProfile("Demo Candidate\nExperience\n2024 - 2026", [], null).phone).toBeNull();
  });
  it("extracts international phone numbers", () => {
    expect(extractResumePhone("Mobile: +91 98765 43210")).toBe("+91 98765 43210");
  });
  it("keeps a real phone separate from dated employment", () => {
    expect(extractResumePhone("Phone: +1 (202) 555-0199\nExperience 2024 - 2026")).toBe("+1 (202) 555-0199");
  });
  it("does not treat numeric email identifiers as phones", () => {
    expect(extractResumePhone("123456789012@example.test")).toBeNull();
  });
  it("accepts explicitly labelled local numbers", () => {
    expect(extractResumePhone("Tel: 8123 4567")).toBe("8123 4567");
  });
  it("does not import a calendar date as a labelled phone", () => {
    expect(extractResumePhone("Phone: 12-03-2024")).toBeNull();
  });
});
