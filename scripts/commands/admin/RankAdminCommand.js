/**
 * Rank Admin Command - In-game rank management
 */

import { world } from "@minecraft/server"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"

export const RankAdminCommand = {
    name: "rankadmin",
    description: "Manage server ranks",
    usage: "!rankadmin <subcommand> [args...]",
    permission: "essentials.admin.ranks",
    category: "admin",

    async execute(data, player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !rankadmin <create|delete|add|remove|edit|list|info> [args...]")
            player.sendMessage("§7Subcommands:")
            player.sendMessage("§7  create <tag> <displayName> <order> <colorCode>")
            player.sendMessage("§7  delete <tag>")
            player.sendMessage("§7  add <playerName> <tag>")
            player.sendMessage("§7  remove <playerName> <tag>")
            player.sendMessage("§7  edit <tag> <field> <value>")
            player.sendMessage("§7  list")
            player.sendMessage("§7  info <tag>")
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
                player.sendMessage(`§cUnknown subcommand: ${subcommand}`)
        }
    }
}

async function handleCreate(player, args) {
    if (args.length < 4) {
        player.sendMessage("§cUsage: !rankadmin create <tag> <displayName> <order> <colorCode>")
        return
    }

    const [tag, displayName, orderStr, colorCode] = args

    // Validate tag is alphanumeric
    if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
        player.sendMessage("§cRank tag must be alphanumeric only")
        return
    }

    // Validate order is a number
    const order = parseInt(orderStr)
    if (isNaN(order)) {
        player.sendMessage("§cOrder must be a valid number")
        return
    }

    // Check if rank already exists
    if (RankSystem.getRank(tag)) {
        player.sendMessage(`§cRank '${tag}' already exists`)
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
        player.sendMessage(`§aSuccessfully created rank '${tag}'`)
    } else {
        player.sendMessage("§cFailed to create rank")
    }
}

async function handleDelete(player, args) {
    if (args.length < 1) {
        player.sendMessage("§cUsage: !rankadmin delete <tag>")
        return
    }

    const tag = args[0]

    // Check if rank exists
    if (!RankSystem.getRank(tag)) {
        player.sendMessage(`§cRank '${tag}' does not exist`)
        return
    }

    const success = RankSystem.deleteRank(tag)
    if (success) {
        player.sendMessage(`§aSuccessfully deleted rank '${tag}'`)
        
        // Remove rank from all online players
        world.getAllPlayers().forEach(p => {
            if (p.hasTag(tag)) {
                p.removeTag(tag)
            }
        })
    } else {
        player.sendMessage("§cFailed to delete rank")
    }
}

async function handleAdd(player, args) {
    if (args.length < 2) {
        player.sendMessage("§cUsage: !rankadmin add <playerName> <tag>")
        return
    }

    const [playerName, tag] = args

    // Check if rank exists
    if (!RankSystem.getRank(tag)) {
        player.sendMessage(`§cRank '${tag}' does not exist`)
        return
    }

    // Find target player
    const target = world.getAllPlayers().find(p => p.name === playerName)
    if (!target) {
        player.sendMessage(`§cPlayer '${playerName}' not found or not online`)
        return
    }

    // Add rank tag
    target.addTag(tag)
    player.sendMessage(`§aAdded rank '${tag}' to ${target.name}`)
    target.sendMessage(`§aYou have been given the rank '${tag}'`)
}

async function handleRemove(player, args) {
    if (args.length < 2) {
        player.sendMessage("§cUsage: !rankadmin remove <playerName> <tag>")
        return
    }

    const [playerName, tag] = args

    // Find target player
    const target = world.getAllPlayers().find(p => p.name === playerName)
    if (!target) {
        player.sendMessage(`§cPlayer '${playerName}' not found or not online`)
        return
    }

    // Remove rank tag
    target.removeTag(tag)
    player.sendMessage(`§aRemoved rank '${tag}' from ${target.name}`)
    target.sendMessage(`§cYou have lost the rank '${tag}'`)
}

async function handleEdit(player, args) {
    if (args.length < 3) {
        player.sendMessage("§cUsage: !rankadmin edit <tag> <field> <value>")
        player.sendMessage("§7Allowed fields: name, color, order")
        return
    }

    const [tag, field, value] = args

    // Validate field
    const allowedFields = ["name", "color", "order"]
    if (!allowedFields.includes(field)) {
        player.sendMessage(`§cInvalid field. Allowed: ${allowedFields.join(", ")}`)
        return
    }

    // Check if rank exists
    const rank = RankSystem.getRank(tag)
    if (!rank) {
        player.sendMessage(`§cRank '${tag}' does not exist`)
        return
    }

    // Update rank
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
                player.sendMessage("§cOrder must be a valid number")
                return
            }
            updatedRank.order = order
            break
    }

    const success = RankSystem.updateRank(tag, updatedRank)
    if (success) {
        player.sendMessage(`§aSuccessfully updated ${field} for rank '${tag}'`)
    } else {
        player.sendMessage("§cFailed to update rank")
    }
}

async function handleList(player) {
    const ranks = RankSystem.getAllRanks()
    
    if (Object.keys(ranks).length === 0) {
        player.sendMessage("§7No ranks found")
        return
    }

    player.sendMessage("§6§lServer Ranks:")
    Object.entries(ranks).forEach(([tag, rank]) => {
        player.sendMessage(`§7- ${tag}: ${rank.colorText}${rank.name} (order: ${rank.order})`)
    })
}

async function handleInfo(player, args) {
    if (args.length < 1) {
        player.sendMessage("§cUsage: !rankadmin info <tag>")
        return
    }

    const tag = args[0]
    const rank = RankSystem.getRank(tag)

    if (!rank) {
        player.sendMessage(`§cRank '${tag}' does not exist`)
        return
    }

    player.sendMessage(`§6§lRank Info: ${tag}`)
    player.sendMessage(`§7Name: ${rank.colorText}${rank.name}`)
    player.sendMessage(`§7Order: ${rank.order}`)
    player.sendMessage(`§7Color: ${rank.colorText}`)
    player.sendMessage(`§7Permissions: ${JSON.stringify(rank.permissions, null, 2)}`)
}

