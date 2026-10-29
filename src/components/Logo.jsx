import { Link } from 'react-router-dom';
import logoHeader from '../assets/logo-header.svg';
import logoFooter from '../assets/logo-footer.svg';

export default function Logo({ variant = 'header' }) {
  const src = variant === 'footer' ? logoFooter : logoHeader;
  return (
    <Link to="/" aria-label="Digital Store - página inicial">
      <img src={src} alt="Digital Store" width={253} height={44} />
    </Link>
  );
}
