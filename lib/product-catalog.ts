export const productCatalog = [
  ["01", "Talent Record", "Understand yourself", "Your experience, education and ambitions, in a professional record you can correct and control.", "/dashboard/profile"],
  ["02", "Signal Ledger", "Understand yourself", "Keep the source, context and uncertainty behind your achievements visible.", "/dashboard/signals"],
  ["03", "Capability Atlas", "Understand yourself", "Connect recorded skills to work examples. Review resume mentions before relying on them.", "/dashboard/skills"],
  ["04", "Career Scenario Lab", "Explore your next move", "Compare career directions, test assumptions and capture what you still need to learn.", "/dashboard/scenarios"],
  ["05", "Opportunity Intelligence", "Explore your next move", "Explore human-curated opportunities with a reason to consider each one.", "/dashboard/recommendations"],
  ["06", "Role Intelligence Studio", "Make a clearer decision", "Employers define the work, expected outcomes and evidence that matters, with Avenlo review.", "/companies"],
  ["07", "Mutual Decision Room", "Make a clearer decision", "A focused candidate–employer conversation with explicit participants, purpose and access controls.", "/dashboard/rooms"],
  ["08", "Proof Studio", "Make a clearer decision", "Prepare a private work example, remove sensitive details and approve exactly what you share.", "/dashboard/proofs"],
  ["09", "Decision Dossier", "Make a clearer decision", "Keep shared evidence, questions and human judgments together inside your decision room.", "/dashboard/rooms"],
  ["10", "Human Intelligence Services", "Get human support", "Request scoped support, follow progress and receive guidance from an assigned human operator.", "/dashboard/services"],
].map(([number, name, group, description, href]) => ({ number, name, group, description, href }));
