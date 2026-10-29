import { useState } from 'react';
import arrowLeft from '../assets/arrow-left.svg';
import arrowRight from '../assets/arrow-right.svg';
import './Gallery.css';

const px = (v) => (v === undefined || v === null ? undefined : /^\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : v);

export default function Gallery({ images = [], width, height, radius = '0px', showThumbs = false, className = '' }) {
  const [current, setCurrent] = useState(0);
  const last = images.length - 1;

  return (
    <div className={`gallery ${className}`.trim()} style={{ width: px(width) }}>
      <div className="gallery__viewport" style={{ height: px(height), borderRadius: radius }}>
        <div className="gallery__track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {images.map((img, i) => (
            <div className="gallery__slide" key={img.src + i} aria-hidden={i !== current}>
              <img src={img.src} alt={`Imagem ${i + 1} de ${images.length}`} />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="gallery__arrow gallery__arrow--left"
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          disabled={current === 0}
          aria-label="Imagem anterior"
        >
          <img src={arrowLeft} alt="" />
        </button>
        <button
          type="button"
          className="gallery__arrow gallery__arrow--right"
          onClick={() => setCurrent((c) => Math.min(c + 1, last))}
          disabled={current === last}
          aria-label="Próxima imagem"
        >
          <img src={arrowRight} alt="" />
        </button>
      </div>

      {showThumbs && (
        <div className="gallery__thumbs">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.src + i}
              className={`gallery__thumb${i === current ? ' gallery__thumb--active' : ''}`}
              style={{ borderRadius: radius }}
              onClick={() => setCurrent(i)}
              aria-label={`Ver imagem ${i + 1}`}
              aria-pressed={i === current}
            >
              <img src={img.src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
