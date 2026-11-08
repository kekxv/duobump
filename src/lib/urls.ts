export function withBase(path: string, base: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const normalized = '/' + base.split('/').filter(Boolean).join('/');
  const prefix = normalized === '/' ? '' : normalized;
  const target = '/' + path.replace(/^\/+/, '');
  if (prefix && (target === prefix || target.startsWith(prefix + '/'))) return target;
  return prefix + target;
}
export const url = (path: string) => withBase(path, import.meta.env.BASE_URL);
