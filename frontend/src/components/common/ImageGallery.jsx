import React, { useEffect, useState } from 'react';
import './ImageGallery.css';

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  };

  const currentImage = images[currentIndex];

  return (
    <div className="image-gallery-overlay" onClick={onClose}>
      <div className="image-gallery-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-gallery-header">
          <div className="image-gallery-info">
            <span className="image-gallery-counter">
              {currentIndex + 1} / {images.length}
            </span>
            {currentImage.sender && (
              <span className="image-gallery-sender">{currentImage.sender}</span>
            )}
          </div>
          <button className="image-gallery-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Main Image */}
        <div className="image-gallery-main">
          {images.length > 1 && (
            <button className="image-gallery-nav image-gallery-prev" onClick={handlePrevious}>
              ‹
            </button>
          )}

          <div className={`image-gallery-image-wrapper ${isZoomed ? 'zoomed' : ''}`}>
            <img
              src={currentImage.url}
              alt={currentImage.alt || 'Gallery image'}
              className="image-gallery-image"
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </div>

          {images.length > 1 && (
            <button className="image-gallery-nav image-gallery-next" onClick={handleNext}>
              ›
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="image-gallery-thumbnails">
            {images.map((img, index) => (
              <button
                key={index}
                className={`image-gallery-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
              >
                <img src={img.url} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="image-gallery-actions">
          <button className="image-gallery-action-btn" onClick={() => setIsZoomed(!isZoomed)}>
            {isZoomed ? '🔍−' : '🔍+'}
          </button>
          <a
            href={currentImage.url}
            download
            className="image-gallery-action-btn"
            onClick={(e) => e.stopPropagation()}
          >
            ⬇
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
