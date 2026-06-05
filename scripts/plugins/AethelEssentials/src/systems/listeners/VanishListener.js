import { VanishStore } from "../stores/VanishStore.js";
import { SocialSpyStore } from "../stores/SocialSpyStore.js";
import { NicknameStore } from "../stores/NicknameStore.js";

export const VanishListener = {
    _context: null,

    init(context) {
        this._context = context;
        
        // Re-apply vanish when a player spawns (joins or respawns)
        this._context.world.afterEvents.playerSpawn.subscribe(event => {
            const player = event.player;
            if (VanishStore.isVanished(player.id)) {
                // Initial spawn event fires very early, defer application slightly
                this._context.system.runTimeout(() => {
                    if (player.isValid) {
                        try { player.runCommand("effect @s invisibility 99999 1 true"); } catch (e) {}
                        player.sendMessage("§8[§7Vanish§8] §fYou are still vanished.");
                    }
                }, 10);
            }

            // Also re-apply nickname here since nameTag resets on respawn
            const nick = NicknameStore.getNickname(player.id);
            if (nick) {
                this._context.system.runTimeout(() => {
                    if (player.isValid) {
                        player.nameTag = nick;
                    }
                }, 10);
            }
        });

        // Social Spy - PM interception hook
        // Assuming PM commands use /ae:msg or similar, the easiest way to intercept
        // without modifying the core command is to listen to command execution or chatSend.
        // For general chat interception if they use chat for PMs (like "-msg"):
        this._context.world.beforeEvents.chatSend.subscribe(event => {
            const msg = event.message.trim();
            const prefixes = ["/", "-", "!"];
            let prefix = null;
            for (const p of prefixes) {
                if (msg.startsWith(p)) {
                    prefix = p;
                    break;
                }
            }
            if (!prefix) return;

            const cmdLine = msg.slice(prefix.length).trim();
            const firstSpace = cmdLine.indexOf(" ");
            const cmdPart = firstSpace === -1 ? cmdLine : cmdLine.slice(0, firstSpace);
            
            const cleanCmd = cmdPart.toLowerCase().replace(/^[a-z0-9_]+:/, "");
            
            const pmCommands = ["msg", "tell", "w", "message", "reply", "r"];
            if (pmCommands.includes(cleanCmd)) {
                this.broadcastSpy(event.sender, msg);
            }
        });

        // Real command execution interception (if available in Kernel or via CommandManager hook)
        // Since we don't have a direct beforeCommand hook in 2.8.0 index.d.ts standard,
        // we'll rely on the assumption that if there's a PM system, it should emit an event.
        // For now, we'll just log that SocialSpy is active.

        context.log("[VanishListener] Subscribed to world events.");
    },

    broadcastSpy(sender, message) {
        if (!this._context) return;
        
        const spies = SocialSpyStore.getSpies();
        if (spies.length === 0) return;

        this._context.system.run(() => {
            const players = this._context.world.getAllPlayers();
            for (const spyId of spies) {
                if (spyId === sender.id) continue; // Don't send to self
                const spyPlayer = players.find(p => p.id === spyId);
                if (spyPlayer) {
                    spyPlayer.sendMessage(`§8[§cSpy§8] §7${sender.name}: §f${message}`);
                }
            }
        });
    }
};
