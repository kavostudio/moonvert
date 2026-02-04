# Contributing to Moonvert

Thank you for your interest in contributing to Moonvert! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Adding New Format Support](#adding-new-format-support)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes and learn from them

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR-USERNAME/moonvert.git
    cd moonvert
    ```
3. **Add the upstream remote**:
    ```bash
    git remote add upstream https://github.com/kavostudio/moonvert.git
    ```

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 10+
- macOS (required for building)

### Setup Steps

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env - set BUILD_TYPE="light" for faster development builds

# Install dependencies
pnpm install

# Set up Python environment (for geospatial conversions)
pnpm python:setup

# Build binaries (FFmpeg, Pandoc, Python) - skip if using BUILD_TYPE="light"
pnpm build:binaries

# Run in development mode
pnpm dev
```

### Quick Development Build

For faster iteration during development, set `BUILD_TYPE="light"` in your `.env` file. This skips bundling external binaries (FFmpeg, Pandoc, Python). It is for testing purposes only.

## How to Contribute

### Reporting Bugs

- Use the [Bug Report template](https://github.com/kavostudio/moonvert/issues/new?template=bug_report.yml)
- Include your Moonvert version, macOS version, and chip type
- Provide clear steps to reproduce
- Include any error messages or logs

### Suggesting Features

- Use the [Feature Request template](https://github.com/kavostudio/moonvert/issues/new?template=feature_request.yml)
- Explain the problem your feature would solve
- Consider how it fits with Moonvert's focus on privacy and simplicity

### Requesting New Formats

- Use the [Format Request template](https://github.com/kavostudio/moonvert/issues/new?template=format_request.yml)
- Specify the format extension and type
- Explain your use case

### Contributing Code

1. **Check existing issues** to see if someone is already working on it
2. **Open an issue first** for significant changes to discuss the approach
3. **Create a feature branch** from `main`:
    ```bash
    git checkout -b feature/your-feature-name
    ```
4. **Make your changes** following our coding standards
5. **Test thoroughly** before submitting
6. **Submit a pull request**

## Pull Request Process

1. **Update your fork** with the latest upstream changes:

    ```bash
    git fetch upstream
    git rebase upstream/main
    ```

2. **Ensure your code**:
    - Passes linting: `pnpm lint`
    - Passes type checking: `pnpm typecheck`
    - Works in development mode: `pnpm dev`
    - Builds successfully: `pnpm build`

3. **Write a clear PR description**:
    - Explain what changes you made and why
    - Reference any related issues (e.g., "Fixes #123")
    - Include screenshots for UI changes

4. **Be responsive** to review feedback

5. **Keep PRs focused** — one feature or fix per PR

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer explicit types over `any`
- Use `type` for type aliases, `interface` for object shapes

### Formatting & Linting

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### Naming Conventions

- **Files**: `kebab-case.ts` for everything.
- **Variables/Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`. Only use types, not TypeScript interfaces.
- **Constants**: `SCREAMING_SNAKE_CASE`

### Commit Messages

Write clear, descriptive commit messages:

```
feat: add AVIF to PNG conversion support
fix: handle files with embedded thumbnails in video conversion
docs: update README with new format list
refactor: simplify FFmpeg argument builder
```

Prefixes:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

## Project Structure

```
moonvert/
├── src/
│   ├── main/           # Electron main process
│   │   ├── converters/ # Conversion logic (bridges to FFmpeg, ImageMagick, etc.)
│   │   └── ...
│   ├── renderer/       # React frontend
│   ├── preload/        # Electron preload scripts
│   ├── shared/         # Shared types and utilities
│   ├── python/         # Python scripts for geospatial conversion
│   └── resources/      # App resources (icons, etc.)
├── scripts/            # Build scripts for binaries
├── assets/             # App icons and images
└── docs/               # Documentation
```

### Key Directories

- **`src/main/converters/`** — Where conversion logic lives. Each format category has its own converter.
- **`src/main/converters/bridges/`** — Bridges to external tools (FFmpeg, Pandoc, Python/GeoPandas)
- **`src/renderer/`** — React UI components
- **`src/shared/types/`** — Shared TypeScript types

## Adding New Format Support

### Adding a New Video/Audio Format

1. Update format types in `src/shared/types/conversion.types.ts`
2. Add preset in `src/main/converters/bridges/process-based/ffmpeg/ffmpeg-args.ts`
3. Register the format in the appropriate converter

### Adding a New Image Format

1. Update format types in `src/shared/types/conversion.types.ts`
2. Add conversion logic in the image converter
3. May require ImageMagick WASM updates

### Adding a New Document Format

1. Update format types in `src/shared/types/conversion.types.ts`
2. Add Pandoc configuration in the document converter

### Adding a New Geospatial Format

1. Update format types in `src/shared/types/conversion.types.ts`
2. Update Python GeoPandas script in `src/python/`
3. Register in the geospatial converter

---

## Questions?

- Open a [Discussion](https://github.com/kavostudio/moonvert/discussions) for general questions
- Email us at [support@kavostudio.dev](mailto:support@kavostudio.dev)

Thank you for contributing to Moonvert! 🌙
