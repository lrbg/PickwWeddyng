import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { NextApiRequest, NextApiResponse } from 'next';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
    });

    const response = await s3Client.send(command);

    const seen = new Set<string>();
    const urls: string[] = [];

    for (const obj of response.Contents || []) {
      const name = obj.Key?.split('/').pop(); // solo el nombre del archivo
      if (!name || seen.has(name)) continue;
      seen.add(name);

      urls.push(`https://${process.env.NEXT_PUBLIC_BUCKET}.s3.${process.env.NEXT_PUBLIC_REGION}.amazonaws.com/${obj.Key}`);
    }

    res.status(200).json({ urls });
  } catch (error) {
    console.error('Error listando objetos:', error);
    res.status(500).json({ message: 'Error al listar imágenes' });
  }
}
