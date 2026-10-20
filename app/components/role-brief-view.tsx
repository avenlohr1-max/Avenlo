import { type RoleDefinition } from "@/lib/role-definition";

export function RoleBriefView({ definition }: { definition: RoleDefinition }) {
  return <section><h3>{definition.title}</h3><p style={{ whiteSpace: "pre-wrap" }}>{definition.summary || "Purpose not supplied yet."}</p>
    <p>Location: {definition.location || "Not specified"} · Work mode: {definition.work_mode || "Not specified"}</p>
    <h4>Expected outcomes</h4>{definition.outcomes.length ? <ul>{definition.outcomes.map((outcome, index) => <li key={index}>{outcome}</li>)}</ul> : <p>No outcomes supplied yet.</p>}
    {(["essential", "preferred"] as const).map((group) => <section key={group}><h4>{group === "essential" ? "Essential requirements" : "Preferred capabilities"}</h4>{definition[group].length ? definition[group].map((item, index) => <div key={index} style={{ borderLeft: "3px solid #a8b9d0", paddingLeft: 16, marginBottom: 16 }}><strong>{item.requirement || "Requirement not supplied"}</strong><p>Expected evidence: {item.evidence || "Not supplied"}</p><p>{group === "essential" ? "Why essential" : "Why useful"}: {item.rationale || "Not supplied"}</p></div>) : <p>No {group} criteria supplied.</p>}</section>)}
  </section>;
}
