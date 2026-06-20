import { NextResponse, type NextRequest } from "next/server";

// Em Next.js 15 com diretório src/, o middleware DEVE ficar em src/middleware.ts
// (na raiz, o middleware-manifest fica vazio e a Vercel mostra 0 invocações).

const PUBLIC_PREFIXES = ["/login", "/auth", "/_next", "/favicon", "/api/ai/status"];

function isPublic(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p));
}

/**
 * Verificação de sessão SÍNCRONA via cookie — compatível com Edge Runtime,
 * sem dependências de @supabase/ssr (que é incompatível no Edge).
 * Se o Supabase não estiver configurado (sem env), libera tudo (modo demo).
 */
function hasSession(req: NextRequest): boolean {
  const cookies = req.cookies.getAll();
  return cookies.some((c) => c.name.includes("-auth-token"));
}

const SUPABASE_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!SUPABASE_ENABLED || isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
