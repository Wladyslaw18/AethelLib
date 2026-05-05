import { world } from "@minecraft/server"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"

/*
 * HIERARCHY_ADMINISTRATION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The primary administrative interface for managing the server's RBAC 
 * hierarchy. Orchestrates the creation, deletion, and modification of 
 * rank manifests, and manages the assignment of rank-tags to entity 
 * buffers.
 *
 * PHILOSOPHY: Order is paramount. Use this vector to calibrate the 
 * status and clearance levels of the empire's components.
 */
export const RankAdminCommand = {
    name: "rankadmin",
    description: "Orchestrates the calibration and management of the industrial hierarchy.",
    usage: "!rankadmin <subcommand> [args...]",
    permission: "essentials.admin.ranks",
    category: "Admin",

    /* 
     * SUBCOMMAND_ROUTING_ENGINE
     */
    async execute(data, player, args) {
        if (args.length < 1) {
            player.sendMessage("[Manual] Syntax Error: Subcommand required.");
            player.sendMessage("  create <tag> <display_name> <order> <color_token>");
            player.sendMessage("  delete <tag>");
            player.sendMessage("  add <player_identifier> <tag>");
            player.sendMessage("  remove <player_identifier> <tag>");
            player.sendMessage("  edit <tag> <field> <value>");
            player.sendMessage("  list | info <tag>");
            return
        }

        const subcommand = args[0].toLowerCase()
        
        switch (subcommand) {
            case "create":
                await handleCreate(player, args.slice(1))
                break
            case "delete":
                await handleDelete(player, args.slice(1))
                break
            case "add":
                await handleAdd(player, args.slice(1))
                break
            case "remove":
                await handleRemove(player, args.slice(1))
                break
            case "edit":
                await handleEdit(player, args.slice(1))
                break
            case "list":
                await handleList(player)
                break
            case "info":
                await handleInfo(player, args.slice(1))
                break
            default:
                player.sendMessage(`[Error] Unknown hierarchy vector: '${subcommand}'`);
        }
    }
}

/* 
 * RANK_MANIFEST_INJECTION_HANDLER
 */
async function handleCreate(player, args) {
    if (args.length < 4) {
        player.sendMessage("[Manual] Syntax Hint: !rankadmin create <tag> <display_name> <order> <color_token>");
        return
    }

    const [tag, displayName, orderStr, colorCode] = args

    if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
        player.sendMessage("[Error] Validation Error: Rank tag must be alphanumeric.");
        return
    }

    const order = parseInt(orderStr)
    if (isNaN(order)) {
        player.sendMessage("[Error] Calibration Error: Order must be a numeric identifier.");
        return
    }

    if (RankSystem.getRank(tag)) {
        player.sendMessage(`[Error] Conflict: Rank '${tag}' already exists in registry.`);
        return
    }

    const rankData = {
        name: displayName,
        order: order,
        colorText: colorCode,
        colorName: colorCode,
        hideRanks: false,
        permissions: {},
        inherits: null
    }

    const success = RankSystem.createRank(tag, rankData)
    if (success) {
        player.sendMessage(`[Success] Rank manifest '${tag}' injected into registry.`);
    } else {
        player.sendMessage("[Fatal] Registry commit failure.");
    }
}

/* 
 * RANK_MANIFEST_DECOMMISSION_HANDLER
 */
async function handleDelete(player, args) {
    if (args.length < 1) {
        player.sendMessage("[Manual] Syntax Hint: !rankadmin delete <tag>");
        return
    }

    const tag = args[0]

    if (!RankSystem.getRank(tag)) {
        player.sendMessage(`[Error] Query failure: Rank '${tag}' not found.`);
        return
    }

    const success = RankSystem.deleteRank(tag)
    if (success) {
        player.sendMessage(`[Success] Rank manifest '${tag}' decommissioned.`);
        
        world.getAllPlayers().forEach(p => {
            if (p.hasTag(tag)) {
                p.removeTag(tag)
            }
        })
    } else {
        player.sendMessage("[Fatal] Registry write failure.");
    }
}

/* 
 * TAG_ASSIGNMENT_HANDLER
 */
