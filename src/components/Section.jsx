import { Link } from 'react-router-dom';
import './Section.css';

export default function Section({ title, titleAlign = 'left', link, children }) {
  const isExternal = link && /^https?:\/\//.test(link.href);
  return (
    <section className="section">
      <div className={`section__header section__header--${titleAlign}`}>
        <h2 className="section__title">{title}</h2>
        {link &&
          (isExternal ? (
            <a className="section__link" href={link.href}>{link.text}</a>
          ) : (
            <Link className="section__link" to={link.href}>{link.text}</Link>
          ))}
      </div>
      {children}
    </section>
  );
}
