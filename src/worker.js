// Worker: sirve la página (carpeta public) y la API de votos en /api/votos.
// GET devuelve resultados, POST guarda (o cambia) un voto.
// Base de datos: Cloudflare D1, enlazada como DB. Clave opcional del grupo: variable CLAVE.
const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

async function cargarDatos(ctx) {
  const r = await ctx.env.ASSETS.fetch(new URL('/data/semanas.json', ctx.request.url));
  return r.json();
}

function claveOk(ctx, clave) {
  return !ctx.env.CLAVE || clave === ctx.env.CLAVE;
}

async function onRequestGet(ctx) {
  const db = ctx.env.DB;
  const url = new URL(ctx.request.url);
  const [comida, zarpado] = await Promise.all([
    db.prepare("SELECT semana, AVG(puntaje) AS promedio, COUNT(*) AS votos FROM votos WHERE tipo = 'comida' GROUP BY semana").all(),
    db.prepare("SELECT semana, objetivo, SUM(puntaje) AS puntos, COUNT(*) AS votos FROM votos WHERE tipo = 'zarpado' GROUP BY semana, objetivo").all()
  ]);
  let mios = [];
  const votante = url.searchParams.get('votante');
  if (votante && claveOk(ctx, url.searchParams.get('clave') || '')) {
    mios = (await db.prepare('SELECT semana, tipo, objetivo, puntaje FROM votos WHERE votante = ?').bind(votante).all()).results;
  }
  return json({ comida: comida.results, zarpado: zarpado.results, mios, requiereClave: !!ctx.env.CLAVE });
}

async function onRequestPost(ctx) {
  let b;
  try { b = await ctx.request.json(); } catch { return json({ error: 'Pedido inválido' }, 400); }
  if (!claveOk(ctx, String(b.clave || ''))) return json({ error: 'La clave del grupo no es correcta' }, 403);

  const datos = await cargarDatos(ctx);
  const semana = datos.semanas.find(s => s.numero === Number(b.semana));
  const ids = new Set(datos.participantes.map(p => p.id));
  const puntaje = Number(b.puntaje);
  const votante = String(b.votante || '');
  const tipo = b.tipo;

  if (!semana) return json({ error: 'Esa semana no existe' }, 400);
  if (semana.votacionAbierta === false) return json({ error: 'La votación de esa semana ya cerró' }, 400);
  if (!ids.has(votante)) return json({ error: 'Elegí tu nombre antes de votar' }, 400);
  if (semana.ausentes.includes(votante)) return json({ error: 'Solo votan los que fueron a la juntada' }, 400);
  if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 10) return json({ error: 'El puntaje va del 1 al 10' }, 400);

  let objetivo = '';
  if (tipo === 'comida') {
    if (votante === semana.anfitrion) return json({ error: 'El anfitrión no vota su propia comida' }, 400);
  } else if (tipo === 'zarpado') {
    objetivo = String(b.objetivo || '');
    if (!ids.has(objetivo) || semana.ausentes.includes(objetivo)) return json({ error: 'Elegí a alguien que haya estado' }, 400);
    if (objetivo === votante) return json({ error: 'No te podés votar a vos mismo' }, 400);
  } else {
    return json({ error: 'Tipo de voto inválido' }, 400);
  }

  await ctx.env.DB.prepare(
    `INSERT INTO votos (semana, votante, tipo, objetivo, puntaje, actualizado) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (semana, votante, tipo) DO UPDATE SET objetivo = excluded.objetivo, puntaje = excluded.puntaje, actualizado = excluded.actualizado`
  ).bind(semana.numero, votante, tipo, objetivo, puntaje).run();

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/votos') {
      const ctx = { request, env };
      try {
        if (request.method === 'GET') return await onRequestGet(ctx);
        if (request.method === 'POST') return await onRequestPost(ctx);
        return json({ error: 'Método no permitido' }, 405);
      } catch (e) {
        return json({ error: 'Error del servidor' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