async function handleAdd(player, args) {
    if (args.length < 2) {
        player.sendMessage("[Manual] Syntax Hint: !rankadmin add <player_identifier> <tag>");
        return
    }

    const [playerName, tag] = args

    if (!RankSystem.getRank(tag)) {
        player.sendMessage(`[Error] Query failure: Rank '${tag}' not found.`);
        return
    }

    const target = world.getAllPlayers().find(p => p.name === playerName)
    if (!target) {
        player.sendMessage(`[Error] Entity '${playerName}' not found in active buffer.`);
        return
    }

    target.addTag(tag)
    player.sendMessage(`[Success] Rank tag '${tag}' injected into '${target.name}' buffer.`);
    target.sendMessage(`[System] Identity recalibrated: You have been assigned the rank '${tag}'.`);
}

/* 
 * TAG_REMOVAL_HANDLER
 */
async function handleRemove(player, args) {
    if (args.length < 2) {
        player.sendMessage("[Manual] Syntax Hint: !rankadmin remove <player_identifier> <tag>");
        return
    }

    const [playerName, tag] = args

    const target = world.getAllPlayers().find(p => p.name === playerName)
    if (!target) {
        player.sendMessage(`[Error] Entity '${playerName}' not found in active buffer.`);
        return
    }

    target.removeTag(tag)
    player.sendMessage(`[Success] Rank tag '${tag}' decommissioned from '${target.name}' buffer.`);
    target.sendMessage(`[System] Identity recalibrated: You have lost the rank '${tag}'.`);
}

/* 
 * MANIFEST_CALIBRATION_HANDLER
 */
async function handleEdit(player, args) {
    if (args.length < 3) {
        player.sendMessage("[Manual] Syntax Hint: !rankadmin edit <tag> <field> <value>");
        player.sendMessage("[Manual] Allowed Fields: name, color, order");
        return
    }

    const [tag, field, value] = args
    const allowedFields = ["name", "color", "order"]
    if (!allowedFields.includes(field)) {
        player.sendMessage(`[Error] Calibration Error: Field '${field}' is not a valid target.`);
        return
    }

    const rank = RankSystem.getRank(tag)
    if (!rank) {
        player.sendMessage(`[Error] Query failure: Rank '${tag}' not found.`);
        return
    }

    const updatedRank = { ...rank }
    
    switch (field) {
        case "name":
            updatedRank.name = value
            updatedRank.displayName = value
            break
        case "color":
            updatedRank.colorText = value
            updatedRank.colorName = value
            break
        case "order":
            const order = parseInt(value)
            if (isNaN(order)) {
                player.sendMessage("[Error] Calibration Error: Value must be a numeric identifier.");
                return
            }
            updatedRank.order = order
            break
    }

    const success = RankSystem.updateRank(tag, updatedRank)
    if (success) {
        player.sendMessage(`[Success] Manifest field '${field}' recalibrated for rank '${tag}'.`);
    } else {
        player.sendMessage("[Fatal] Registry write failure.");
    }
}

/* 
 * GLOBAL_HIERARCHY_QUERY
 */
async function handleList(player) {
    const ranks = RankSystem.getAllRanks()
    
    if (Object.keys(ranks).length === 0) {
        player.sendMessage("[Info] Hierarchy buffer is currently empty.");
        return
    }

    player.sendMessage("§0§l» §6§lINDUSTRIAL_HIERARCHY_MANIFEST§0 «")
    Object.entries(ranks).forEach(([tag, rank]) => {
        player.sendMessage(`§7- ${tag}: ${rank.colorText}${rank.name} §8[ORDER_${rank.order}]`)
    })
}

/* 
 * SPECIFIC_MANIFEST_QUERY
 */
async function handleInfo(player, args) {
    if (args.length < 1) {
        player.sendMessage("[Manual] Syntax Hint: !rankadmin info <tag>");
        return
    }

    const tag = args[0]
    const rank = RankSystem.getRank(tag)

    if (!rank) {
        player.sendMessage(`[Error] Query failure: Rank '${tag}' not found.`);
        return
    }

    player.sendMessage(`§0§l» §6§lMANIFEST_DATA: ${tag}§0 «`)
    player.sendMessage(`§7Identifier: ${rank.colorText}${rank.name}`)
    player.sendMessage(`§7Industrial_Order: ${rank.order}`)
    player.sendMessage(`§7Color_Token: ${rank.colorText}`)
    player.sendMessage(`§7Auth_Nodes: ${JSON.stringify(rank.permissions, null, 2)}`)
}
