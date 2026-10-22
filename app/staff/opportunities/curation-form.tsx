"use client";

import { useState } from "react";
import { basisLabels, roleBasis, type OpportunityRole } from "@/lib/opportunity-context";
import { curateOpportunity } from "./actions";

export function CurationForm({ people, roles }: { people: { id: string; full_name: string | null }[]; roles: OpportunityRole[] }) {
  const [roleId, setRoleId] = useState("");
  const role = roles.find((item) => item.id === roleId);
  return <form action={curateOpportunity} className="form">
    <label>Candidate<select name="candidateId" required defaultValue=""><option value="" disabled>Choose a candidate</option>{people.map((person) => <option key={person.id} value={person.id}>{person.full_name || "Unnamed candidate"} · {person.id.slice(0, 8)}</option>)}</select></label>
    <label>Employer role<select name="jobId" required value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="" disabled>Choose an open role</option>{roles.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.id.slice(0, 8)}</option>)}</select></label>
    {role && <section aria-label="Selected employer role"><h2>{role.title}</h2><p style={{ whiteSpace: "pre-wrap" }}>{role.description}</p><dl>{Object.entries(basisLabels).map(([field, label]) => <div key={field}><dt><strong>{label}</strong></dt><dd>{roleBasis(role, field)}</dd></div>)}</dl></section>}
    <label>Role information behind the suggestion<select name="basis" required>{Object.entries(basisLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label>Why consider this role?<textarea name="note" required maxLength={2000} rows={5} placeholder="Explain which published role details may be worth exploring. Mark assumptions and questions; avoid claims about private candidate evidence." /></label>
    <button className="btn btn--primary" type="submit">Send private suggestion</button>
  </form>;
}
