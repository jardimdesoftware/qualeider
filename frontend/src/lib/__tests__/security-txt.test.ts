import { readFileSync } from "fs";
import { join } from "path";

const file = readFileSync(
  join(__dirname, "../../../public/.well-known/security.txt"),
  "utf-8",
);
const field = (name: string) =>
  file.match(new RegExp(`^${name}:\s*(.+)$`, "m"))?.[1].trim();

describe("public/.well-known/security.txt (RFC 9116)", () => {
  it("tem Contact apontando para o relato privado de vulnerabilidades do repositório", () => {
    expect(field("Contact")).toBe(
      "https://github.com/jardimdesoftware/qualeider/security/advisories/new",
    );
  });

  it("tem Canonical e Policy em HTTPS", () => {
    expect(field("Canonical")).toMatch(
      /^https:\/\/.+\/\.well-known\/security\.txt$/,
    );
    expect(field("Policy")).toMatch(/^https:\/\/.+SECURITY\.md$/);
  });

  it("não está vencido: renove o campo Expires (máx. 1 ano à frente)", () => {
    const expires = new Date(field("Expires")!);
    const now = new Date();
    const oneYearAhead = new Date(now);
    oneYearAhead.setFullYear(now.getFullYear() + 1);

    expect(Number.isNaN(expires.getTime())).toBe(false);
    expect(expires.getTime()).toBeGreaterThan(now.getTime());
    expect(expires.getTime()).toBeLessThanOrEqual(oneYearAhead.getTime());
  });
});
