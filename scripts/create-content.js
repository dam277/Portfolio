/**
 * @file scripts/create-content.js
 * @description Interactive & automated scaffolding CLI to generate symmetric (en/fr)
 * Markdown content files for Astro Content Collections using locale-specific templates.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Mapping configuration for supported Astro content collections.
 * - name: the folder name inside `src/content/`
 * - aliases: accepted shorthand identifiers for CLI argument matching
 * - template: the corresponding template file inside `templates/<locale>/`
 * - description: human-readable label displayed in the interactive menu
 */
const COLLECTIONS = {
  '1': {
    name: 'projects',
    aliases: ['project', 'projects', 'p'],
    template: 'project.md',
    description: 'Project case study (projects/)',
  },
  '2': {
    name: 'timeline',
    aliases: ['timeline', 't'],
    template: 'timeline.md',
    description: 'Career / Education milestone (timeline/)',
  },
  '3': {
    name: 'roadmap',
    aliases: ['roadmap', 'r'],
    template: 'roadmap.md',
    description: 'R&D learning challenge (roadmap/)',
  },
};

/**
 * Resolves a collection configuration from user input (numeric key or alias string).
 * @param {string} inputStr - The raw collection identifier entered by the user
 * @returns {object|null} - The matched collection configuration object or null
 */
function resolveCollection(inputStr) {
  const normalized = inputStr.trim().toLowerCase();
  for (const item of Object.values(COLLECTIONS)) {
    if (item.aliases.includes(normalized)) {
      return item;
    }
  }
  return COLLECTIONS[normalized] ?? null;
}

/**
 * Sanitizes a raw input string into a URL-friendly, lowercase kebab-case slug.
 * Removes all non-alphanumeric characters except hyphens and underscores.
 * @param {string} raw - The raw user input
 * @returns {string} - The sanitized kebab-case slug
 */
function normalizeSlug(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

/**
 * Main CLI execution routine.
 * Supports two distinct execution paths:
 * 1. Non-interactive mode when CLI arguments are supplied: `pnpm new <collection> <slug> [title]`
 * 2. Interactive prompt mode when invoked without arguments: `pnpm new`
 */
async function main() {
  const args = process.argv.slice(2);
  let selected = null;
  let slug = '';
  let title = '';

  // ---------------------------------------------------------------------------
  // Path 1: Non-interactive CLI mode (e.g. `pnpm new projects 01-game-engine "2D Game Engine"`)
  // ---------------------------------------------------------------------------
  if (args.length >= 2) {
    selected = resolveCollection(args[0]);
    if (!selected) {
      console.error(`Error: Unknown collection "${args[0]}". Valid options: projects, timeline, roadmap`);
      process.exit(1);
    }
    slug = normalizeSlug(args[1]);
    title = args.slice(2).join(' ').trim() || slug;
  } else {
    // -------------------------------------------------------------------------
    // Path 2: Interactive terminal prompt mode using native readline promises
    // -------------------------------------------------------------------------
    const rl = readline.createInterface({ input, output });

    console.log('\n==========================================');
    console.log('       Astro Content CLI Generator        ');
    console.log('==========================================\n');

    // Step 1: Prompt the user to select an existing collection
    console.log('Select a collection to create:');
    for (const [key, item] of Object.entries(COLLECTIONS)) {
      console.log(`  [${key}] ${item.name.padEnd(10)} - ${item.description}`);
    }

    const choice = (await rl.question('\nEnter choice (1, 2, or 3): ')).trim();
    selected = resolveCollection(choice);

    if (!selected) {
      console.error('\nError: Invalid choice. Operation cancelled.');
      rl.close();
      process.exit(1);
    }

    // Step 2: Prompt for the file slug identifier
    const rawSlug = (await rl.question('\nEnter file slug (e.g. 01-game-engine, 02-etml): ')).trim();
    slug = normalizeSlug(rawSlug);

    if (!slug) {
      console.error('\nError: Slug cannot be empty. Operation cancelled.');
      rl.close();
      process.exit(1);
    }

    // Step 3: Prompt for the human-readable title (defaults to slug if omitted)
    const rawTitle = (await rl.question(`\nEnter title [defaults to "${slug}"]: `)).trim();
    title = rawTitle || slug;

    // Close terminal readline stream
    rl.close();
  }

  // Compute current date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // ---------------------------------------------------------------------------
  // Symmetrical File Creation (en/ and fr/ locales with localized templates)
  // ---------------------------------------------------------------------------
  const locales = ['en', 'fr'];
  const baseContentDir = path.resolve(process.cwd(), 'src', 'content', selected.name);

  console.log(`\nCreating ${selected.name} content files...`);

  for (const locale of locales) {
    // Locate the localized template inside templates/<locale>/<template>
    const localizedTemplatePath = path.resolve(
      process.cwd(),
      'templates',
      locale,
      selected.template
    );

    if (!fs.existsSync(localizedTemplatePath)) {
      console.error(`\nError: Localized template not found: ${localizedTemplatePath}`);
      process.exit(1);
    }

    const templateContent = fs.readFileSync(localizedTemplatePath, 'utf8');

    // Replace template placeholders with dynamic values
    const renderedContent = templateContent
      .replaceAll('{{title}}', title)
      .replaceAll('{{date}}', today);

    const localeDir = path.join(baseContentDir, locale);
    const targetFilePath = path.join(localeDir, `${slug}.md`);

    // Ensure parent directories exist (creates src/content/<collection>/<locale>)
    fs.mkdirSync(localeDir, { recursive: true });

    // Guard against accidentally overwriting existing content files
    if (fs.existsSync(targetFilePath)) {
      console.log(`  [SKIPPED] File already exists: src/content/${selected.name}/${locale}/${slug}.md`);
    } else {
      fs.writeFileSync(targetFilePath, renderedContent, 'utf8');
      console.log(`  [CREATED] src/content/${selected.name}/${locale}/${slug}.md (using ${locale} template)`);
    }
  }

  console.log('\nDone! Both English and French files are ready with their localized structure.\n');
}

// Global process error handler
main().catch((err) => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
