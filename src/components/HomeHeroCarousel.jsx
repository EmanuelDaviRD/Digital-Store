import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeHeroCarousel.css';

const slides = [
  {
    eyebrow: 'Melhores ofertas personalizadas',
    title: <>Queima de<br />estoque Nike 🔥</>,
    description: 'Consequat culpa exercitation mollit nisi excepteur do tempor laboris eiusmod irure consectetur.',
    image: '/produc-image-5.jpeg',
    imageAlt: 'Tênis esportivo branco com detalhes em laranja',
  },
  {
    eyebrow: 'Estilo para todos os dias',
    title: <>Seu próximo<br />clássico chegou</>,
    description: 'Encontre o par perfeito para completar seu visual com conforto e personalidade.',
    image: '/product-thumb-2.jpeg',
    imageAlt: 'Tênis casual preto e branco',
  },
  {
    eyebrow: 'Conforto em cada passo',
    title: <>Encontre seu<br />novo ritmo</>,
    description: 'Modelos selecionados para acompanhar você nos treinos e na rotina.',
    image: '/produc-image-5.jpeg',
    imageAlt: 'Tênis esportivo branco e laranja',
  },
  {
    eyebrow: 'Novidades na Drip Store',
    title: <>Um novo par,<br />um novo começo</>,
    description: 'Descubra novidades e escolha o modelo que combina com você.',
    image: '/home-slide-1.jpeg',
    imageAlt: 'Tênis esportivo em destaque',
  },
];

export default function HomeHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    if (isPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  return (
    <section
      className="home-hero"
      aria-label="Ofertas em destaque"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="home-hero__inner" aria-live="polite">
        <div className="home-hero__copy">
          <p className="home-hero__eyebrow">{activeSlide.eyebrow}</p>
          <h1 className="home-hero__title">{activeSlide.title}</h1>
          <p className="home-hero__description">{activeSlide.description}</p>
          <Link className="home-hero__cta" to="/products">
            Ver Ofertas
          </Link>
        </div>
        <div className="home-hero__visual">
          <img key={activeSlide.image} src={activeSlide.image} alt={activeSlide.imageAlt} />
          <span className="home-hero__decoration" aria-hidden="true" />
        </div>
      </div>

      <div className="home-hero__pagination" role="group" aria-label="Escolher oferta">
        {slides.map((slide, index) => (
          <button
            key={slide.eyebrow}
            type="button"
            className={`home-hero__dot${index === activeIndex ? ' home-hero__dot--active' : ''}`}
            aria-label={`Mostrar oferta ${index + 1}: ${slide.eyebrow}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
