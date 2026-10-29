import { useState } from 'react';
import './ProductOptions.css';

export default function ProductOptions({ options = [], radius = '4px', shape = 'square', type = 'text', selectedValue, onChange }) {
  const [selected, setSelected] = useState(null);
  const activeValue = selectedValue ?? selected;

  const select = (opt) => {
    setSelected(opt);
    onChange?.(opt);
  };

  return (
    <div className="product-options">
      {options.map((opt) => {
        const isCircle = shape === 'circle';
        const style = {
          borderRadius: isCircle ? '50%' : radius,
          ...(type === 'color' ? { background: opt } : {}),
        };
        return (
          <button
            type="button"
            key={opt}
            className={`product-options__item product-options__item--${shape} product-options__item--${type}${
              activeValue === opt ? ' product-options__item--selected' : ''
            }`}
            style={style}
            onClick={() => select(opt)}
            aria-pressed={activeValue === opt}
            aria-label={type === 'color' ? `Cor ${opt}` : `Opção ${opt}`}
          >
            {type === 'text' ? opt : null}
          </button>
        );
      })}
    </div>
  );
}
