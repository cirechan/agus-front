import { promises as fs } from 'fs';
import path from 'path';

const templateDir = path.join(process.cwd(), 'scripts', 'data');
const dataDir = path.join(process.cwd(), 'src', 'data');

async function reset() {
  await fs.mkdir(dataDir, { recursive: true });
  const files = [
    'temporadas.json',
    'equipos.json',
    'jugadores.json',
    'asistencias.json',
    'valoraciones.json',
    'objetivos.json'
  ];

  for (const file of files) {
    const src = path.join(templateDir, file);
    const dest = path.join(dataDir, file);
    await fs.copyFile(src, dest);
  }

  console.log('Datos de la temporada 25/26 cargados');
}

reset();
