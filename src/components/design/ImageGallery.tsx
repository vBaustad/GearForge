"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title: string;
  /** Optional overlay content to show at bottom of main image */
  overlayContent?: React.ReactNode;
}

export function ImageGallery({ images, title, overlayContent }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div
        style={{
          aspectRatio: "16/10",
          maxHeight: "520px",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/gearforge_logo_new.png"
          alt=""
          style={{ width: 80, opacity: 0.3 }}
        />
      </div>
    );
  }

  const hasMultiple = images.length > 1;

  const goToPrev = () => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const goToNext = () => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {/* Main Large Image */}
        <div
          style={{
            position: "relative",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            background: "var(--bg-deep)",
          }}
        >
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            style={{
              width: "100%",
              aspectRatio: "16/10",
              maxHeight: "520px",
              objectFit: "cover",
              cursor: "pointer",
            }}
            onClick={() => setShowLightbox(true)}
          />

          {/* Expand button */}
          <button
            onClick={() => setShowLightbox(true)}
            style={{
              position: "absolute",
              top: "var(--space-sm)",
              right: "var(--space-sm)",
              padding: "var(--space-xs)",
              background: "rgba(0,0,0,0.6)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "white",
              cursor: "pointer",
              zIndex: 2,
            }}
            title="View fullscreen"
          >
            <Maximize2 size={16} />
          </button>

          {/* Overlay content (title, stats, etc.) */}
          {overlayContent && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "var(--space-xl) var(--space-lg) var(--space-lg)",
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                zIndex: 1,
              }}
            >
              {overlayContent}
            </div>
          )}

          {/* Navigation arrows on main image */}
          {hasMultiple && (
            <>
              <button
                onClick={goToPrev}
                style={{
                  position: "absolute",
                  left: "var(--space-sm)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "var(--space-sm)",
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  borderRadius: "var(--radius)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goToNext}
                style={{
                  position: "absolute",
                  right: "var(--space-sm)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "var(--space-sm)",
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  borderRadius: "var(--radius)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Small Thumbnail Previews */}
        {hasMultiple && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-xs)",
              overflowX: "auto",
              paddingBottom: "var(--space-xs)",
            }}
          >
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  flexShrink: 0,
                  width: 72,
                  height: 48,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: i === currentIndex ? "2px solid var(--accent)" : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  background: "var(--bg-deep)",
                  opacity: i === currentIndex ? 1 : 0.7,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}
              >
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: "absolute",
              top: "var(--space-lg)",
              right: "var(--space-lg)",
              padding: "var(--space-sm)",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "var(--radius)",
              color: "white",
              cursor: "pointer",
            }}
          >
            <X size={24} />
          </button>

          {/* Navigation */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                style={{
                  position: "absolute",
                  left: "var(--space-lg)",
                  padding: "var(--space-md)",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "var(--radius)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                style={{
                  position: "absolute",
                  right: "var(--space-lg)",
                  padding: "var(--space-md)",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "var(--radius)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Main image */}
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "var(--radius)",
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Thumbnail strip in lightbox */}
          {hasMultiple && (
            <div
              style={{
                position: "absolute",
                bottom: "var(--space-lg)",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "var(--space-xs)",
                padding: "var(--space-sm)",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "var(--radius)",
                maxWidth: "90vw",
                overflowX: "auto",
              }}
            >
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  style={{
                    flexShrink: 0,
                    width: 60,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: i === currentIndex ? "2px solid var(--accent)" : "2px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                    background: "none",
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: i === currentIndex ? 1 : 0.6,
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
