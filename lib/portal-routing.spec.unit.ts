import { afterEach, describe, expect, it, vi } from "vitest";
import { portalForHost } from "./portal-routing";

afterEach(() => vi.unstubAllEnvs());

describe("explicit Workers preview host", () => {
  it("accepts only the configured preview and preserves public domain routing", () => {
    vi.stubEnv("AVENLO_PREVIEW_HOST", "avenlo-compatibility.avenlohr1.workers.dev");
    expect(portalForHost("avenlo-compatibility.avenlohr1.workers.dev").portal).toBe("development");
    expect(portalForHost("other.avenlohr1.workers.dev").portal).toBe("unknown");
    expect(portalForHost("avenlo-compatibility.attacker.workers.dev").portal).toBe("unknown");
    expect(portalForHost("avenlo-compatibility.avenlohr1.workers.dev.attacker.test").portal).toBe("unknown");
    expect(portalForHost("avenlo.in").portal).toBe("candidate");
    expect(portalForHost("staff.avenlo.in").portal).toBe("staff");
  });
  it("does not accept a preview when unconfigured or set to a wildcard", () => {
    vi.stubEnv("AVENLO_PREVIEW_HOST", "");
    expect(portalForHost("avenlo-compatibility.avenlohr1.workers.dev").portal).toBe("unknown");
    vi.stubEnv("AVENLO_PREVIEW_HOST", "*.workers.dev");
    expect(portalForHost("avenlo-compatibility.avenlohr1.workers.dev").portal).toBe("unknown");
  });
});
