import { Kernel } from "../core/Kernel.js";
import { UIUtils } from "./UIUtils.js";

/**
 * A declarative Form Builder that automatically maps ModalFormData
 * inputs back to object properties, stripping out huge amounts of
 * boilerplate UI logic.
 */
export class FormBuilder {
    constructor(title) {
        this.title = title;
        this.fields = [];
    }

    /**
     * Adds a text input field to the form.
     * @param {string} label 
     * @param {string} placeholder 
     * @param {string} propName Property key to bind to
     * @param {any} [defaultValue] Fallback default value if property is missing
     * @param {function(string): any} [transform] Optional value converter (e.g., Number)
     * @returns {FormBuilder}
     */
    addTextField(label, placeholder, propName, defaultValue = "", transform = null) {
        this.fields.push({ type: "textField", label, placeholder, propName, defaultValue, transform });
        return this;
    }

    /**
     * Adds a toggle switch to the form.
     * @param {string} label 
     * @param {string} propName Property key to bind to
     * @param {boolean} [defaultValue] 
     * @returns {FormBuilder}
     */
    addToggle(label, propName, defaultValue = false) {
        this.fields.push({ type: "toggle", label, propName, defaultValue });
        return this;
    }

    /**
     * Adds a dropdown selector to the form.
     * @param {string} label 
     * @param {string[]} options Array of string options
     * @param {string} propName Property key to bind to
     * @param {number} [defaultValueIndex] 
     * @returns {FormBuilder}
     */
    addDropdown(label, options, propName, defaultValueIndex = 0) {
        this.fields.push({ type: "dropdown", label, options, propName, defaultValueIndex });
        return this;
    }

    /**
     * Adds a generic callback mapping for dropdowns where the value isn't 
     * simply an index or needs custom logic.
     * @param {string} label 
     * @param {string[]} options Array of string options
     * @param {number} defaultIndex Index to start at
     * @param {function(number): void} applyCallback Callback when form is saved
     * @returns {FormBuilder}
     */
    addDropdownAction(label, options, defaultIndex, applyCallback) {
        this.fields.push({ type: "dropdown_action", label, options, defaultIndex, applyCallback });
        return this;
    }

    /**
     * Adds a custom text input that just triggers a callback instead of mapping to a property.
     * @param {string} label 
     * @param {string} placeholder 
     * @param {string} defaultText 
     * @param {function(string): void} applyCallback 
     * @returns {FormBuilder}
     */
    addTextAction(label, placeholder, defaultText, applyCallback) {
        this.fields.push({ type: "text_action", label, placeholder, defaultText, applyCallback });
        return this;
    }

    /**
     * Shows the form to the player and automatically applies bindings.
     * @param {import("@minecraft/server").Player} player 
     * @param {Object} targetObject The object to mutate with results
     * @param {Function} [backCallback] Callback if canceled or completed
     * @param {Function} [onSave] Additional callback after saving
     * @returns {Promise<boolean>} True if saved, false if canceled
     */
    async showAndApply(player, targetObject, backCallback = null, onSave = null) {
        const buildForm = () => {
            const form = new Kernel.ModalFormData().title(this.title);

            for (const field of this.fields) {
                let val;
                if (field.propName) {
                    val = targetObject[field.propName];
                    if (val === undefined || val === null) val = field.defaultValue;
                }

                switch (field.type) {
                    case "textField":
                        form.textField(field.label, field.placeholder, String(val));
                        break;
                    case "text_action":
                        form.textField(field.label, field.placeholder, String(field.defaultText));
                        break;
                    case "toggle":
                        form.toggle(field.label, !!val);
                        break;
                    case "dropdown":
                        form.dropdown(field.label, field.options, val !== undefined ? Number(val) : field.defaultValueIndex);
                        break;
                    case "dropdown_action":
                        form.dropdown(field.label, field.options, field.defaultIndex);
                        break;
                }
            }
            return form;
        };

        const res = await UIUtils.showForm(player, buildForm);
        if (res.canceled) {
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return false;
        }

        // Apply results back to target
        res.formValues.forEach((val, i) => {
            const field = this.fields[i];
            
            if (field.type === "dropdown_action" || field.type === "text_action") {
                if (field.applyCallback) field.applyCallback(val);
                return;
            }

            if (!field.propName) return;

            if (field.type === "textField") {
                if (field.transform) {
                    targetObject[field.propName] = field.transform(val);
                } else if (typeof field.defaultValue === "number") {
                    targetObject[field.propName] = Number(val) || 0;
                } else {
                    targetObject[field.propName] = val;
                }
            } else {
                targetObject[field.propName] = val;
            }
        });

        if (onSave) {
            onSave(targetObject);
        }

        if (backCallback) {
            Kernel.system.runTimeout(backCallback, 5);
        }
        return true;
    }
}
