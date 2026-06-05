# ⚜︎ AethelLib Command & Logic Fixes
Update 1.1.0 - April 20, 2026

---

### ✧ Added (Features)

* **- Split /editrank into Small Commands**
  Nuked the big /editrank command because it was too long for Minecraft to handle. Replaced with /rperm, /rorder, /rname, /rcolor, and /rinfo. Faster and zero syntax errors.

* **- Fixed Slash Autocomplete**
  Rank and Permission suggestions now actually show up in the slash bar when typing admin commands.

* **- Better Gamemode Shortcuts**
  /gms, /gmc, /gmsp, and /gma now work on yourself if you don't provide a player name. 

* **- Admin Essentials**
  Added /aheal, /afeed, /afly, /agod, and /aclear for quick player management.

---

### ✧ Fixed (Bugs)

* **- Fixed /calc Math**
  Fixed operators (+, *, /). Fixed bug where 2+2 became "22" instead of 4. Supports symbols and brackets now.

* **- Rank Hierarchy Floor**
  Set 'member' rank priority to -999. It stays at the bottom and acts as the base for all new players.

* **- Startup Stability**
  Fixed server crashing on boot when trying to load the rank database too early.
