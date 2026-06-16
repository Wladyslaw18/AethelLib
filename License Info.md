# ⚜&#xFE0E; AethelLib

⚖︎ THE LICENSE SITUATION (Read This Or Get Burned)

    "Legal stuff? At 3am? Yeah, I went there."

AethelLib uses Dual Licensing. Yes, that's a real thing. Yes, it means you get to choose your own adventure. Dual Licensing Means:

Two licenses.  One choice. Your call.
You want...	Pick this
Free + open source + don't care about sharing core changes	AGPL
Proprietary core changes + keep your code secret	ACL (paid)

 ACL is ONLY if you want to modify core WITHOUT sharing.
 AGPL with a linking exception for plugins. Touch ONE core file? Congrats, your ENTIRE project is now AGPL. Read ACL for commercial terms.
 WHAT YOU GET

    Modify core files privately — yeah go wild
    Full IP protection — your code stays yours
    Anti-cloning covenant — don't copy us, we don't copy you

⚠︎ THE FINE PRINT

    Read ACL.md for complete commercial terms.

 WHICH ONE AM I?

Scenario 1: "plugin for my friend's server" → AGPL. Free forever. Share if you modify core.

Scenario 2: "selling a plugin" → AGPL. Free forever. Don't touch core files.

Scenario 3: "fork AethelLib and sell the whole thing as Proprietary" → NOPE. Need ACL. Read ACL.md for terms.

Scenario 4: "running servers with custom mods commercially" → ACL required after 40 days. Read ACL.md.

Scenario 5: Filthy Rich Corp? → Custom agreement. Email us.
 THE ACTUAL RULES (READ THIS IT'S IMPORTANT)
 THE BIG ONE 

    Touch ONE file outside the plugin boundary? Your ENTIRE project becomes AGPL. No exceptions. No "but I only changed one line." No. The WHOLE thing. EVERYTHING.

This is NOT a per-file license. This is a per-project license.
Code

Plugins/     ←   Safe zone. Proprietary allowed. Do whatever.
ANYTHING ELSE ←   You touched it? WHOLE PROJECT IS NOW AGPL.

The Specifics:
What you do	What happens
Only touch Plugins/ folder	  Proprietary allowed. Keep your code.
Touch ANY file outside Plugins/	  WHOLE project becomes AGPL. Share everything.
Commercial use	Read ACL.md for terms
Reverse-engineering	Read ACL.md
Changes to terms	We can update. Read ACL.md
  REFERENCES (GO READ THESE)

    AGPL v3.0 — the actual license
    ACL.md ← READ THIS FOR COMMERCIAL TERMS
    Plugin Protocol Docs — how to stay in the safe zone

VISUAL RULE (BECAUSE WE'RE NICE)
Code

Your Cool Project/
│
├── Plugins/              ← YOUR SAFE ZONE
│   ├── MyPlugin/         ← proprietary allowed
│   └── AnotherOne/       ← keep your secrets here
│
├── core/                 ←   CORE. Touch it? WHOLE PROJECT = AGPL
├── scripts/              ←   CORE. Touch it? WHOLE PROJECT = AGPL
└── literally_anything_else/ ←   CORE. Touch it? WHOLE PROJECT = AGPL

One file. One line. One typo fix. You touch ANYTHING outside Plugins/?

  YOUR ENTIRE PROJECT IS NOW AGPL. THE WHOLE THING. EVERY LINE. 💀

  STAY IN THE SAFE ZONE

If you want to keep your code proprietary:

    Only create files in scripts/plugins/
    Never import directly from scripts/core/Kernel.js (use Kernel.get() instead)
    Never modify files outside scripts/plugins/
    If you need core changes proprietary, you can choose ACL license
    When in doubt, ask yourself: "Am I touching scripts/plugins/ only?"

If you answered NO to any of these → Your project is AGPL. No exceptions.
 QUICK SUMMARY

    Plugins folder = safe. Do crime (legally).
    Anything else = touch it = whole project is AGPL.
    Commercial = read ACL.md for terms.
    Questions? Read the damn docs.

— Wladyslaw18, 3am LARPing as a lawyer
