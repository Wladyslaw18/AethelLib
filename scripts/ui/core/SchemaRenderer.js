import { FormBuilder } from "../FormBuilder.js";

/**
 * Parses a declarative JSON UI schema and builds/renders it.
 */
export class SchemaRenderer {
    /**
     * Renders a schema form and automatically maps properties back to the target.
     * @param {import("@minecraft/server").Player} player 
     * @param {Object} schema 
     * @param {Object} targetObj 
     * @param {Function} [backCallback] 
     * @param {Function} [onSave] 
     */
    static async render(player, schema, targetObj, backCallback = null, onSave = null) {
        const builder = new FormBuilder(schema.title);
        
        for (const field of schema.fields) {
            switch (field.type) {
                case "textField":
                    builder.addTextField(field.label, field.placeholder || "", field.prop, field.default, field.transform);
                    break;
                case "toggle":
                    builder.addToggle(field.label, field.prop, field.default);
                    break;
                case "dropdown":
                    builder.addDropdown(field.label, field.options, field.prop, field.defaultIndex);
                    break;
                case "dropdown_action":
                    builder.addDropdownAction(field.label, field.options, field.defaultIndex, field.action);
                    break;
                case "text_action":
                    builder.addTextAction(field.label, field.placeholder, field.default, field.action);
                    break;
            }
        }

        return await builder.showAndApply(player, targetObj, backCallback, onSave);
    }
}
