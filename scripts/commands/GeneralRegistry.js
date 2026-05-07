import { CalculateCommand } from "./general/CalculateCommand.js"
import { HelpCommand } from "./general/HelpCommand.js"
import { TPSCommand } from "./general/TPSCommand.js"
import { PlayerListCommand } from "./general/PlayerListCommand.js"
import { MessageCommand, ReplyCommand } from "./general/MessageCommand.js"
import { InfoCommand } from "./general/InfoCommand.js"
import { ReportCommand } from "./general/ReportCommand.js"
import { CreditCommand } from "./general/CreditCommand.js"
import { WhoisCommand } from "./general/WhoisCommand.js"
import { MenuCommand } from "./general/MenuCommand.js"
import { BlockCommand } from "./tpa/BlockCommand.js"
import { ColorCommand } from "./social/ColorCommand.js"
import { RankCommand } from "./social/ranks/RankCommand.js"

/*
 * General Registry
 * ----------------------------------------------------------------------------
 * Registers all public utility and social commands.
 */
export const GeneralRegistry = {
    register(Registry) {
        // Utility
        Registry.register("help", HelpCommand)
        Registry.register("tps", TPSCommand)
        Registry.register("playerlist", PlayerListCommand)
        Registry.register("msg", MessageCommand)
        Registry.register("tell", MessageCommand)
        Registry.register("w", MessageCommand)
        Registry.register("reply", ReplyCommand)
        Registry.register("r", ReplyCommand)
        Registry.register("calculate", CalculateCommand)
        Registry.register("calc", CalculateCommand)
        Registry.register("info", InfoCommand)
        Registry.register("report", ReportCommand)
        Registry.register("credit", CreditCommand)
        Registry.register("whois", WhoisCommand)
        Registry.register("inspect", WhoisCommand)
        Registry.register("menu", MenuCommand)
        Registry.register("gui", MenuCommand)

        // Social
        Registry.register("block", BlockCommand)
        Registry.register("color", ColorCommand)
        Registry.register("rank", RankCommand)
    }
}
