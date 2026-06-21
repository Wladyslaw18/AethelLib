# ⚜︎ AethelLib Version 1.1.0 Major Update. 26.30 - 6/19/26

---

### ✦ Improved

* **- Overall Core System Stability & Code Polish**
  Enhanced internal state tracking, optimized UI flow logic, and resolved a comprehensive suite of up to 10 codebase bugs and logic flaws across the Lib to ensure a rock-solid dedicated server runtime and a buttery smooth administrative experience.

### ✦ Summary: Fixed

* **- Duplicate UI Element Rendering (ModalFormData)**
  Fixed a critical UI rendering glitch where `ModalFormData` interfaces (such as Economy, System Modules, and Rank Edit menus) rendered their form fields twice (overlapping toggles, text fields, and double submit buttons). The custom `custom_form` override in `server_form.json` was missing the native `$scrolling_content` anchor, causing Bedrock's fallback system to inject elements at the root and natively. Stripped the broken override to enforce a 100% bug-free vanilla layout for these forms.

* **- Invalid Icon Textures in UI Forms**
  Resolved multiple missing and invalid texture icons in the Admin Panel and Rank Settings forms. Replaced the animated `command_block_front` flipbook texture with a static `comparator` to fix stretching bugs, and corrected the non-existent `watch` item path to the vanilla `clock` texture path to eliminate the missing pink-and-black checkerboard bug for the Cooldowns & Limits menu.

* **- Ghost UI / HUD Disappearance Bug**
  Patched a severe issue where the custom `aero_glass_panel` implementation caused a silent JSON exception in the resource pack, which resulted in the player's entire HUD permanently disappearing without actually opening the form. Restored proper vanilla base panels to prevent the engine from swallowing the screen state.
