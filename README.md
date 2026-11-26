# Hoye Sape semanal

Página de la juntada de los miércoles: mesa de la semana, votos de comida y del más zarpado (1 a 10), ranking de comidas, ranking del más zarpado, tabla de asistencias y próximo anfitrión.

## Cómo está armado

- `public/index.html`: toda la página (diseño y lógica).
- `public/data/semanas.json`: **los datos**. Es lo único que se toca cada jueves.
- `src/worker.js`: el Worker de Cloudflare que sirve la página y la API de votos.
- `wrangler.jsonc`: configuración de Cloudflare (base D1 y carpeta `public`).
- `schema.sql`: la tabla de votos (Cloudflare D1, base SQL gratis).

Hosting y base: Cloudflare Workers + D1, plan gratis (sobra para 17 personas). El único costo es el dominio.

### Reglas de votación

- Cada uno elige su nombre arriba ("¿Quién sos?") y queda guardado en su celu.
- Comida: votan del 1 al 10 los que fueron, menos el anfitrión.
- Más zarpado: cada uno que fue elige a una persona que estuvo (no a sí mismo) y le pone de 1 a 10. Un voto por semana, se puede cambiar.
- Ranking del más zarpado: suma de puntos de todas las semanas; también cuenta cuántas semanas ganó cada uno.
- Clave del grupo: para votar hay que poner la clave (variable `CLAVE` en Cloudflare). Ver la página es libre.
- Para cerrar la votación de una semana: `"votacionAbierta": false` en esa semana.

## Actualización de cada jueves

Agregar una semana al final de `"semanas"` en `public/data/semanas.json` y cambiar `"proximo"`:

```json
{
  "numero": 2,
  "fecha": "2026-12-02",
  "anfitrion": "mateo-scalella",
  "plato": "Lo que cocinó",
  "postre": "El postre",
  "notas": "",
  "ausentes": ["tomas-ferrari"],
  "votacionAbierta": true
}
```

Los nombres van con su id (minúsculas y guiones, como figura en `"participantes"`). Si el archivo está en GitHub, se edita desde la web (lápiz, "Commit changes") y la página se actualiza sola en un minuto. O más fácil: mandarle a Claude el resumen de la juntada y que lo cargue.

## Puesta en marcha (ya hecha)

1. Worker `hoye-sape` en Cloudflare conectado a este repositorio: cada cambio en `main` se publica solo.
2. Base D1 `hoye-sape` con la tabla de `schema.sql` (se pega en la pestaña Console de la base).
3. Secreto `CLAVE` en el Worker (Settings > Variables and Secrets) con la clave del grupo.

## Dominio propio

Dos caminos:

- **.com.ar**: se registra en NIC Argentina (nic.ar) con clave fiscal de AFIP/ARCA. Es barato, se paga en pesos por año. Después, en Cloudflare: Add a domain, y en nic.ar se cambian los DNS (delegación) por los dos que te da Cloudflare.
- **.com u otro**: se compra directo en Cloudflare (Domain Registration), a precio de costo, aprox. USD 10 a 12 por año, y queda todo en el mismo lugar.

Con el dominio en Cloudflare: Worker hoye-sape > Settings > Domains & Routes > Add > Custom domain > escribir el dominio. El certificado HTTPS es automático.
