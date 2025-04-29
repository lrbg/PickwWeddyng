import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'public', 'likes.txt');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ message: 'Falta filename' });
  }

  try {
    // Leer archivo de likes
    let likes: Record<string, number> = {};
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, 'utf-8');
      likes = JSON.parse(content || '{}');
    }

    // Incrementar o crear like
    likes[filename] = (likes[filename] || 0) + 1;

    // Guardar archivo
    fs.writeFileSync(FILE_PATH, JSON.stringify(likes, null, 2));

    res.status(200).json({ count: likes[filename] });
  } catch (error) {
    console.error('Error al guardar like:', error);
    res.status(500).json({ message: 'Error interno' });
  }
}
