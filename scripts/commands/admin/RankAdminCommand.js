import { world } from "@minecraft/server"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"

/*
 * Rank Admin Command
 * ----------------------------------------------------------------------------
 * Allows admins to manage server ranks and permissions.
 */

export const RankAdminCommand = {
    name: "rankadmin",
    description: "Manage player ranks and permissions",

    usage: "/ae:rankadmin <subcommand> [args...]",
    permission: "essentials.admin.ranks",
    category: "Admin",

    /* 
     * SUBCOMMAND_ROUTING_ENGINE
     */
    async execute(_data, player, args) {
        if (args.length < 1) {
            player.sendMessage("§c§l» §7Usage: /ae:rankadmin <subcommand>");
            player.sendMessage("§8- create <tag> <name> <order> <color>");
            player.sendMessage("§8- delete <tag>");
            player.sendMessage("§8- add <player> <tag>");
            player.sendMessage("§8- remove <player> <tag>");
            player.sendMessage("§8- edit <tag> <field> <value>");
            player.sendMessage("§8- list | info <tag>");
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
                player.sendMessage(`§c§l» §7Unknown subcommand: '${subcommand}'`);
        }

    }
}

/* 
 * RANK_MANIFEST_INJECTION_HANDLER
 */
async function handleCreate(player, args) {
    if (args.length < 4) {
        player.sendMessage("§c§l» §7Usage: /ae:rankadmin create <tag> <name> <order> <color>");
        return
    }


    const [tag, displayName, orderStr, colorCode] = args

    if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
        player.sendMessage("§c§l» §7Rank tag must be alphanumeric.");
        return
    }


    const order = parseInt(orderStr)
    if (isNaN(order)) {
        player.sendMessage("§c§l» §7Order must be a number.");
        return
    }


    if (RankSystem.getRank(tag)) {
        player.sendMessage(`§c§l» §7Rank '${tag}' already exists.`);
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
        player.sendMessage(`§a§l» §fRank §e${tag}§f has been created.`);
    } else {
        player.sendMessage("§c§l» §7Failed to create rank.");
    }
}


/* 
 * RANK_MANIFEST_DECOMMISSION_HANDLER
 */
async function handleDelete(player, args) {
    if (args.length < 1) {
        player.sendMessage("§c§l» §7Usage: /ae:rankadmin delete <tag>");
        return
    }


    const tag = args[0]

    if (!RankSystem.getRank(tag)) {
        player.sendMessage(`§c§l» §7Rank '${tag}' not found.`);
        return
    }


    const success = RankSystem.deleteRank(tag)
    if (success) {
        player.sendMessage(`§a§l» §fRank §e${tag}§f has been deleted.`);
        
        world.getAllPlayers().forEach(p => {
            if (p.hasTag(tag)) {
                p.removeTag(tag)
            }
        })
    } else {
        player.sendMessage("§c§l» §7Failed to delete rank.");
    }
}


/* 
 * TAG_ASSIGNMENT_HANDLER
 */
async function handleAdd(player, args) {
    if (args.length < 2) {
        player.sendMessage("§c§l» §7Usage: /ae:rankadmin add <player> <tag>");
        return
    }


    const [playerName, tag] = args

    if (!RankSystem.getRank(tag)) {
        player.sendMessage(`§c§l» §7Rank '${tag}' not found.`);
        return
    }


    const target = world.getAllPlayers().find(p => p.name === playerName)
    if (!target) {
        player.sendMessage(`§c§l» §7Player '${playerName}' not found.`);
        return
    }


    target.addTag(tag)
    player.sendMessage(`§a§l» §fRank §e${tag}§f added to §e${target.name}§f.`);
    target.sendMessage(`§a§l» §fYour rank was updated: You are now §e${tag}§f.`);
}


/* 
 * TAG_REMOVAL_HANDLER
 */
async function handleRemove(player, args) {
    if (args.length < 2) {
        player.sendMessage("§c§l» §7Usage: /ae:rankadmin remove <player> <tag>");
        return
    }


    const [playerName, tag] = args

    const target = world.getAllPlayers().find(p => p.name === playerName)
    if (!target) {
        player.sendMessage(`[Error] Entity '${playerName}' not found in active buffer.`);
        return
    }

    target.removeTag(tag)
    player.sendMessage(`§a§l» §fRank §e${tag}§f removed from §e${target.name}§f.`);
    target.sendMessage(`§a§l» §fYour rank was updated: You no longer have the rank §e${tag}§f.`);
}


/* 
 * MANIFEST_CALIBRATION_HANDLER
 */
async function handleEdit(player, args) {
    if (args.length < 3) {
        player.sendMessage("§c§l» §7Usage: /ae:rankadmin edit <tag> <field> <value>");
        player.sendMessage("§8- Fields: name, color, order");
        return
    }


    const [tag, field, value] = args
    const allowedFields = ["name", "color", "order"]
    if (!allowedFields.includes(field)) {
        player.sendMessage(`§c§l» §7Invalid field: '${field}'`);
        return
    }


    const rank = RankSystem.getRank(tag)
    if (!rank) {
        player.sendMessage(`§c§l» §7Rank '${tag}' not found.`);
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
                player.sendMessage("§c§l» §7Order must be a number.");
                return
            }
            updatedRank.order = order

            break
    }

    const success = RankSystem.updateRank(tag, updatedRank)
    if (success) {
        player.sendMessage(`§a§l» §fRank field §e${field}§f updated for §e${tag}§f.`);
    } else {
        player.sendMessage("§c§l» §7Failed to update rank.");
    }
}


/* 
 * GLOBAL_HIERARCHY_QUERY
 */
async function handleList(player) {
    const ranks = RankSystem.getAllRanks()
    
    if (Object.keys(ranks).length === 0) {
        player.sendMessage("§c§l» §7No ranks found.");
        return
    }


    player.sendMessage(" ")
    player.sendMessage("§6§lServer Ranks")
    Object.entries(ranks).forEach(([tag, rank]) => {
        player.sendMessage(`§7- ${tag}: ${rank.colorText}${rank.name} §8(Order: ${rank.order})`)
    })
    player.sendMessage(" ")
}


/* 
 * SPECIFIC_MANIFEST_QUERY
 */
async function handleInfo(player, args) {
    if (args.length < 1) {
        player.sendMessage("§c§l» §7Usage: /ae:rankadmin info <tag>");
        return
    }


    const tag = args[0]
    const rank = RankSystem.getRank(tag)

    if (!rank) {
        player.sendMessage(`§c§l» §7Rank '${tag}' not found.`);
        return
    }


    player.sendMessage(" ")
    player.sendMessage(`§6§lRank Info: §f${tag}`)
    player.sendMessage(`§7Display: ${rank.colorText}${rank.name}`)
    player.sendMessage(`§7Order: §e${rank.order}`)
    player.sendMessage(`§7Color: §e${rank.colorText}`)
    player.sendMessage(`§7Permissions: §f${JSON.stringify(rank.permissions, null, 2)}`)
    player.sendMessage(" ")
}

