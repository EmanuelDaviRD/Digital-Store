import { useId } from 'react';
import './FilterGroup.css';

export default function FilterGroup({ title, inputType = 'checkbox', options = [], selected, onChange }) {
  const group = useId();
  const controlled = Array.isArray(selected);

  return (
    <div className="filter-group">
      <h4 className="filter-group__title">{title}</h4>
      {options.map((opt) => {
        const value = opt.value ?? opt.text;
        return (
          <label className="filter-group__option" key={opt.text}>
            <input
              type={inputType}
              name={group}
              value={value}
              {...(controlled
                ? { checked: selected.includes(value), onChange: (e) => onChange?.(value, e.target.checked) }
                : {})}
            />
            <span>{opt.text}</span>
          </label>
        );
      })}
    </div>
  );
}
