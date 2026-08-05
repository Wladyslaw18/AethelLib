/**
 * Early-boot bootstrap logic
 * Registers core registries and managers without pulling in heavy system dependencies.
 * This prevents circular dependency loops during Phase 0.
 */

import { ModalFormData } from "@minecraft/server-ui"
import { System, World } from "@minecraft/server"
import { Kernel } from "../core/Kernel.js"
import { CommandRegistry } from "../commands/base/CommandRegistry.js"
import { CommandManager } from "../core/commands/CommandManager.js"
import { registerShopEnums } from "../commands/shop/ShopAutocomplete.js"

// Native type conversion fix for latest server-ui versions where textField expects an options object as the 3rd argument
const originalTextField = ModalFormData.prototype.textField;
ModalFormData.prototype.textField = function (label, placeholderText, defaultValue) {
    if (typeof defaultValue === "string" || typeof defaultValue === "number" || typeof defaultValue === "boolean") {
        return originalTextField.call(this, label, placeholderText, { defaultValue: String(defaultValue) });
    }
    return originalTextField.call(this, label, placeholderText, defaultValue);
};

// Native type conversion fix for latest server-ui versions where toggle expects options object as the 2nd argument
const originalToggle = ModalFormData.prototype.toggle;
ModalFormData.prototype.toggle = function (label, defaultValue) {
    if (typeof defaultValue === "boolean") {
        return originalToggle.call(this, label, { defaultValue });
    }
    return originalToggle.call(this, label, defaultValue);
};

// Native type conversion fix for latest server-ui versions where slider expects options object as the 4th argument
const originalSlider = ModalFormData.prototype.slider;
ModalFormData.prototype.slider = function (label, minimumValue, maximumValue, valueStep, defaultValue) {
    if (typeof valueStep === "number") {
        const options = { valueStep };
        if (typeof defaultValue === "number") {
            options.defaultValue = defaultValue;
        }
        return originalSlider.call(this, label, minimumValue, maximumValue, options);
    }
    return originalSlider.call(this, label, minimumValue, maximumValue, valueStep);
};

// Native type conversion fix for latest server-ui versions where dropdown expects options object as the 3rd argument
const originalDropdown = ModalFormData.prototype.dropdown;
ModalFormData.prototype.dropdown = function (label, options, defaultValueIndex) {
    if (typeof defaultValueIndex === "number") {
        return originalDropdown.call(this, label, options, { defaultValueIndex });
    }
    return originalDropdown.call(this, label, options, defaultValueIndex);
};

// NOTE: System.runInterval/runTimeout are intentionally NOT wrapped -
// no-op forwarding adds a dead call layer on every scheduled callback (hot path).

export function init() {
    // Register registry and manager early to catch startup events
    Kernel.register("commandRegistry", CommandRegistry)
    Kernel.register("commandManager",  CommandManager)
    
    // Initialize CommandManager to subscribe to startup events
    CommandManager.init()
    
    // Register custom shop autocomplete enums before command node bindings
    registerShopEnums()
    
    console.warn(" ");
    console.warn("\u00A7b      __ _____   _   _          _ _     _ _    ");
    console.warn("\u00A7b     / /| ____| | |_| |__   ___| | |   (_) |__ ");
    console.warn("\u00A7b    / / |  _|   | __| '_ \\ / _ \\ | |   | | '_ \\");
    console.warn("\u00A7b   / /__| |___  | |_| | | |  __/ | |___| | |_) |");
    console.warn("\u00A7b  /_/   |_____|  \\__|_| |_|\\___|_|_____|_|_.__/");
    console.warn("\u00A7e      \u00A7l\u2605 1,000 CurseForge Downloads! \u2605");
    console.warn(" ");
    console.warn("[Kernel] Phase 0 Early-Boot Handshake Complete.");
}
