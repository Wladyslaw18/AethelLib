import { Kernel } from "../../core/Kernel.js";
import { Lang } from "../../ui/Lang.js"
import { UIUtils } from "../../ui/UIUtils.js"

/*
 * INDUSTRIAL_INVENTORY_AUDIT_V3
 * ----------------------------------------------------------------------------
 * A high-performance grid-based UI for inventory manipulation. 
 * Interfaces with the AethelLib Resource Pack [invUI.png] via the \u00A7a\u00A7e\u00A7l prefix.
 * 
 * GRID_LAYOUT [9x5]:
 * [0-4] Armor & Offhand | [5-7] Empty | [8] GIVE_VECTOR
 * [9-35] Main Inventory (27 slots)
 * [36-44] Hotbar (9 slots)
 */

export async function showInventoryUI(viewer, target) {
    if (!target || !target.isValid) return;
    const inv = target.getComponent(Kernel.EntityComponentTypes.Inventory)
    const equip = target.getComponent(Kernel.EntityComponentTypes.Equippable) // equip?.
    
    if (!inv?.container) {
        viewer.sendMessage(Lang.ERROR + "Access violation: Inventory buffer unreachable.");
        return
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_L + "\u00A70" + target.name + "'s Inventory")
        .body(`\u00A77Auditing player assets...`)

    // 1. ARMOR SLOTS (0-4)
    const armorSlots = [Kernel.EquipmentSlot.Head, Kernel.EquipmentSlot.Chest, Kernel.EquipmentSlot.Legs, Kernel.EquipmentSlot.Feet, Kernel.EquipmentSlot.Offhand]
    for (const slot of armorSlots) {
        const item = equip?.getEquipment(slot)
        form.button(item ? `\u00A7f${item.amount}x` : "\u00A78Empty", item ? Lang.getTexture(item.typeId) : "textures/ui/empty_armor_slot_" + slot.toLowerCase())
    }

    // 2. EMPTY FILLER (5-7)
    for (let i = 0; i < 3; i++) {
        form.button(" ", "textures/ui/blank")
    }

    // 3. GIVE BUTTON (8)
    form.button("\u00A7a\u00A7lGIVE\n\u00A78Asset Transfer", "textures/ui/plus")

    // 4. MAIN INVENTORY (9-35)
    for (let i = 9; i <= 35; i++) {
        const item = inv.container.getItem(i)
        form.button(item ? `\u00A7f${item.amount}x` : " ", item ? Lang.getTexture(item.typeId) : "textures/ui/blank")
    }

    // 5. HOTBAR (36-44)
    for (let i = 0; i < 9; i++) {
        const item = inv.container.getItem(i)
        form.button(item ? `\u00A7f${item.amount}x` : " ", item ? Lang.getTexture(item.typeId) : "textures/ui/blank")
    }

    const res = await UIUtils.showForm(viewer, form)
    if (res.canceled) return

    const index = res.selection

    // ROUTING
    if (index < 5) {
        // Armor Click
        const slot = armorSlots[index]
        const item = equip?.getEquipment(slot)
        if (item) await showItemActionMenu(viewer, target, item, "armor", slot)
        else viewer.sendMessage(Lang.GRAY + "Slot is vacant.")
    } else if (index === 8) {
        // Give Menu
        await showGiveMenu(viewer, target)
    } else if (index >= 9 && index <= 35) {
        // Main Inventory Click
        const slot = index
        const item = inv.container.getItem(slot)
        if (item) await showItemActionMenu(viewer, target, item, "inv", slot)
    } else if (index >= 36 && index <= 44) {
        // Hotbar Click
        const slot = index - 36
        const item = inv.container.getItem(slot)
        if (item) await showItemActionMenu(viewer, target, item, "inv", slot)
    }
    
    // Refresh UI after action
    Kernel.system.run(() => {
        if (viewer.isValid && target.isValid) {
            showInventoryUI(viewer, target)
        }
    })
}

