# 🌱 GASLight: NGO CRM (Google Apps Script + TypeScript)

A clean, maintainable, production-ready Customer Relationship Management (CRM) template designed for Non-Governmental Organizations (NGOs) and charities, running directly inside **Google Sheets** powered by **Google Apps Script (GAS)** and **TypeScript**.

---

## 📖 Table of Contents
1. [Why This Architecture?](#-why-this-architecture)
2. [Project Architecture & Separation of Concerns](#-project-architecture--separation-of-concerns)
3. [Required Tools & Prerequisites (macOS)](#-required-tools--prerequisites-macos)
4. [Step-by-Step Installation Guide](#-step-by-step-installation-guide)
5. [Connecting to Google Sheets with Clasp](#-connecting-to-google-sheets-with-clasp)
6. [Version Control & Daily Git Workflow (macOS)](#-version-control--daily-git-workflow-macos)
7. [How It Works in Google Sheets](#-how-it-works-in-google-sheets)
8. [Avoiding Single-User Dependency (NGO Continuity)](#-avoiding-single-user-dependency-ngo-continuity)
9. [Future Improvements: Automated CI/CD Pipeline](#-future-improvements-automated-cicd-pipeline)
10. [Troubleshooting & Common Questions](#-troubleshooting--common-questions)

---

## 🎯 Why This Architecture?

Most Google Apps Script tutorials advise writing all code directly inside the browser editor in a single file (`Code.gs`). While easy for small tasks, this approach causes severe problems when projects grow:

* **No Version Control:** Changes cannot be tracked, reviewed, or safely rolled back with Git.
* **No Type Safety:** Typos and incorrect data shapes are only discovered when users encounter runtime crashes.
* **"Spaghetti Code":** Mixing sheet formatting, database rows, business logic, and UI popups into one file makes maintenance painful.
* **Race Conditions:** If two staff members log a donation simultaneously, spreadsheet rows can overwrite each other.

This project introduces **semi-professional software engineering practices** using a modular architecture, TypeScript type checking, and `@google/clasp` for local development.

---

## 🏗 Project Architecture & Separation of Concerns

The codebase is split into distinct layers so each file has a single responsibility:

```text
GASLight/
├── .clasp.json              # Connects your local folder to your cloud Google Apps Script
├── .claspignore             # Prevents node_modules & local configs from uploading to Sheets
├── package.json             # NPM dependencies (TypeScript, Clasp, GAS types)
├── tsconfig.json            # TypeScript compiler settings for Apps Script
├── README.md
└── src/
    ├── appsscript.json      # Google Apps Script manifest (permissions & runtime)
    ├── models/
    │   └── Donor.ts         # Data Model: Interfaces and types defining a "Donor"
    ├── data/
    │   └── DonorRepository.ts # Data Access (DAO): Direct Google Sheets reads/writes + LockService
    ├── services/
    │   └── DonorService.ts  # Business Logic: Validations, ID generation, statistics
    └── controllers/
        └── UIController.ts  # UI Layer: onOpen menu, dialogs, and user prompts
```

### 1. Data Model (`src/models/Donor.ts`)
Defines the structure ("contract") of our data. It ensures every donor has an ID, name, email, donation total, and status.

### 2. Data Access Layer / Repository (`src/data/DonorRepository.ts`)
Isolates all interactions with `SpreadsheetApp`. 
* Uses **`LockService`**: Prevents concurrent write collisions when multiple users or scripts update the sheet at the same time.
* Formats column headers, widths, and number formats automatically.

### 3. Business Logic Service (`src/services/DonorService.ts`)
Encapsulates all business rules independent of the user interface:
* Validates emails and required fields.
* Prevents duplicate donor registrations.
* Generates human-readable IDs (`DON-1001`, `DON-1002`).
* Computes metrics (total funds raised, active donors, average donation).

### 4. UI Controller (`src/controllers/UIController.ts`)
Acts as the entry point for the spreadsheet user:
* Creates a custom top menu in Google Sheets: `🌱 NGO CRM`.
* Prompts users for input via dialog boxes and displays success/error alerts.

---

## 🧰 Required Tools & Prerequisites (macOS)

Before starting, prepare your Mac development environment. Open **Terminal** (press `Cmd + Space`, type `Terminal`, and press `Enter`):

### 1. Apple Command Line Tools & Homebrew
macOS needs Apple's command-line developer utilities:
* In Terminal, run:
  ```zsh
  xcode-select --install
  ```
  *(A prompt will appear; click **Install** and accept the license).*
* **(Recommended) Install Homebrew** (the macOS package manager) from [brew.sh](https://brew.sh):
  ```zsh
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```

### 2. Git
Git tracks every change made to your project:
* If Homebrew is installed:
  ```zsh
  brew install git
  ```
  *(Otherwise, Git is automatically included when you install Xcode Command Line Tools).*
* Verify installation:
  ```zsh
  git --version
  ```

### 3. Node.js (v18 or higher) & npm
Node.js runs our TypeScript compiler and Clasp deployment tool:
* Install via Homebrew:
  ```zsh
  brew install node
  ```
* Or download the macOS installer `.pkg` directly from [nodejs.org](https://nodejs.org/).
* Verify installation:
  ```zsh
  node -v
  npm -v
  ```

### 4. Visual Studio Code
A lightweight code editor with excellent TypeScript and Git support:
* Install via Homebrew:
  ```zsh
  brew install --cask visual-studio-code
  ```
* Or download the Mac `.zip` from [code.visualstudio.com](https://code.visualstudio.com/).
* **Tip:** In VS Code, press `Cmd + Shift + P`, type `Shell Command: Install 'code' command in PATH`, and press `Enter`. This allows you to type `code .` in Terminal to open any project instantly.

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Clone or Open the Repository
```bash
git clone <your-repo-url>
cd GASLight
```

### Step 2: Install Dependencies
Install TypeScript, `@google/clasp`, and Apps Script types locally:
```bash
npm install
```

### Step 3: Enable the Google Apps Script API
Google requires you to turn on API access once per Google account:
1. Open your browser and visit: **[https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)**
2. Toggle **Google Apps Script API** to **ON**.

---

## 🔗 Connecting to Google Sheets with Clasp

`clasp` (Command Line Apps Script Projects) is Google's official tool to push code from your computer into Google Sheets.

### 1. Log into your Google Account
In your terminal, execute:
```bash
npx clasp login
```
A browser window will open asking you to sign in and authorize clasp.

### 2. Connect to a Google Sheet

#### Option A: Create a brand new Google Sheet from the command line
```bash
npx clasp create --title "NGO Donor CRM" --type sheets --rootDir ./src
```
This automatically populates the `.clasp.json` file with your new Script ID.

#### Option B: Bind to an existing Google Sheet
1. Open your Google Sheet in a browser.
2. Go to **Extensions > Apps Script**.
3. In the Apps Script editor, click the **⚙️ Project Settings** (gear icon) on the left.
4. Copy the **Script ID**.
5. Paste it into `.clasp.json`:
   ```json
   {
     "scriptId": "PASTE_YOUR_SCRIPT_ID_HERE",
     "rootDir": "./src"
   }
   ```

---

## 🔄 Version Control & Daily Git Workflow (macOS)

### 💡 What is a Version Control System (VCS)?

A **Version Control System (VCS)** like **Git** is an immutable, collaborative timeline for your software project. Think of it as a flight data recorder combined with an "infinite undo" tree:

* **Traditional Google Apps Script (No VCS):** Editing directly inside the browser editor (`Code.gs`) is dangerous. There are no branches, no pull requests, no automated checks, and any contributor can accidentally overwrite working production code. If a bug is introduced, pinpointing *who* changed *what* and *why* is nearly impossible.
* **Modern Workflow with Git (This Template):**
  1. **History as Documentation:** Every change is bundled into a "commit" with an author, timestamp, and human-readable explanation.
  2. **Safe Branching:** You can experiment freely in a separate branch without risking the working spreadsheet.
  3. **Peer Review (Pull Requests):** Colleagues review changes before they ever touch production.
  4. **Instant Rollback:** If a bug slips through, `git revert` safely rolls back to the previous stable version in seconds.

---

### 🌐 What is GitHub? (And the Free GitHub for Nonprofits Program)

While **Git** is the local command-line tool running on your Mac that tracks file history, **GitHub** is the cloud platform that hosts your Git repositories online:

* **Central Cloud Backup:** Instead of code living only on one developer's Mac, GitHub acts as your organization's central source of truth.
* **Collaboration & Review:** Teammates use GitHub to open Pull Requests, review line-by-line changes, discuss code improvements, and track project tasks with Issues and Projects.
* **Automation (CI/CD):** Through GitHub Actions, you can run automatic typechecks and tests whenever code is pushed.

#### 🎁 Free GitHub Team Plan for Nonprofits
Many charities and NGOs don't realize that GitHub provides enterprise-grade tools completely free of charge:
* **The Program:** Through **GitHub Social Impact**, registered non-profit and non-governmental organizations (501(c)(3) in the US or registered charity/NGO equivalents worldwide) can apply for a **free GitHub Team plan**.
* **What's Included:** Unlimited private repositories, unlimited team members, 3,000 automated CI/CD build minutes per month, and advanced code collaboration tools without commercial subscription fees.
* **How to Apply:** Visit [socialimpact.github.com](https://socialimpact.github.com/) or verify your organization through your regional TechSoup partner (e.g., TechSoup Global).

---

### 🛠 Daily Development Cycle: A Day in the Life on macOS

Here is how Git ties directly into your day-to-day development workflow using macOS Terminal (or iTerm2) and Visual Studio Code:

#### Step 1: Start Fresh (Pull Latest Code)
Before writing any new feature or bug fix, switch to `main` and download the latest changes submitted by teammates:
```zsh
# Ensure you are on the main branch and up to date
git switch main
git pull origin main
```

#### Step 2: Create an Isolated Feature Branch
Never make code changes directly on `main`. Create and switch to a descriptive branch:
```zsh
# Syntax: git switch -c <type>/<description>
git switch -c feature/donor-tags
```

#### Step 3: Develop, Typecheck, and Test
1. Open the project in VS Code:
   ```zsh
   code .
   ```
2. Make your edits in `src/` (e.g. updating `Donor.ts` and `DonorRepository.ts`). Save with `Cmd + S`.
3. In Terminal, run typechecking to ensure TypeScript validates your types:
   ```zsh
   npm run typecheck
   ```
4. Push your code to your development Google Sheet to test menu interactions:
   ```zsh
   npm run push
   ```
   *(Clasp transpiles TypeScript into Google Apps Script and deploys it instantly).*

#### Step 4: Inspect Changes and Stage Files
Review what you changed before committing:
```zsh
# Check which files have been modified
git status

# Review line-by-line additions and deletions
git diff
```

Stage only the files you intentionally modified:
```zsh
git add src/models/Donor.ts src/data/DonorRepository.ts
```

#### Step 5: Save a Meaningful Commit
Save a snapshot to your local Git history. Write a clear, concise message describing the **why** and **what**:
```zsh
git commit -m "feat: add donor tags support to data model and repository"
```

#### Step 6: Push Branch to GitHub & Create a Pull Request (PR)
Upload your branch to the NGO's remote GitHub repository:
```zsh
# The -u flag links your local branch to the remote branch
git push -u origin feature/donor-tags
```
* macOS will print a direct link in Terminal. `Cmd + Click` the link to open GitHub in Safari/Chrome.
* Click **Open Pull Request**, describe your changes, and request a code review from a teammate.

#### Step 7: Deploying to Production (After PR Approval)
Once the Pull Request is reviewed and merged on GitHub:
```zsh
# Switch back to main and pull the merged code
git switch main
git pull origin main

# (Optional) Clean up your local feature branch
git branch -d feature/donor-tags

# If linked to the NGO's master production sheet, push the update:
npm run push
```

> 💡 **Future Improvement (CI/CD Pipeline):**
> Deploying manually via `npm run push` is the best starting point for beginners to understand how Clasp works. In the future, this manual step can be replaced by an automated **GitHub Actions CI/CD pipeline** that pushes automatically whenever a PR is merged into `main`. (See [Future Improvements](#-future-improvements-automated-cicd-pipeline) below).

---

### 🍎 Handy macOS Developer Tips
* **Quick Terminal Clear:** Press `Cmd + K` in macOS Terminal or iTerm2 to clear the console output.
* **Stop a Running Process:** Press `Ctrl + C` in Terminal (note: `Ctrl`, not `Cmd`).
* **Hidden macOS Files (`.DS_Store`):** Finder automatically creates hidden `.DS_Store` files to save folder view preferences. These are already safely ignored in this project's `.gitignore`.
* **Line Endings:** macOS uses Unix standard line endings (`LF`), which aligns perfectly with Google Apps Script and Git standards.

---

## 📊 How It Works in Google Sheets

1. Open your Google Sheet in your web browser.
2. Refresh the page. You will see a new menu item appear in the top toolbar: **`🌱 NGO CRM`**.
3. Click **`🌱 NGO CRM > 🚀 Initialize CRM Sheet`**.
   * *Note on First Run:* Google will show an "Authorization Required" popup. Click **Continue**, select your account, click **Advanced**, and then **Go to Untitled project (unsafe)**. This is normal for custom Apps Script projects.
4. The script will automatically create a formatted **Donors** tab with headers and starter donor data!
5. Try the other menu actions:
   * **➕ Add New Donor:** Interactive prompts to safely register a new donor with duplicate prevention.
   * **💰 Record Donation:** Add funds to an existing donor by their ID or email.
   * **📊 Show Donor Summary:** Displays an instant modal showing total funds raised, total donors, and average donation size.

---

## 👥 Avoiding Single-User Dependency (NGO Continuity)

A critical operational risk for NGOs occurs when internal tooling stops functioning after a staff developer or volunteer leaves the organization. Because Google Apps Script operates within the Google Workspace identity ecosystem, follow these architectural safeguards to ensure the CRM remains fully functional and maintainable indefinitely:

### 1. Store the Google Sheet in a Google Workspace Shared Drive
* **The Risk:** If the master Google Sheet is stored in an individual employee's "My Drive", deleting or de-provisioning that employee's Google Workspace account will send the Sheet (and its container-bound script) to the trash.
* **The Solution:** Store the master Google Sheet in a **Google Workspace Shared Drive** (formerly *Team Drive*). In a Shared Drive, files belong to the organization rather than an individual. Even if the creator leaves, all files, permissions, and bound scripts remain completely untouched.

### 2. Maintain a Dedicated Functional Admin Account
* **The Risk:** Developing or deploying using personal employee accounts (`john.doe@ngo.org`) risks sudden permission loss upon departure.
* **The Solution:** Create a shared functional Google account (e.g., `tech@yourngo.org`, `crm-admin@yourngo.org`, or `it@yourngo.org`) with credentials stored in your NGO's secure password manager (e.g., Bitwarden, 1Password):
  - Ensure this account has **Manager** access to the Shared Drive.
  - Use this account when setting up OAuth consent screens, GCP projects, or sensitive permissions.

### 3. Beware of Installable Triggers (The Silent Departure Trap)
* **Simple Triggers (`onOpen`, `onEdit`):** These run under the identity of whoever opens or edits the spreadsheet at that moment. The code in `src/controllers/UIController.ts` uses `onOpen()`, meaning it **never breaks when the developer leaves**.
* **Installable Triggers (Time-driven / Scheduled automations):** If your NGO later adds automated triggers (e.g., daily midnight donor digest emails, hourly syncing):
  - In Apps Script, an installable trigger executes under the authority of the **individual user account who registered it**.
  - If that developer's account is suspended or deleted, the scheduled trigger immediately halts with authorization errors.
  - **Rule:** Always create installable triggers while logged in as the functional organizational admin account (`tech@yourngo.org`).

### 4. Maintain Centralized Source Control & Frictionless Handover
* **Host in an NGO Organization Account:** Never host the primary repository under a developer's personal GitHub profile. Create an organization on GitHub (e.g., `github.com/your-ngo`) and apply for the free **GitHub for Nonprofits** program.
* **Frictionless Developer Transition:**
  1. A new developer or volunteer only needs **Edit** permissions on the Google Sheet and an invitation to the NGO's GitHub organization/repository.
  2. The new developer runs `npx clasp login` using their own Google account.
  3. They configure `.clasp.json` with the Script ID from the Sheet (`Extensions > Apps Script > Project Settings > Script ID`).
  4. Running `npm run push` immediately deploys updates without needing to transfer script ownership or rebuild the tool.

---

## 🔮 Future Improvements: Automated CI/CD Pipeline

Currently, deploying code to Google Sheets requires a developer to manually run `npm run push` on their Mac. For beginners and small projects, this manual workflow is ideal because it is completely transparent, easy to troubleshoot, and requires no cloud secret management.

However, as an NGO's development team matures, this step can be automated using a **CI/CD (Continuous Integration & Continuous Deployment) pipeline** powered by **GitHub Actions**:

### How an Automated Pipeline Works Conceptually:
1. **Automated Verification (Continuous Integration on Pull Request):**
   * When a developer opens a Pull Request to propose changes, a GitHub cloud runner spins up automatically.
   * The runner executes `npm run typecheck`. If any syntax errors or type mismatches exist, GitHub blocks the merge until they are fixed.
2. **Automated Deployment (Continuous Deployment on Merge):**
   * When a Pull Request is approved and merged into `main`, GitHub Actions automatically triggers a deployment job.
   * Using an encrypted Google Apps Script authentication token (stored in **GitHub Encrypted Secrets**), the pipeline runs `clasp push -f` in the cloud.
   * The NGO's production Google Sheet is updated automatically without any developer needing to run manual deploy commands from their personal machine.

### Why We Defer This for Beginners:
Automating Google Apps Script deployments requires generating and storing headless OAuth refresh tokens (or setting up a Google Cloud Service Account with domain-wide delegation). For volunteers or new developers, this added complexity can obscure the fundamentals.

Starting with local `npx clasp login` and `npm run push` ensures you master TypeScript, code architecture, and Git collaboration first. When your organization is ready, adopting GitHub Actions is a natural, seamless upgrade!

---

## ❓ Troubleshooting & Common Questions

### Q: Why do I get `User has not enabled the Apps Script API`?
Visit [script.google.com/home/usersettings](https://script.google.com/home/usersettings) and toggle the Google Apps Script API to **ON**. Then rerun `npx clasp login`.

### Q: Why isn't the `🌱 NGO CRM` menu showing up?
1. Make sure you ran `npm run push` without errors.
2. Reload your spreadsheet tab. The `onOpen()` trigger only runs when the spreadsheet is opened or refreshed.
3. Check **Extensions > Apps Script** to verify that your code files appear in the left-hand files panel.

### Q: Can I add new fields to a donor?
Yes! Follow this clean flow:
1. Update `src/models/Donor.ts` to add the field to the `Donor` interface.
2. Update `src/data/DonorRepository.ts` to include the new column header and row mapping.
3. Run `npm run typecheck` to let TypeScript ensure no errors were introduced.
4. Run `npm run push` to deploy the update.
