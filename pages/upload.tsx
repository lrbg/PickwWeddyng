import { useEffect, useState } from 'react';

type ImageItem = {
  url: string;
  filename: string;
  likes: number;
};

const ITEMS_PER_PAGE = 12;

const UploadPage = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Obtener imágenes + likes
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/list-uploads');
      const data = await res.json();

      const filenames = data.urls.map((url: string) => url.split('/').pop());
      const likeRes = await fetch('/likes.txt');
      const likeData = await likeRes.text();
      const parsedLikes = likeData ? JSON.parse(likeData) : {};

      const items: ImageItem[] = data.urls.map((url: string, index: number) => ({
        url,
        filename: filenames[index],
        likes: parsedLikes[filenames[index]] || 0,
      }));

      setImages(items);
    };

    load();
  }, []);

  const handleLike = async (indexInPage: number) => {
    const globalIndex = currentPage * ITEMS_PER_PAGE + indexInPage;
    const filename = paginatedImages[indexInPage].filename;

    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });

    const data = await res.json();
    const updated = [...images];
    updated[globalIndex].likes = data.count;
    setImages(updated);
  };

  const paginatedImages = images.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#f5f5f5' }}>
      <div style={{
        maxWidth: 900,
        margin: 'auto',
        background: 'white',
        padding: 30,
        borderRadius: 12,
        boxShadow: '0 0 20px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ textAlign: 'center' }}>📸 Álbum de Fotos</h1>

        <div style={{
          marginTop: 40,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 15
        }}>
          {paginatedImages.map((img, i) => (
            <div key={img.filename} style={{ textAlign: 'center' }}>
              <img
                src={img.url}
                alt=""
                style={{
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 8,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => setLightboxIndex(currentPage * ITEMS_PER_PAGE + i)}
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6 }}>
                <button
                  onClick={() => handleLike(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 24,
                    cursor: 'pointer',
                    transform: 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  ❤️
                </button>
                <span>{img.likes}</span>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 30
          }}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              style={{ padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}
            >
              ⬅️ Anterior
            </button>
            <span>Página {currentPage + 1} de {totalPages}</span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              style={{ padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}
            >
              Siguiente ➡️
            </button>
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <span
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 30,
              fontSize: 30,
              color: 'white',
              cursor: 'pointer'
            }}
          >
            &times;
          </span>

          <span onClick={prevImage} style={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 40,
            color: 'white',
            cursor: 'pointer'
          }}>&#10094;</span>

          <img
            src={images[lightboxIndex].url}
            alt=""
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 10,
              boxShadow: '0 0 20px rgba(0,0,0,0.4)'
            }}
          />

          <span onClick={nextImage} style={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 40,
            color: 'white',
            cursor: 'pointer'
          }}>&#10095;</span>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