async function showItemActionMenu(viewer, target, item, type, slot) {
    const form = new Kernel.ActionFormData()
        .title("\u00A76\u00A7lAsset Action")
        .body(`\u00A77Item: \u00A7e${item.typeId}\n\u00A77Amount: \u00A7f${item.amount}\n\u00A78Select protocol.`)
        .button("\u00A7a\u00A7lTAKE\n\u00A78Move to your inventory", "textures/ui/realms_slot_check")
        .button("\u00A7c\u00A7lPURGE\n\u00A78Delete asset", "textures/ui/trash_default")
        .button("\u00A77\u00A7lBACK", "textures/ui/cancel")

    const res = await UIUtils.showForm(viewer, form)
    if (res.canceled || res.selection === 2) return

    if (res.selection === 0) {
        // TAKE
        Kernel.system.run(() => {
            if (!viewer.isValid || !target.isValid) return
            const viewerInv = viewer.getComponent(Kernel.EntityComponentTypes.Inventory)?.container
            if (!viewerInv) return
            
            const leftover = viewerInv.addItem(item)
            if (leftover) {
                viewer.sendMessage(Lang.ERROR + "Inventory full! Could not take all items.")
                return
            }

            if (type === "armor") {
                const targetEquip = target.getComponent(Kernel.EntityComponentTypes.Equippable)
                if (targetEquip) targetEquip.setEquipment(slot, undefined)
            } else {
                const targetInv = target.getComponent(Kernel.EntityComponentTypes.Inventory)?.container
                if (targetInv) targetInv.setItem(slot, undefined)
            }
            
            viewer.sendMessage(Lang.SUCCESS + `Taken ${item.amount}x ${item.typeId} from ${target.name}.`)
        })
    } else if (res.selection === 1) {
        // PURGE
        Kernel.system.run(() => {
            if (!target.isValid) return
            if (type === "armor") {
                const targetEquip = target.getComponent(Kernel.EntityComponentTypes.Equippable)
                if (targetEquip) targetEquip.setEquipment(slot, undefined)
            } else {
                const targetInv = target.getComponent(Kernel.EntityComponentTypes.Inventory)?.container
                if (targetInv) targetInv.setItem(slot, undefined)
            }
            viewer.sendMessage(Lang.SUCCESS + `Purged ${item.typeId} from ${target.name}.`)
        })
    }
}

async function showGiveMenu(viewer, target) {
    const viewerInv = viewer.getComponent(Kernel.EntityComponentTypes.Inventory)?.container
    if (!viewerInv) return

    const form = new Kernel.ActionFormData()
        .title("\u00A76\u00A7lSelect Asset to Give")
        .body(`\u00A77Transferring to \u00A7e${target.name}\u00A77.`)

    const items = []
    for (let i = 0; i < viewerInv.size; i++) {
        const item = viewerInv.getItem(i)
        if (item) items.push({ item, slot: i })
    }

    if (items.length === 0) {
        viewer.sendMessage(Lang.ERROR + "You have no assets to transfer.");
        return
    }

    items.forEach(data => {
        form.button(`\u00A7f${data.item.typeId.replace("minecraft:", "")}\n\u00A77Amount: ${data.item.amount}`, Lang.getTexture(data.item.typeId))
    })

    const res = await UIUtils.showForm(viewer, form)
    if (res.canceled) return

    const selected = items[res.selection]
    Kernel.system.run(() => {
        if (!viewer.isValid || !target.isValid) return
        const targetInv = target.getComponent(Kernel.EntityComponentTypes.Inventory)?.container
        if (!targetInv) return

        const leftover = targetInv.addItem(selected.item)
        if (leftover) {
            viewer.sendMessage(Lang.ERROR + `${target.name}'s inventory is full!`)
            return
        }

        viewerInv.setItem(selected.slot, undefined)
        viewer.sendMessage(Lang.SUCCESS + `Transferred ${selected.item.amount}x ${selected.item.typeId} to ${target.name}.`);
        target.sendMessage(Lang.GOLD + `\u00A7e${viewer.name} \u00A77gave you \u00A7f${selected.item.amount}x ${selected.item.typeId}\u00A77.`);
    })
}

