import { PlaceBountyCommand } from "./economy/PlaceBountyCommand.js";
import { BountiesCommand }    from "./economy/BountiesCommand.js";

export const EconomyRegistry = {
    getCommands() {
        return [
            PlaceBountyCommand,
            BountiesCommand
        ];
    }
};
