# MagicChecklists

Create interactive checklists, kanban boards and guided tours in WordPress.

## Features

- **Classic Checklists** - Drag-and-drop items, priorities, deadlines, multi-level nesting
- **Publisher Checklists** - Enforce publishing requirements for selected post types
- **Kanban Board** - Visualize tasks with drag-and-drop columns, user assignment, due dates
- **Guided Tours** - Build step-by-step interactive tours for onboarding (frontend + backend)
- **Shortcodes** - Embed checklists anywhere, in list or kanban mode
- **Floating Buttons** - Trigger checklists via floating buttons or keyboard shortcuts
- **Access Control** - Granular permissions per role, user or public access
- **Analytics** - Track completion rates and engagement
- **API & Webhooks** - REST API with Slack, Discord and custom webhook integrations
- **Import / Export** - JSON, PDF and TXT formats
- **Dashboard Widget** - Checklist status on the WordPress dashboard
- **Dark Mode** - Full dark/light theme support
- **i18n** - German and French translations included

## Installation

1. Download the latest release zip
2. Upload via **Plugins > Add New > Upload Plugin** in WordPress
3. Activate and go to **MagicPlugins > MagicChecklists**

Or install directly from [WordPress.org](https://wordpress.org/plugins/) (pending approval).

## Development

### Prerequisites

- Node.js 18+
- WordPress development environment

### Setup

```bash
npm install
npm run dev
```

Vite dev server runs at `http://localhost:3000` with HMR. WordPress auto-detects it when `WP_DEBUG` is enabled.

### Production Build

```bash
npm run build        # Compile React assets
node build.js        # Create distribution zip
```

### Tech Stack

- React 18, Vite, TailwindCSS, Flowbite React
- PHP 7.4+, WordPress REST API

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[GPL-2.0-or-later](LICENSE)
