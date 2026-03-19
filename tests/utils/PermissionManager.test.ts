import { GuildMember, PermissionResolvable } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { PermissionManager } from "../../src/utils/PermissionManager";

describe("PermissionManager", () => {
  const createMockMember = (permissions: string[] = [], roles: string[] = []) =>
    ({
      permissions: {
        has: vi.fn((perm: PermissionResolvable) =>
          permissions.includes(perm as string),
        ),
      },
      roles: {
        cache: roles.map((name) => ({ name })),
      },
    }) as unknown as GuildMember;

  it("échoue si membre introuvable", () => {
    const res = PermissionManager.check(null, {});
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Utilisateur introuvable.");
  });

  it("réussit sans contraintes", () => {
    const res = PermissionManager.check(createMockMember(), {});
    expect(res.allowed).toBe(true);
  });

  it("échoue si permission manquante", () => {
    const member = createMockMember(["ReadMessageHistory"]);
    const res = PermissionManager.check(member, {
      permissions: ["Administrator"],
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("permission");
  });

  it("réussit avec permission correcte", () => {
    const member = createMockMember(["Administrator"]);
    const res = PermissionManager.check(member, {
      permissions: ["Administrator"],
    });
    expect(res.allowed).toBe(true);
  });

  it("échoue si rôle manquant", () => {
    const member = createMockMember([], ["User"]);
    const res = PermissionManager.check(member, { roles: ["Admin"] });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("rôle");
  });

  it("réussit avec rôle correct (au moins 1)", () => {
    const member = createMockMember([], ["User", "Admin"]);
    const res = PermissionManager.check(member, { roles: ["Admin"] });
    expect(res.allowed).toBe(true);
  });
});
