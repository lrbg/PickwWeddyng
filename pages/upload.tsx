import { useState, useEffect } from 'react';

const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [allImages, setAllImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/list-uploads');
        const data = await res.json();
        setAllImages(data.urls || []);
      } catch (error) {
        console.error('Error obteniendo imágenes:', error);
      }
    };

    fetchImages();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    const previews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleUpload = async () => {
    const newUrls: string[] = [];

    for (const file of selectedFiles) {
      try {
        const fileName = `${Date.now()}-${file.name}`;

        const res = await fetch('/api/generate-presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            fileType: file.type,
          }),
        });

        const { url } = await res.json();

        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        const publicUrl = `https://${process.env.NEXT_PUBLIC_BUCKET}.s3.${process.env.NEXT_PUBLIC_REGION}.amazonaws.com/${fileName}`;
        newUrls.push(publicUrl);
      } catch (error) {
        console.error(`Error al subir ${file.name}:`, error);
      }
    }

    setUploadedUrls((prev) => [...prev, ...newUrls]);
    setAllImages((prev) => [...newUrls, ...prev]);
    alert('¡Todas las fotos fueron subidas!');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Subir Fotos</h1>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {previewUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`preview-${index}`}
            style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8 }}
          />
        ))}
      </div>

      {selectedFiles.length > 0 && (
        <button
          style={{ marginTop: 20, padding: '10px 20px', fontSize: 16 }}
          onClick={handleUpload}
        >
          Subir Fotos
        </button>
      )}

      {allImages.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2>Todas las fotos del álbum:</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {allImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`image-${i}`}
                style={{ width: 150, borderRadius: 8 }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
