import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ message: 'Faltan parámetros' });
  }

  const bucketName = process.env.AWS_S3_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // 5 minutos

    res.status(200).json({ url: signedUrl });
  } catch (error) {
    console.error('Error generando presigned URL:', error);
    res.status(500).json({ message: 'Error generando presigned URL' });
  }
}
