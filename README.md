# Agus Front

## Modo de datos local

El proyecto puede trabajar con datos almacenados en un archivo JSON local. 
El archivo `cadete-b.json` contiene la información de la categoría Cadete B.

1. Copia o crea `cadete-b.json` en la raíz del repositorio.
2. Define `NEXT_PUBLIC_DATA_SOURCE=local` en tu archivo `.env.local`.
3. Instala dependencias con `npm install` y levanta el servidor con `npm run dev`.
4. Abre `http://localhost:3000/dashboard` para utilizar la herramienta de edición y actualizar los datos. Los cambios se guardan automáticamente en `cadete-b.json`.

### Copias de seguridad

- Realiza commits frecuentes del archivo `cadete-b.json` para conservar el historial.
- Alternativamente, sube el JSON a un repositorio privado como respaldo.

## Volver a la API remota

Si el club centraliza nuevamente los datos:

1. Cambia `NEXT_PUBLIC_DATA_SOURCE` a `remote` (o elimina la variable) en `.env.local`.
2. La aplicación dejará de usar `cadete-b.json` y volverá a consultar la API remota.

