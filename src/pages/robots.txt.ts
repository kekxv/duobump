import type { APIRoute } from 'astro';
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\n${import.meta.env.PUBLIC_RELEASE === 'true' ? 'Allow: /' : 'Disallow: /'}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
