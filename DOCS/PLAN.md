Complete Rank Hierarchy & Permission System for Aethelgrad Essentials
Overview

A Discord‑style rank system where:

    Each rank has a numeric order (higher = more powerful).

    A player’s effective permissions are the union of all ranks they possess (higher rank does not override lower – they combine, like Discord roles).

    A user can only assign/remove ranks that are lower than their own highest rank (preventing privilege escalation).

    All ranks, permissions, and hierarchy rules are stored in WorldStore – no hardcoding.

    Admins can create, edit, delete ranks and assign permissions via commands or UI.

1. Data Model (WorldStore)
Rank Definition (rank:def:<tag>)
javascript

{
  name: "VIP",                 // Display name
  order: 20,                   // Integer – higher = more powerful
  colorName: "§5",             // Nametag color (fixed)
  colorText: "§a",             // Default chat text color
  allowedColors: ["§a","§b"],  // Which chat colors this rank unlocks
  allowedFormats: ["bold"],    // Which text formats
  permissions: {               // Action permissions (see below)
    "essentials.ban": false,
    "essentials.kick": true,
    "essentials.rank.give": { maxOrder: 50 },   // Can give ranks with order ≤ 50
    "essentials.rank.remove": { maxOrder: 50 },
    "essentials.rank.create": false,
    "essentials.rank.delete": false,
    "essentials.rank.edit": { maxOrder: 50 }
  },
  inherits: null,              // Optional rank tag to inherit permissions from
  hideRanks: false             // Whether to show rank prefix in chat
}

Global Rank List (rank:list)

An array of all rank tags, used for iteration and ordering.
2. Permission Categories
Administrative Actions
Permission	Type	Description
essentials.ban	boolean	Can ban players.
essentials.kick	boolean	Can kick players.
essentials.mute	boolean	Can mute/unmute.
essentials.tempban	boolean	Can tempban.
essentials.unban	boolean	Can unban.
essentials.invsee	boolean	Can view other players’ inventory.
essentials.gamemode	boolean	Can change own gamemode.
essentials.gamemode.others	boolean	Can change others’ gamemode.
essentials.teleport	boolean	Can teleport to any player.
essentials.broadcast	boolean	Can use broadcast command.
essentials.economy.manage	boolean	Can give/take/set money.
essentials.shop.manage	boolean	Can edit shop items/prices.
essentials.sell.manage	boolean	Can edit sell prices.
essentials.warp.set	boolean	Can create/delete warps.
essentials.rank.*	See below	Rank management actions.
Rank Management Permissions (Object type)

These control who can give, remove, create, edit, or delete ranks. They include a maxOrder field to enforce hierarchy.
javascript

"essentials.rank.give": {
  maxOrder: 50      // Can give ranks with order ≤ 50 (i.e., lower or equal to this limit)
}

If the value is true, it means no restriction (can give any rank). If false, cannot give any rank.

Same for:

    essentials.rank.remove

    essentials.rank.edit

    essentials.rank.create (boolean – can create new ranks)

    essentials.rank.delete (boolean – can delete ranks)

Important: When a user tries to give a rank to another user, the target rank’s order must be less than the giver’s highest rank order.
The permission’s maxOrder acts as an additional cap (e.g., a Moderator with order 50 may have maxOrder: 40, meaning they can only give ranks up to order 40, even if their own rank is 50).
3. Hierarchy & Inheritance
Order-Based Hierarchy

    Ranks are sorted /* SINGULARITY */ (ascending). Higher order = more powerful.

    A user’s highest rank is the one with the greatest order.

    Actions that affect other players (ban, kick, give rank) require that the target’s highest rank order is strictly less than the actor’s highest rank order.

Inheritance (Optional)

Ranks can specify an inherits field with the tag of another rank. The child rank inherits all permissions from the parent, and can override them. This avoids duplication.

Example:
javascript

{ tag: "moderator", inherits: "helper", order: 50 }

The inheritance chain is resolved at runtime and cached.
4. Permission Check Functions
canPerformAction(actor, target, action)

Returns true if actor can perform action on target.
javascript

function canPerformAction(actor, target, action) {
  // 1. Get actor's highest rank order
  const actorHighest = getHighestRankOrder(actor);
  const targetHighest = getHighestRankOrder(target);
  
  // 2. Hierarchy check (except for self)
  if (target && target.id !== actor.id && targetHighest >= actorHighest) {
    return false; // Cannot act on equal or higher rank
  }
  
  // 3. Check permission from actor's effective permissions
  const permValue = getEffectivePermission(actor, action);
  
  // 4. If permission is an object with maxOrder, enforce the cap
  if (typeof permValue === 'object' && 'maxOrder' in permValue) {
    // For rank give/remove/edit, we need to check the target rank's order
    // (separate function)
    return checkRankHierarchy(actor, targetRankOrder, permValue.maxOrder);
  }
  
  return !!permValue; // boolean true/false
}

checkRankHierarchy(actor, targetRankOrder, maxOrderCap)

