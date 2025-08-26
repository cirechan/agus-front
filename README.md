# Club San Agustín Frontend

Este repositorio usa ficheros JSON locales para almacenar los datos de la aplicación.

## Reset de temporada

Para iniciar la temporada **2025-2026** con los equipos y jugadores incluidos en el informe, ejecuta:

```bash
node scripts/resetTemporada.mjs
```

El script copiará los datos base desde `scripts/data` a `src/data` sobrescribiendo cualquier cambio previo.
