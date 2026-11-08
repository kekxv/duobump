import { spawnSync } from 'node:child_process';
const result = spawnSync('pagefind', ['--site', process.env.BUILD_DIR || 'dist'], {
  stdio: 'inherit',
  shell: false,
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
