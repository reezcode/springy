import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function scriptSources(html) {
  const hashes = new Set();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(match[1]) || !match[2].trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(match[2], 'utf8').digest('base64')}'`);
  }
  return `'self' ${[...hashes].sort().join(' ')}`.trim();
}

export async function generateSecurityHeaders(directory = 'out', destination = '.generated/security-csp.conf') {
  const entries = [];
  async function walk(dir) {
    for (const file of await readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, file.name);
      if (file.isDirectory()) await walk(absolute);
      else if (file.name.endsWith('.html')) {
        const relative = `/${path.relative(directory, absolute).split(path.sep).join('/')}`;
        const sources = scriptSources(await readFile(absolute, 'utf8'));
        entries.push(`    ${JSON.stringify(relative)} "${sources}";`);
        if (relative.endsWith('/index.html')) entries.push(`    ${JSON.stringify(relative.slice(0, -10))} "${sources}";`);
      }
    }
  }
  await walk(directory);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `# Generated after static export. Rebuild when HTML changes.\nmap $uri $springy_script_sources {\n    default "'self'";\n${entries.sort().join('\n')}\n}\n`);
  return entries.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(`Generated CSP hashes for ${await generateSecurityHeaders()} HTML paths.`);
}
