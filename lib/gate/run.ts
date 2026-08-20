import { checkFacts } from './facts';
import { checkStructure } from './structure';
import { checkDedupe } from './dedupe';
import { checkLinks } from './links';
import { loadContexts } from './load-context';

const gates: Record<string, any> = {
  facts: checkFacts,
  structure: checkStructure,
  dedupe: checkDedupe,
  links: checkLinks
};

async function main() {
  const args = process.argv.slice(2);
  let source = 'file';
  let pathGlob = 'data/drafts/**/*.json';
  let pageId: string | undefined;

  for (const arg of args) {
      if (arg.startsWith('--source=')) source = arg.split('=')[1];
      if (arg.startsWith('--path=')) pathGlob = arg.split('=')[1];
      if (arg.startsWith('--page=')) pageId = arg.split('=')[1];
  }

  const contexts = await loadContexts({ source, path: pathGlob, page: pageId });
  console.log(`검사 대상 ${contexts.length}건`);

  let totalViolations = 0;

  for (const ctx of contexts) {
      const results = [
          checkFacts(ctx),
          checkStructure(ctx),
          checkDedupe(ctx),
          checkLinks(ctx)
      ];

      const violations = results.flatMap(r => r.violations);
      const notes = results.flatMap(r => r.notes || []);
      const slug = ctx.slug || ctx.id || 'unknown';

      if (violations.length > 0) {
          totalViolations++;
          const violationMsgs = violations.map(v => `${v.code} ${v.message} (${v.hint})`).join(' / ');
          console.error(`✗ ${slug}\t${violationMsgs}`);
      } else {
          const notesStr = notes.length > 0 ? ` (note: ${notes.map(n => n.message).join(', ')})` : '';
          console.log(`✓ ${slug}\t${notesStr}`);
      }
  }

  if (totalViolations > 0) {
      console.log(`\n위반 ${totalViolations}건 / ${contexts.length}건  → exit 1`);
      process.exit(1);
  } else {
      console.log(`\n모든 게이트 통과 (위반 0건)`);
      process.exit(0);
  }
}

main().catch(console.error);
