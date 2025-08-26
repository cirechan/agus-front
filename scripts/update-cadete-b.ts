/* eslint-env node */
/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';

interface Args {
  [key: string]: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      result[key] = value;
      i++;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs();
  const expectedPassword = process.env.CADETE_B_PASSWORD || 'secret';

  if (args.password !== expectedPassword) {
    console.error('Incorrect password.');
    process.exit(1);
  }

  if (!args.data) {
    console.error('Missing --data argument.');
    process.exit(1);
  }

  let newData;
  try {
    newData = JSON.parse(args.data);
  } catch (err) {
    console.error('Invalid JSON for --data.');
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), 'public', 'cadete-b.json');
  const currentRaw = await fs.readFile(filePath, 'utf8');
  const current = JSON.parse(currentRaw);

  const updated = { ...current, ...newData };

  await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
  console.log('cadete-b.json updated successfully.');
}

main();
