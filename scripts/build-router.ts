import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.env.BUILD_DIR || 'dist');
const home = await readFile(resolve(output, 'index.html'), 'utf8');
await writeFile(resolve(output, 'index.content.html'), home);
await writeFile(resolve(output, 'index.html'), await readFile('public/entry.html', 'utf8'));
console.log('Static hash entry ready; original homepage retained at index.content.html.');
