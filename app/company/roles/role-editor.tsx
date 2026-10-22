"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reviewGaps, roleDefinitionSchema, type RoleBrief, type RoleDefinition } from "@/lib/role-definition";
import { saveRoleBrief } from "./actions";

const blankCriterion = () => ({ requirement: "", evidence: "", rationale: "" });
function Buttons({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return <div className="actions"><button type="submit" name="status" value="draft" className="btn" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button><button type="submit" name="status" value="submitted" className="btn btn--primary" disabled={pending || !ready}>Submit for review</button></div>;
}

export function RoleEditor({ companies, brief }: { companies: { id: string; name: string }[]; brief?: RoleBrief }) {
  const [definition, setDefinition] = useState<RoleDefinition>(brief ?? { title: "", summary: "", outcomes: [], essential: [blankCriterion()], preferred: [], location: "", work_mode: "" });
  const normalized = { ...definition, outcomes: definition.outcomes.map((item) => item.trim()).filter(Boolean) };
  const gaps = reviewGaps(normalized);
  const valid = roleDefinitionSchema.safeParse(normalized).success;
  function updateCriterion(group: "essential" | "preferred", index: number, field: "requirement" | "evidence" | "rationale", value: string) {
    setDefinition((current) => ({ ...current, [group]: current[group].map((item, position) => position === index ? { ...item, [field]: value } : item) }));
  }
  return <form action={saveRoleBrief} className="form">
    {brief && <><input type="hidden" name="id" value={brief.id} /><input type="hidden" name="revision" value={brief.revision} /><input type="hidden" name="companyId" value={brief.company_id} /></>}
    <input type="hidden" name="definition" value={JSON.stringify(normalized)} />
    {!brief && <label>Company<select name="companyId" required>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
    <label>Role title<input required maxLength={160} value={definition.title} onChange={(event) => setDefinition({ ...definition, title: event.target.value })} /></label>
    <label>Role purpose<textarea rows={4} maxLength={4000} value={definition.summary} onChange={(event) => setDefinition({ ...definition, summary: event.target.value })} /></label>
    <label>Expected outcomes — one per line, up to 12<textarea rows={4} value={definition.outcomes.join("\n")} onChange={(event) => setDefinition({ ...definition, outcomes: event.target.value.split("\n") })} onBlur={() => setDefinition((current) => ({ ...current, outcomes: current.outcomes.map((item) => item.trim()).filter(Boolean) }))} /></label>
    <label>Location<input maxLength={200} value={definition.location} onChange={(event) => setDefinition({ ...definition, location: event.target.value })} /></label>
    <label>Work mode<input maxLength={100} value={definition.work_mode} onChange={(event) => setDefinition({ ...definition, work_mode: event.target.value })} placeholder="Remote, hybrid or on site" /></label>
    {(["essential", "preferred"] as const).map((group) => <fieldset key={group}><legend>{group === "essential" ? "Essential requirements" : "Preferred capabilities"}</legend><p>{group === "essential" ? "Explain why each requirement is necessary and what evidence would demonstrate it." : "Keep optional capabilities separate from essentials and describe useful evidence."}</p>
      {definition[group].map((item, index) => <section key={index} style={{ padding: 16, marginBottom: 16, border: "1px solid #b9c8db", borderRadius: 8 }}>
        <label>{group === "essential" ? "Essential" : "Preferred"} {index + 1}<input maxLength={500} value={item.requirement} onChange={(event) => updateCriterion(group, index, "requirement", event.target.value)} /></label>
        <label>Expected evidence<textarea rows={3} maxLength={1000} value={item.evidence} onChange={(event) => updateCriterion(group, index, "evidence", event.target.value)} /></label>
        <label>{group === "essential" ? "Why is this essential?" : "Why is this useful? (optional)"}<textarea rows={2} maxLength={1000} value={item.rationale} onChange={(event) => updateCriterion(group, index, "rationale", event.target.value)} /></label>
        <button type="button" className="btn" onClick={() => setDefinition({ ...definition, [group]: definition[group].filter((_, position) => position !== index) })}>Remove criterion</button>
      </section>)}
      <button type="button" className="btn" disabled={definition[group].length >= 12} onClick={() => setDefinition({ ...definition, [group]: [...definition[group], blankCriterion()] })}>Add {group === "essential" ? "essential requirement" : "preferred capability"}</button>
    </fieldset>)}
    {gaps.length > 0 && <aside aria-label="Before submitting"><h3>Before submitting</h3><ul>{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></aside>}
    <p>Editing an approved brief clears its current approval. Save a draft or submit the new revision for review; history preserves the earlier definition and review.</p>
    {!valid && definition.title && <p role="alert">Check field limits and remove duplicate requirements before saving.</p>}
    <Buttons ready={valid && gaps.length === 0} />
  </form>;
}
