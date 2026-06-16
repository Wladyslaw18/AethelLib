# Aethelgrad Dev Tools - DOS Edition

> *This folder exists for completeness. And vibes. Mostly vibes.*

---

## 🖥️ WHO ARE YOU?

Let's be real for a second.

You opened a folder called `dos/`.

In **2026**.

For a **Minecraft Bedrock addon**.

---

## Warning Continuing may lead to heart attack

---

### Scenario A — The Corporate IT Guy

Let's talk about you specifically.

You work in IT. You have a badge. You have a desk with three monitors, one of which is exclusively for Microsoft Teams notifications that you never respond to. You've memorized the Group Policy editor. You've said the phrase *"I'll need to escalate a ticket for that"* with a straight face while looking someone dead in the eyes.

And yet.

**AND YET.**

Here you are. Running a Minecraft addon packager. On a work machine.

Let's think about this logically. You can't run PowerShell scripts — your own IT department blocked that. The same department **you work in**. You did this. You locked yourself out. You are the reason this policy exists and also the reason someone had to work around it. You are both the problem and the solution and somehow also the victim. That's a level of chaos not even quantum physics can explain.

But wait — it gets better.

You have Minecraft installed on this machine.

**WHY do you have Minecraft on a corporate machine?**

Did you sneak it in via a USB drive like it's 2009? Did you install it under a folder called `Windows_Defender_Update_v2.exe`? Did you expense it? Did you put it in the ticket system as *"productivity tooling"*? Because if you did, I need you to know that somewhere in your company's finance department, an accountant looked at that line item, chose not to ask questions, and went home early.

You are developing a Minecraft addon on a locked-down corporate workstation, using CMD batch scripts to bypass the PowerShell restrictions that **you yourself** probably enforced on someone else last Tuesday.

This is the most chaotic form of personal growth I have ever witnessed.

We respect it. But we had to say it.

---

### Scenario B — The Nostalgia Speedrunner

You saw `tools/unix/` with its beautiful Python scripts. You saw `tools/` with its fancy PowerShell suite. And something in your brain went:

*"Yes, but have we considered... BATCH FILES?"*

You didn't NEED this folder. Nobody asked for this folder. We built it FOR THE BIT. And you are HERE, reading this README, which means you either:

A) Were genuinely curious what was in here.
B) Searched the repo for `.bat` files on PURPOSE.
C) Somehow navigated here by accident and kept reading anyway.

All three options are equally concerning and we love you for it.

You are the type of person who still defends `GOTO` statements. You have opinions about the Windows XP shutdown sound. You've said *"they don't make 'em like they used to"* about an operating system. You miss when programs came on CDs, not because it was better, but because you could throw the CD at someone if the software didn't work. Accountability through physical media.

---

### Scenario C — The Immortal Sysadmin

Your server has been running since 2007.

Not because it's good — because you are *afraid* of what happens if you restart it. There's a cronjob on there that nobody understands anymore. The guy who wrote it left the company in 2011. His LinkedIn says he's a life coach now. You don't have his number. You will never touch that cronjob.

The server runs Windows Server 2003. You know you should upgrade. Microsoft knows you should upgrade. Your company's insurance policy knows you should upgrade. There is a CVE from 2019 with your server's name on it spiritually. But here's the thing — it hasn't crashed. Not once. In eighteen years. At this point you're not managing a server, you're maintaining a relationship. You have a responsibility to it.

And THIS server, somehow, hosts a Minecraft addon.

Nobody questioned this at the meeting. You presented it as *"infrastructure expansion into the gaming sector."* Finance approved it. Karen from HR asked if she could have an admin account. You said no, Karen.

You are thriving. Inexplicably. We salute you.

---

### Scenario D — You're the Developer Who Added This Folder

Yeah. That's me.

We built this because someone said *"complete the trinity"* — **SPOILER ALERT: No one told me to do it** — and our brain said *"okay but what if we also wrote a roast README at midnight."* There was no requirement. There was no ticket. There was just vibes and a text editor.

The batch scripts work, by the way. We tested them. Because even at maximum chaos we are still professionals.

---

## ✅ WHAT'S ACTUALLY IN HERE

Okay, jokes aside, these scripts genuinely work. Because we're professionals. Unhinged professionals, but still.

### `pack.bat`
Compiles the Behavior and Resource packs into a clean `AethelLib.mcaddon` at your workspace root.
Uses PowerShell under the hood for the zip operations because `.bat` can't zip natively and we're not writing a ZIP implementation in batch script. We have standards. Low ones, but standards.

```cmd
tools\dos\pack.bat
```

### `release.bat`
The full auto-release odometer engine. Bumps the version in `manifest.json`, builds the packs, saves to `releases/`, `backups/`, and the root.

```cmd
tools\dos\release.bat
```

### `deploy.bat`
Syncs packs directly into your local BDS `development_behavior_packs/` and `development_resource_packs/` folders.

```cmd
tools\dos\deploy.bat
```

---

## ⚙️ REQUIREMENTS

