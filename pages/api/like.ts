import type { NextApiRequest, NextApiResponse } from 'next';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const FILE_KEY = 'likes.txt';

function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ message: 'Falta filename' });
  }

  try {
    // Leer likes.txt desde S3
    let likes: Record<string, number> = {};

    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET,
        Key: FILE_KEY,
      });

      const response = await s3.send(getCommand);
      const content = await streamToString(response.Body as Readable);
      likes = JSON.parse(content || '{}');
    } catch (err) {
      console.log('likes.txt no encontrado, se creará uno nuevo');
    }

    // Incrementar
    likes[filename] = (likes[filename] || 0) + 1;

    // Guardar actualizado
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: FILE_KEY,
      Body: JSON.stringify(likes, null, 2),
      ContentType: 'application/json',
    });

    await s3.send(putCommand);

    res.status(200).json({ count: likes[filename] });
  } catch (error) {
    console.error('Error S3:', error);
    res.status(500).json({ message: 'Error al guardar like' });
  }
}
