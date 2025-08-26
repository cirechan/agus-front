# Club San Agustín Frontend

## Actualizar datos de Cadete B

Este proyecto incluye un script para modificar el archivo `public/cadete-b.json`.

```bash
npx ts-node scripts/update-cadete-b.ts --password <CONTRASEÑA> --data '{"coach":"Nuevo entrenador"}'
```

La contraseña por defecto es `secret` y puede cambiarse estableciendo la variable de entorno `CADETE_B_PASSWORD`.
