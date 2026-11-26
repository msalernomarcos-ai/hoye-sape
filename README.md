# Hoye Sape semanal

Página de la juntada de los miércoles: mesa de la semana, votos de comida y del más zarpado (1 a 10), ranking de comidas, ranking del más zarpado, tabla de asistencias y próximo anfitrión.

## Cómo está armado

- `public/index.html`: toda la página (diseño y lógica).
- `public/data/semanas.json`: **los datos**. Es lo único que se toca cada jueves.
- `functions/api/votos.js`: la API de votos (Cloudflare Pages Functions).
- `schema.sql`: la tabla de votos (Cloudflare D1, base SQL gratis).

Hosting y base: Cloudflare Pages + D1, plan gratis (sobra para 17 personas). El único costo es el dominio.

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

## Puesta en marcha (una sola vez, en Cloudflare)

1. **Base de datos**: Storage & Databases > D1 SQL Database > Create database, nombre `hoye-sape`. Entrar a la base, pestaña Console, pegar el contenido de `schema.sql` y Execute.
2. **Página**: Workers & Pages > Create > pestaña Pages > Import an existing Git repository, elegir `hoye-sape`. Framework preset: None. Build command: vacío. Build output directory: `public`. Save and Deploy.
3. **Conectar la base**: en el proyecto, Settings > Bindings > Add > D1 database. Variable name: `DB`, base: `hoye-sape`.
4. **Clave**: Settings > Variables and Secrets > Add, tipo Secret, nombre `CLAVE`, valor la clave del grupo.
5. **Redeploy**: Deployments > en el último, los tres puntitos > Retry deployment, para que tome la base y la clave.

Queda en `hoye-sape.pages.dev`.

## Dominio propio

Dos caminos:

- **.com.ar**: se registra en NIC Argentina (nic.ar) con clave fiscal de AFIP/ARCA. Es barato, se paga en pesos por año. Después, en Cloudflare: Add a domain, y en nic.ar se cambian los DNS (delegación) por los dos que te da Cloudflare.
- **.com u otro**: se compra directo en Cloudflare (Domain Registration), a precio de costo, aprox. USD 10 a 12 por año, y queda todo en el mismo lugar.

Con el dominio en Cloudflare: proyecto de Pages > Custom domains > Set up a custom domain > escribir el dominio. El certificado HTTPS es automático.
