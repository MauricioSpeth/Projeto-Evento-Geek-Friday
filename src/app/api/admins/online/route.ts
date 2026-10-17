import { NextRequest } from 'next/server';
import { getAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { jsonError } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminAtivo = { id:number; usuario:string; papel:'admin'|'geral' };

// Resposta privativa do Admin, com uma linha por conta (não por aba/sessão).
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return jsonError('Acesso não autorizado.', 401);
    const result = await query<AdminAtivo>(`
      SELECT a.id, a.usuario, a.papel
      FROM admins a
      JOIN admin_sessions s ON s.admin_id = a.id
      WHERE s.expira_em > NOW()
        AND s.visto_em > NOW() - INTERVAL '90 seconds'
      GROUP BY a.id, a.usuario, a.papel
      ORDER BY CASE WHEN a.papel='geral' THEN 0 ELSE 1 END, lower(a.usuario), a.id
    `);
    return Response.json({ administradores: result.rows, online: result.rows.length }, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error) {
    console.error('Erro ao consultar administradores ativos:', error);
    return jsonError('Não foi possível consultar os administradores.', 500);
  }
}
