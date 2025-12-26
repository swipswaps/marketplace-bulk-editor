---
type: always_apply
description: Workspace-specific guidelines for marketplace-bulk-editor repository, testing protocols, and deployment workflows
---

# Workspace Guidelines

Guidelines for working in the marketplace-bulk-editor workspace.

---

## Workspace Structure

This workspace is the **marketplace-bulk-editor** repository:

- **Repository**: `/home/owner/Documents/694533e8-ac54-8329-bbf9-22069a0d424e/marketplace-bulk-editor`
- **GitHub Pages**: https://swipswaps.github.io/marketplace-bulk-editor/

---

## Pre-Flight Checklist

**Before making any code changes, verify:**

- [ ] Repository identified: `git remote -v`
- [ ] Current directory verified: `pwd`
- [ ] File structure matches expectations: `ls -la | head -10`
- [ ] Dev server location confirmed
- [ ] Testing protocol understood
- [ ] User's explicit constraints noted (e.g., "do not remove features")

**If ANY item is uncertain, STOP and ASK the user.**

---

## Before Making Any Edits

**ALWAYS run these commands first:**

```bash
# 1. Verify current working directory
pwd

# 2. Verify which repository you're in
git remote -v

# 3. Verify file structure matches expectations
ls -la | head -10
```

---

## Testing Requirements

### MANDATORY: Test Before Claiming Success

1. **Local Testing**: ALWAYS test on localhost with Selenium before deploying
2. **Deployment Testing**: ALWAYS test GitHub Pages URL with Selenium after deploying
3. **Console Verification**: ALWAYS capture and review console.log output
4. **Visual Verification**: ALWAYS run Selenium in visible mode (not headless) for debugging

### NEVER

- Deploy without testing locally first
- Claim deployment success without testing the live URL
- Hide console output from the user
- Use headless mode when debugging

---

## Selenium Best Practices

### Use Chrome with CDP for Console Logging

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
driver.get("http://localhost:5173")

# Capture console logs
for entry in driver.get_log('browser'):
    print(entry)
```

### Test Workflow

1. Start dev server
2. Run Selenium test on localhost
3. Review console output
4. Fix any errors
5. Deploy to GitHub Pages
6. Run Selenium test on live URL
7. Review console output
8. Report results with full output

---

## Deployment Workflow

### GitHub Pages Deployment

1. **Test locally** with Selenium
2. **Commit changes**: `git add . && git commit -m "message"`
3. **Push to GitHub**: `git push origin main`
4. **Wait 30-60 seconds** for GitHub Pages to rebuild
5. **Test live URL** with Selenium
6. **Show all test output** to user

### NEVER

- Deploy without local testing
- Claim success without testing live URL
- Skip the waiting period
- Hide test failures

---

## Common Pitfalls to Avoid

1. **False Success Claims**: Deploying without testing, then claiming it works
2. **Hidden Console Errors**: Not capturing console.log output from Selenium
3. **Scope Creep**: Fixing unrelated issues beyond user's request
4. **Premature Documentation**: Writing docs before testing features
5. **Tool Capability Lies**: Claiming tools can't do something without verification

---

## Development Server

### Starting Dev Server

```bash
./start.sh
# Cleans up stray processes, clears ports 5173/5174, starts server
# Server runs on http://localhost:5173
# Logs: .vite.log
# Stop with: ./stop.sh
```

**Note:** Use `./start.sh` instead of `npm run dev` to avoid port conflicts and ensure clean startup.

### Building for Production

```bash
npm run build
# Output in dist/ directory
```

### Preview Production Build

```bash
npm run preview
```

---

## File Structure

```
marketplace-bulk-editor/
├── src/
│   ├── components/
│   │   ├── DataTable.tsx
│   │   ├── ExportButton.tsx
│   │   ├── FileUpload.tsx
│   │   └── ...
│   ├── utils/
│   ├── App.tsx
│   ├── types.ts
│   └── main.tsx
├── public/
├── .augment/
│   └── rules/
│       ├── mandatory-rules.md
│       └── workspace-guidelines.md
├── IMPROVEMENT_PLAN.md
├── IMPLEMENTATION_SUMMARY.md
├── QUICK_START_GUIDE.md
├── README_IMPROVEMENTS.md
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Evidence-Based Development

**All claims must be backed by evidence:**

- Build success → Show terminal output
- Deployment success → Show Selenium test on live URL
- Feature working → Show console logs and screenshots
- No errors → Show full test output

**No evidence = No claim**