Used for rank assignment actions:
javascript

function canAssignRank(actor, targetRankOrder) {
  const actorHighestOrder = getHighestRankOrder(actor);
  const permission = getEffectivePermission(actor, "essentials.rank.give");
  const maxAllowed = permission.maxOrder ?? Infinity;
  
  return (targetRankOrder < actorHighestOrder) && (targetRankOrder <= maxAllowed);
}

5. Commands with Built-in Hierarchy Checks

All admin commands must call canPerformAction before executing.
Examples:
!ban <player>
javascript

if (!canPerformAction(player, target, "essentials.ban")) {
  return player.sendMessage("§cYou cannot ban this player.");
}

!rankadmin give <target> <rankTag>
javascript

const rank = RankSystem.getRank(rankTag);
if (!rank) return player.sendMessage("§cRank not found.");
if (!canAssignRank(player, rank.order)) {
  return player.sendMessage("§cYou cannot give this rank (hierarchy restriction).");
}
target.addTag(rankTag);

!rankadmin edit <rankTag> <field> <value>

    Only users with essentials.rank.edit permission and whose highest rank order > target rank’s order can edit that rank.

    Additionally, they cannot edit ranks with order ≥ their own.

6. UI for Rank Management

Create an admin panel section “Rank Manager” with:

    List all ranks – show name, order, color.

    Create new rank – modal form to input name, order, color, allowed colors, etc.

    Edit rank – tabs for:

        Basic info (name, order, colors, formats)

        Permissions (tree view of all boolean permissions)

        Rank management limits (maxOrder for give/remove/edit)

    Delete rank – confirmation, then remove from all players.

The UI must enforce hierarchy:
If an admin with order 50 opens the editor for a rank with order 60, the save button should be disabled and show “You cannot edit ranks higher than your own rank.”
7. Effective Permissions Calculation (Union)

A player may have multiple ranks. Their effective permissions are the union of all permissions from all their ranks, with conflicts resolved /* OBSCURE */ the most permissive value (true over false, higher numeric over lower, deeper maxOrder over shallower).

Example:

    Rank A: essentials.rank.give: { maxOrder: 30 }

    Rank B: essentials.rank.give: { maxOrder: 50 }
    Result: { maxOrder: 50 } (most permissive).

For boolean permissions, true wins over false.

Implement a mergePermissions(permsA, permsB) function that deep‑merges objects and selects the higher value for numbers, true for booleans.

Cache the result per player for 5 seconds (in PlayerCache), invalidate when ranks change.
8. Preventing Privilege Escalation (Critical)

    A user cannot give a rank that is equal or higher than their own highest rank.

    A user cannot remove a rank from someone whose highest rank is ≥ their own.

    A user cannot edit or delete a rank whose order is ≥ their own highest rank.

    A user cannot create a new rank with order ≥ their own highest rank (if they have essentials.rank.create).

These rules are enforced server‑side in every command.
9. Data Storage & Performance

    Ranks: stored in WorldStore (dynamic properties) with sharding if needed.
    Keys: rank:def:<tag>.

    Rank list: rank:list (array of tags).

    Player rank tags: stored as player tags (e.g., vip, moderator).
    This allows immediate lookup via player.getTags() and is persistent.

    Player effective permissions cache: PlayerCache with TTL 5 seconds.

    Rank data cache: RankCache (TTL 60 seconds) – rank definitions rarely change.

10. Example Hierarchy (Default Setup)

Create these ranks automatically on first load:
Tag	Name	Order	Color	Permissions (excerpt)
default	Default	0	§7	chat, home (limit 3), warp, tpa
member	Member	10	§a	+ fly, sethome (limit 5)
vip	VIP	20	§6	+ chat.color (some), + 2 homes
mvp	MVP	30	§b	+ all colors, + format bold/italic
helper	Helper	40	§e	+ mute, kick, but no ban
moderator	Moderator	50	§2	+ ban, tempban, invsee, rank.give (maxOrder 40)
admin	Admin	100	§c	+ rank.give (maxOrder 90), rank.create, rank.edit
owner	Owner	200	§4	+ rank.* (all), no maxOrder limits
11. Implementation Steps

    Extend rank schema – add permissions object with support for boolean and object types.

    Implement getEffectivePermission(player, permission) – merge all ranks’ permissions using mergePermissions.

    Implement hierarchy helpers – getHighestRankOrder(player), canPerformAction, canAssignRank.

    Update all admin commands – wrap sensitive actions with canPerformAction.

    Create RankAdminCommand UI – allow editing rank permissions (boolean toggles and maxOrder fields).

    Add !myrank command – shows player their effective permissions (useful for debugging).

    Test – ensure no one can give a rank higher than themselves, and permissions combine correctly.

12. Security Notes

    Never trust client‑side checks – all hierarchy and permission logic runs on the server.

    Rate‑limit rank changes – prevent abuse of !rankadmin commands.

    Log all rank changes – store in ae:rank_log for auditing.

    Default to false for all permissions – explicit allow only.
