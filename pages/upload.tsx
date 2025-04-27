import { useState } from "react";

const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    const previews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleUpload = async () => {
    for (const file of selectedFiles) {
      try {
        // 1. Solicitar presigned URL al backend
        const response = await fetch('/api/generate-presigned-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: `${Date.now()}-${file.name}`,
            fileType: file.type,
          }),
        });
  
        const { url } = await response.json();
  
        // 2. Subir la imagen directamente a S3
        await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });
  
        console.log(`✅ Foto ${file.name} subida correctamente`);
  
      } catch (error) {
        console.error(`❌ Error subiendo ${file.name}:`, error);
      }
    }
    
    alert('¡Todas las fotos fueron subidas!');
  };
  

  return (
    <div style={{ padding: "20px" }}>
      <h1>Subir Fotos</h1>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {previewUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`preview-${index}`}
            style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px" }}
          />
        ))}
      </div>

      {selectedFiles.length > 0 && (
        <button
          style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
          onClick={handleUpload}
        >
          Subir Fotos
        </button>
      )}
    </div>
  );
};

export default UploadPage;
