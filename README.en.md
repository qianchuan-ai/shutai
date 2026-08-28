<div align="center">

# Shutai · AI Prompt Workbench

**Not another AI — it's the workbench for AI.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[简体中文](README.md) | English

---

</div>

## What is Shutai?

Shutai (枢台, meaning "pivot platform") is an **AI Prompt Workbench** — not another AI chatbot, but a tool that helps you manage, organize, and reuse your AI workflows.

It works with **any AI tool** (Doubao, ChatGPT, Claude, Kimi, DeepSeek, etc.) — generate prompts, manage templates,沉淀 outputs, and make your AI collaboration reusable.

> AI tools are everywhere. Your prompts, workflows, and outputs are scattered everywhere. Shutai brings them together.

---

## ✨ Core Features

### 1. Prompt Workshop — One-Click Prompt Generation
- Input content, choose an operation (Summarize / Deep Analysis / Expand / Polish / Translate / Brainstorm)
- Automatically generates structured prompts, one-click copy to any AI
- Keyboard shortcuts 1-6 for quick operation selection
- Save as Skill / Workflow / Output

### 2. Skill Library — Reusable Prompt Templates
- Variable fill-in support, one-click generate and copy
- Category tags (Content Creation / Programming / Data Analysis, etc.)
- Create / Edit / Delete
- Search and filter

### 3. Workflow Library — Multi-Step AI Collaboration Templates
- Click cards to expand steps, each step can generate prompts
- Categories: Top-level Framework / Content SOP, etc.
- Progress tracking (Completed / Total Steps / Completion Rate)
- Create / Edit / Delete

### 4. Inbox — Collect Links + Settle AI Outputs
- Add links, save AI outputs, jot down inspirations
- Category filters (All / Links / AI Output / Inspiration)
- Search
- Unified management, reusable

### 5. Dashboard — Data Statistics
- Prompt generation count
- Skill count
- Workflow count
- Inbox count
- Usage trend chart

---

## 🎨 Design Highlights

- **Mosaic Style**: Pixel-grid background, retro meets modern
- **Three Themes**: Pink / Blue / Dark, broader audience appeal
- **Zero Dependencies**: Pure Node.js + vanilla frontend, no npm install needed
- **Local-First**: Data stored locally, zero privacy risk
- **Responsive**: Works on desktop and mobile

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14 (no other dependencies required)

### Installation

```bash
git clone https://github.com/qianchuan-ai/shutai.git
cd shutai
node server.js
```

Open http://localhost:8765 in your browser.

### Configuration

Copy `config.example.json` to `config.json` and customize:

```json
{
  "port": 8765,
  "dataDir": "./data"
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Function |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open Command Palette |
| `Ctrl+Shift+P` | Open Command Palette |
| `1-6` | Quick select operation in Prompt Workshop |
| `Esc` | Close modal |

---

## 📸 Screenshots

| Home | Prompt Workshop |
|---|---|
| ![Home](docs/screenshots/01-home.png) | ![Prompt Workshop](docs/screenshots/02-prompt-workshop.png) |

| Skill Library | Workflow Library | Inbox |
|---|---|---|
| ![Skill Library](docs/screenshots/03-skills.png) | ![Workflow Library](docs/screenshots/04-workflows.png) | ![Inbox](docs/screenshots/05-inbox.png) |

---

## 🏗️ Project Structure

```
shutai/
├── server.js              # Zero-dependency Node.js server
├── package.json           # Project metadata
├── config.example.json    # Example configuration
├── .gitignore
├── README.md              # Chinese README
├── README.en.md           # English README (this file)
├── public/
│   ├── index.html         # Main HTML
│   ├── css/
│   │   ├── base.css       # Base styles & variables
│   │   └── components.css # Component styles
│   └── js/
│       ├── main.js        # App entry & routing
│       ├── api.js         # API client
│       ├── store.js       # State management
│       ├── i18n.js        # Internationalization (zh/en)
│       ├── icons.js       # SVG icons
│       ├── prompt-builder.js  # Prompt generation engine
│       ├── command-palette.js  # Command palette
│       ├── ai-integration.js   # AI integration
│       ├── doubao.js      # Doubao integration
│       └── pages/         # Page modules
│           ├── hub.js         # Home / Dashboard
│           ├── intake.js      # Inbox
│           ├── methodology.js # Workflow library
│           ├── skills.js      # Skill library
│           ├── settings.js    # Settings
│           ├── dashboard.js   # Dashboard
│           ├── capture.js     # Capture
│           ├── habits.js      # Habits
│           ├── knowledge.js   # Knowledge
│           ├── media.js       # Media
│           ├── tools.js       # Tools
│           └── aigc.js        # AIGC
├── data/                  # User data (gitignored)
├── docs/
│   └── screenshots/       # Screenshots for README
└── .state/                # Runtime state (gitignored)
```

---

## 🔧 Configuration

| Option | Default | Description |
|---|---|---|
| `port` | `8765` | Server port |
| `dataDir` | `./data` | Data storage directory |

---

## 🔒 Data & Privacy

- **Local-First**: All data stored in local JSON files
- **Zero Dependencies**: No external services, no tracking
- **Exportable**: Data can be exported and backed up
- **Self-Hostable**: Run on your own server, full control

---

## 🛠️ Tech Stack

- **Backend**: Node.js (zero dependencies, pure `http` module)
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)
- **Storage**: Local JSON files
- **Deployment**: Single-file startup, local or server

---

## 🤝 Contributing

Contributions are welcome! Please feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🌐 Add translations
- 🔧 Submit bug fixes
- ✨ Add new features

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the need to organize AI workflows across multiple AI tools
- Built with zero dependencies for maximum portability
- Mosaic design inspired by retro pixel art aesthetics

---

<div align="center">

**If this project helps you, please give it a ⭐ Star!**

[简体中文](README.md) | English

</div>