- Windows (obviously, you're using `.bat` files)
- CMD or any terminal that can run batch scripts
- PowerShell must be available on the system (it's used internally for zip operations)
- A healthy sense of humor about your own life choices

---

## ꧁ ⚜&#xFE0E; ꧂ SPECIAL ROAST: THE ARCHITECT HIMSELF

### WladyslawKW — Władysław
#### *Architect / CEO / Supreme Leader / Grand Marshal of the Kernel / Landlord / Debt Collector / Director of Boredom-Driven Engineering / Minister of JavaScript That Has No Business Existing / Minister of Unnecessary Cache Systems / Head of the Bureau of Atomic Transactions / Official Oxygen Supplier (subscription required) / Supreme Leader of a Server With No Players / Glorious Founder of a Framework Nobody Asked For / The Guy Who Removed Beds Because Immersion / Please Send Help / Also Coffee / Both*

---

Let's talk about me. The myth. The person who looked at Minecraft Bedrock scripting — a system designed to make simple things — and said:

*"What if I added a Kernel?"*

Nobody asked. The engine didn't ask. Mojang definitely didn't ask. The Kernel was not on the roadmap. There WAS no roadmap. I wrote the roadmap at 2AM. The roadmap also has a plugin system.

---

**"Director of Boredom-Driven Engineering"**

This is the most honest title I have ever given myself. Every single system in this project exists because I was bored. The economy system? Boredom. The DOD plugin architecture? Boredom. The atomic transaction manager? *Extreme boredom.* The cache system nobody asked for? I wasn't even bored for that one — I was procrastinating on something else. There are TWO layers of boredom-driven engineering in this codebase. You are standing on top of them right now. You're welcome.

---

**"Minister of JavaScript That Has No Business Existing"**

I looked at Minecraft Bedrock's scripting API — a beautifully contained, sandboxed environment with clear boundaries — and thought *"yes, but what if I added dependency injection."* In JavaScript. In Minecraft. There is a `Kernel.js` file in this project. It boots. It has phases. It has lifecycle hooks. It manages plugins with dependency graphs. This is a Minecraft addon. Creepers do not care about my dependency graph. They explode regardless of whether the modules resolved correctly. Władysław knew this. Władysław did it anyway.

---

**"Official Oxygen Supplier (subscription required)"**

I put BREATHING behind a paywall in my own server economy. Players need to pay to exist. That's not a game mechanic — that's an ideology. That's a philosophy. Somewhere a political science professor is writing a dissertation about this server right now and they don't even know it's Minecraft. I did not intend this. I am not sorry.

---

**"Supreme Leader of a Server With No Players"**

I built an entire economy system, a bounty hunter plugin, a rank hierarchy, a TPA handshake protocol, a shop UI, a kit system, an NPC framework, a chat filter, and a kernel with a full plugin lifecycle — for a server with no players. This is not a game anymore. This is architecture for architecture's sake. This is engineering as a personality trait. I built a skyscraper and said *"we'll figure out the tenants later."* The tenants are not coming. The building is beautiful though. I know this. Władysław is at peace with this.

---

**"Glorious Founder of a Framework Nobody Asked For"**

The framework works. That's the worst part. It's well-structured, it's documented, it follows rules *I* invented and then enforced on *myself* — the 120-line rule, the Zero-Bypass rule, the DOD-driven architecture. I am my own strictest code reviewer. I have left comments in my own files that read like a disappointed senior engineer reviewing a junior's PR. I am both people. Simultaneously. At all times. Władysław vs Władysław. The war has no end.

---

**"The Guy Who Removed Beds Because Immersion"**

I removed beds.

From Minecraft.

For immersion.

In a game where you punch trees to survive and pigs drop pork chops when you hit them with a sword.

*Immersion.*

Players cannot sleep. The night is permanent. The Phantoms come. The Phantoms are not removed. The Phantoms are apparently immersive. The beds were not. I have a vision. That vision does not include rest — for me OR for my players. Władysław doesn't rest. Why should you?

---

**"Please Send Help / Also Coffee / Both"**

This is the most honest thing in my entire title list. Behind the Kernel. Behind the Bureau of Atomic Transactions. Behind the cache system nobody asked for. Behind the framework nobody asked for — I just need coffee and someone to tell me I'm doing okay.

I'm doing okay.

The framework is impressive.

Please send coffee.

---

*I wrote this roast about myself.  
I approved it.  
I am the We.*

---

## 🏆 FINAL NOTE

If these scripts saved your workflow today, that's incredible.
If you're using them ironically, also incredible.
If you're using them unironically on a machine that still boots with a startup sound from 2001 —

You are built different.

We salute you. 🫡

---

## ✦ HEADLESS COMMAND TESTING

The testing framework allows console-driven command verification.

### 1. Headless Commands
Commands are dispatched using `/scriptevent ae:test_cmd`.

*   **List Warps**: `scriptevent ae:test_cmd listwarp`
*   **Set Warp**: `scriptevent ae:test_cmd setwarp <name>`
*   **Teleport to Warp**: `scriptevent ae:test_cmd warp <name>`
*   **Delete Warp**: `scriptevent ae:test_cmd delwarp <name>`
*   **Calculator**: `scriptevent ae:test_cmd calc <expression>`

### 2. Design Principles
*   **Input Pipe**: Stdin input is forwarded to the bedrock server using standard streams.
*   **Impostor Entity**: The server executes the logic against a virtual client object with full permissions.
*   **Trace Extraction**: Script errors print stack lines to console output.
