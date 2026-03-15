# Open Source Readiness Checklist

Steps to prepare a WordPress plugin for public GitHub + WordPress.org distribution.

## 1. Remove Commercial Dependencies

- [ ] Remove all license checking/activation code
- [ ] Remove MagicDash/proxy connection code
- [ ] Remove custom update checker (replaced by WordPress.org updates)
- [ ] Ensure all features work without a license key
- [ ] Remove license UI (admin pages, sidebar items, settings tabs)

## 2. Security & Secrets Audit

- [ ] Scan git history for leaked secrets: `git log -p --all -S 'sk-ant\|api_key\|password' -- '*.php' '*.env' '*.json'`
- [ ] Verify no `.env` files are tracked: `git ls-files '*.env'`
- [ ] Verify `.gitignore` excludes: `.env`, `vendor/`, `node_modules/`, `*.zip`, `build/`
- [ ] Check for hardcoded API keys, tokens, or credentials in source files
- [ ] If secrets were ever committed, rewrite git history or start fresh

## 3. WordPress.org Compliance (Detailed Plugin Guidelines)

- [ ] **GPL-2.0-or-later** license in plugin header + LICENSE file in root
- [ ] **readme.txt** in WordPress.org standard format (use [validator](https://wordpress.org/plugins/developers/readme-validator/))
- [ ] **No remote code execution** - all JS/CSS loaded locally, no CDN dependencies
- [ ] **No unauthorized tracking** - no phone-home, telemetry, or analytics without explicit opt-in
- [ ] **No trialware** - no features gated behind payment, license, or trial period
- [ ] **Human-readable code** - no obfuscated PHP (minified JS is fine if source is available)
- [ ] **Use WordPress libraries** - don't bundle jQuery, lodash, etc. that WP already provides
- [ ] **No dev artifacts in distribution** - exclude node_modules, .git, src/, test/, config files
- [ ] **Zip under 10MB**
- [ ] **Stable tag** in readme.txt matches plugin version
- [ ] **Contributors** field in readme.txt matches your wordpress.org username (case-sensitive)

## 4. Required Files

- [ ] `readme.txt` - WordPress.org standard format with Description, Installation, FAQ, Changelog
- [ ] `LICENSE` - Full GPL-2.0 text
- [ ] `uninstall.php` - Clean removal of plugin data
- [ ] Main plugin file with proper WordPress plugin header

## 5. Files to Remove / Exclude

- [ ] `release.json` (WordPress.org generates its own metadata)
- [ ] `vendor/` (if no PHP dependencies remain)
- [ ] `composer.lock`
- [ ] Old distribution zips
- [ ] Any MagicDash/licensing-specific files

## 6. Build & Test

- [ ] Run `npm run build` to compile frontend assets
- [ ] Run `node build.js` to create distribution zip
- [ ] Install the built zip on a clean WordPress site
- [ ] Verify all features work without license
- [ ] Run [Plugin Check](https://wordpress.org/plugins/plugin-check/) against the clean install (not the dev directory - it chokes on node_modules/.git)
- [ ] Test the readme.txt with the [WordPress readme validator](https://wordpress.org/plugins/developers/readme-validator/)

## 7. Submission

- [ ] Enable 2FA on your wordpress.org account
- [ ] Submit zip at https://wordpress.org/plugins/developers/add/
- [ ] Wait for review (up to 14 business days)
- [ ] Once approved, push to SVN (or set up GitHub Action for auto-deploy)

## 8. Ongoing

- [ ] Bump version in: plugin header, package.json, readme.txt (Stable tag)
- [ ] Add changelog entry to readme.txt for each release
- [ ] Push to SVN trunk + create version tag for each release
- [ ] Keep "Tested up to" in readme.txt current with latest WordPress version
