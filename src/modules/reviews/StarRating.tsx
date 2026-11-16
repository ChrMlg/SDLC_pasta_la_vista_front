import { useEffect, useRef } from 'react';

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  autoFocus?: boolean;
  disabled?: boolean;
};

export function StarRatingInput({ value, onChange, autoFocus = false, disabled = false }: StarRatingInputProps) {
  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (autoFocus) starRefs.current[0]?.focus();
  }, [autoFocus]);

  function moveFocus(current: number, key: string) {
    if (key === 'Home') return 1;
    if (key === 'End') return 5;
    if (key === 'ArrowRight' || key === 'ArrowUp') return Math.min(5, current + 1);
    if (key === 'ArrowLeft' || key === 'ArrowDown') return Math.max(1, current - 1);
    return null;
  }

  return <div className="reviewStarsInput" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        ref={element => { starRefs.current[star - 1] = element; }}
        type="button"
        role="radio"
        aria-checked={value === star}
        aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
        tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
        disabled={disabled}
        onClick={() => onChange(star)}
        onKeyDown={event => {
          const next = moveFocus(star, event.key);
          if (next === null) return;
          event.preventDefault();
          onChange(next);
          starRefs.current[next - 1]?.focus();
        }}
      >
        <span aria-hidden="true">{star <= value ? '★' : '☆'}</span>
      </button>
    ))}
  </div>;
}

export function StarsDisplay({ rating }: { rating: number }) {
  return <span className="reviewStarsDisplay" role="img" aria-label={`${rating} de 5 estrellas`}>
    <span aria-hidden="true">{[1, 2, 3, 4, 5].map(star => star <= rating ? '★' : '☆').join('')}</span>
  </span>;
}
