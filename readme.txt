=== MagicChecklists ===
Contributors: chrispump
Tags: checklist, task, kanban, onboarding, tour
Requires at least: 6.5
Tested up to: 6.9
Stable tag: 2.3
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create interactive checklists, kanban boards and guided tours in the WordPress backend and frontend.

== Description ==

MagicChecklists lets you create custom checklists that can be accessed from anywhere on your WordPress site. Use them for onboarding, task management, content publishing workflows and more.

**Core Features:**

* **Classic Checklists** - Create checklists with drag-and-drop item ordering, priorities, deadlines and multi-level nesting
* **Publisher Checklists** - Enforce publishing requirements for selected post types
* **Kanban Board** - Visualize and manage checklist tasks with drag-and-drop columns, user assignment and due dates
* **Guided Tours** - Build interactive step-by-step tours to guide users through your WordPress site (frontend and backend)
* **Shortcode Support** - Embed checklists anywhere using shortcodes, with both list and kanban display modes
* **Floating Buttons** - Trigger checklists via floating buttons, keyboard shortcuts or both
* **Granular Access Control** - Set permissions per user role, individual user or public access
* **Analytics Dashboard** - Track checklist completion rates, user engagement and performance metrics
* **API & Webhooks** - REST API endpoints and webhook integrations with Slack, Discord and custom endpoints
* **Import / Export** - Export checklists to JSON, PDF or TXT and import them across sites
* **Dashboard Widget** - Display checklist status directly on the WordPress dashboard
* **Dark Mode** - Full dark mode support throughout the admin interface
* **Internationalization** - Fully translatable with German and French translations included

== Installation ==

1. Upload the `magicchecklists` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to MagicPlugins > MagicChecklists to create your first checklist

== Frequently Asked Questions ==

= Can I use checklists on the frontend? =

Yes! Enable shortcode support on any checklist and embed it on any page or post. You can also enable public access so logged-out visitors can interact with checklists.

= Does it work with page builders? =

Yes. MagicChecklists is compatible with major page builders including Bricks, Elementor and any builder that supports shortcodes. You can optionally disable floating buttons when inside page builders.

= Can multiple users work on the same checklist? =

Yes. The plugin includes a locking mechanism so only one user can edit a checklist at a time, ensuring data consistency. Users can have different permission levels (view, check items, edit, etc.).

= Is there an API? =

Yes. MagicChecklists provides REST API endpoints (v1 and v2) for managing checklists programmatically. Webhook integrations with Slack, Discord and custom endpoints are also available.

== Screenshots ==

1. Checklist editor with drag-and-drop items
2. Kanban board view
3. Guided tour builder
4. Checklist drawer on the frontend
5. Analytics dashboard

== Changelog ==

= 2.3 =
* Open source release - removed licensing requirement, all features now available out of the box
* Removed MagicDash connection dependency
* Removed custom update checker (now distributed via WordPress.org)

= 2.2.1 =
* Improved: Priority and item deadline now visible on kanban view
* Fixed: Item deadlines now render correctly on the edit checklist view

= 2.2.0.1 =
* Hotfix: Fixed tutorial checklist - checking items works as expected
* Hotfix: Load everywhere now correctly set as default

= 2.2 =
* New: Feature-Board mode on Kanban view with upvoting and commenting
* New: Column sync on Kanban board - items move automatically based on state
* New: Comment items on drawer
* New: Tutorial checklist on new installs
* Improved: Automatic language detection from WordPress settings
* Improved: More granular access controls with multiple rules per permission
* Fixed: Several Kanban view data sync issues

= 2.1.2.2 =
* Improved: Shortcode checklist view alignment and mobile responsiveness
* Hotfix: Checklist cloning now properly clones all settings

= 2.1.2.1 =
* Improved: Shortcode checklists with proper UI modals and better item rendering
* Hotfix: Fixed checklist view mode on shortcode

= 2.1.2 =
* New: Kanban view on the frontend via shortcodes
* Improved: Item rendering consistency on kanban
* Fixed: Disable floating UI inside page builders option

= 2.1.1 =
* Improved: More consistent content saving across drawer interactions
* Improved: Loading indicator when saving checklists
* Improved: Tour connection checking mechanism

= 2.1.0 =
* New: Kanban board view with drag-and-drop columns, user assignment and due dates
* New: Full i18n internationalization with German and French translations
* Improved: New save button on checklist creation

= 2.0.6 =
* Fixed: Item deadline modal z-index issue

= 2.0.5 =
* Fixed: Shortcut availability check validation
* Hotfix: Checklist drawer trigger method fix

= 2.0.4 =
* Hotfix: Floating buttons on mobile now properly draggable and clickable

= 2.0.3 =
* Hotfix: License activation bug and small UI improvements

= 2.0.2 =
* Hotfix: Fixed asset loading issue

= 2.0 =
* New: Completely redesigned interface and codebase
* New: Tour Creator for interactive step-by-step onboarding
* New: Publisher Checklists for enforcing publishing requirements
* New: Dashboard widget
* New: Item locking mechanism with private items
* New: Checklist Analytics
* Improved: Optimized codebase for faster performance
* Improved: Drawer UX improvements
* Improved: Floating buttons auto-group
* Improved: Frontend shortcode editing

= 1.3.5 =
* New: Multi-level list items with hierarchical nesting
* Improved: API endpoints updated with v2 for easier handling
* Improved: Enhanced API key security

= 1.3.4 =
* New: Show checklist description in the drawer
* New: MainWP integration for central dashboard management

= 1.3.3 =
* New: List item counters (total, checked, percentage)
* Improved: Visual validation feedback on forms

= 1.3.2 =
* New: Custom drawer appearance with full styling options
* New: Deadlines on individual list items
* New: In-progress status for list items

= 1.3.1 =
* New: Images inside list items
* New: Export checklists to TXT, PDF and JSON
* Improved: JSON import/export for full checklist migration
* Improved: Menu item position setting
* Improved: Disable floating buttons in page builders

= 1.3 =
* New: REST API and webhook integrations
* New: Slack and Discord notifications
* New: Shortcode support for embedding checklists
* New: Automatic checklist reset scheduling
* New: Checklist conditions (where to load)
* New: Toggle through checklists in the drawer
* New: Tags and colors for organization
* New: Uninstaller for clean removal
* Improved: Removed active checklist limit

= 1.2 =
* New: Granular access control system
* New: Locking mechanism for concurrent editing
* Improved: Streamlined multi-step creation form

= 1.1.2 =
* New: Clickable links and URL auto-conversion in list items
* New: Rate limiting for public checklists

= 1.1.1 =
* New: Public access with floating buttons
* New: Floating button trigger option
* Fixed: Bricks Builder loading issue

= 1.1.0 =
* New: Priority selector on checklist and item level
* Improved: Modular codebase restructure

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 2.3 =
All features are now free and open source. No commercial license required.
