import { GuildMember, PermissionResolvable } from "discord.js";

export interface PermissionCheckOptions {
  permissions?: PermissionResolvable[];
  roles?: string[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string | null;
}

export class PermissionManager {
  public static check(
    member: GuildMember | null,
    options: PermissionCheckOptions,
  ): PermissionCheckResult {
    if (!member) {
      return { allowed: false, reason: "Utilisateur introuvable." };
    }

    if (options.permissions && options.permissions.length > 0) {
      for (const perm of options.permissions) {
        if (!member.permissions.has(perm)) {
          return {
            allowed: false,
            reason: `Vous n'avez pas la permission requise.`,
          };
        }
      }
    }

    if (options.roles && options.roles.length > 0) {
      let hasRole = false;
      for (const roleName of options.roles) {
        if (member.roles.cache.some((r) => r.name === roleName)) {
          hasRole = true;
          break;
        }
      }
      if (!hasRole) {
        return { allowed: false, reason: `Vous n'avez pas le rôle requis.` };
      }
    }

    return { allowed: true, reason: null };
  }
}
