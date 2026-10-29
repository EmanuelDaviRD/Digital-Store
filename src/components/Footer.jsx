import Logo from './Logo';
import InfoGroup from './InfoGroup';
import facebook from '../assets/facebook.svg';
import instagram from '../assets/instagram.svg';
import twitter from '../assets/twitter.svg';
import './Footer.css';

const socials = [
  { name: 'Facebook', icon: facebook, href: 'https://facebook.com' },
  { name: 'Instagram', icon: instagram, href: 'https://instagram.com' },
  { name: 'Twitter', icon: twitter, href: 'https://twitter.com' },
];

const company = [
  { text: 'Sobre Drip Store', link: '/about' },
  { text: 'Segurança', link: '/security' },
  { text: 'Wishlist', link: '/wishlist' },
  { text: 'Blog', link: '/blog' },
  { text: 'Trabalhe conosco', link: '/jobs' },
  { text: 'Meus Pedidos', link: '/orders' },
];

const categories = [
  { text: 'Camisetas', link: '/products?filter=camisetas' },
  { text: 'Calças', link: '/products?filter=calcas' },
  { text: 'Bonés', link: '/products?filter=bones' },
  { text: 'Headphones', link: '/products?filter=headphones' },
  { text: 'Tênis', link: '/products?filter=tenis' },
];

const contact = [
  { text: 'Av. Santos Dumont, 1510 - 1 andar - Aldeota, Fortaleza - CE, 60150-161', link: '/contact' },
  { text: '(85) 3051-3411', link: '/contact' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__columns">
          <div className="footer__brand">
            <Logo variant="footer" />
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
            <div className="footer__socials">
              {socials.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.name}>
                  <img src={s.icon} alt="" />
                </a>
              ))}
            </div>
          </div>

          <InfoGroup title="Informação" informations={company} />
          <InfoGroup title="Categorias" informations={categories} />
          <InfoGroup title="Contato" informations={contact} />
        </div>

        <hr />
        <p className="footer__copy">© {new Date().getFullYear()} Digital Store</p>
      </div>
    </footer>
  );
}
