import { Link } from 'react-router-dom';

export default function InfoGroup({ title, informations = [] }) {
  return (
    <div className="info-group">
      <h4>{title}</h4>
      <ul>
        {informations.map((info) => (
          <li key={info.text}>
            <Link to={info.link}>{info.text}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
