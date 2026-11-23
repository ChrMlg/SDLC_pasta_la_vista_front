import { useId } from 'react';

export function StarRatingInput({ value, onChange, disabled = false }: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const id = useId();

  function moveFocus(event: React.KeyboardEvent<HTMLButtonElement>, current: number) {
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(5, current + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(1, current - 1);
    else if (event.key === 'Home') next = 1;
    else if (event.key === 'End') next = 5;
    else return;
    event.preventDefault();
    onChange(next);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-rating="${next}"]`)
      ?.focus();
  }

  return <div className="reviewStarInput" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
    {[1, 2, 3, 4, 5].map(rating => <button
      key={rating}
      id={`${id}-${rating}`}
      type="button"
      role="radio"
      aria-checked={value === rating}
      aria-label={`${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`}
      data-rating={rating}
      tabIndex={value === rating || (!value && rating === 1) ? 0 : -1}
      disabled={disabled}
      onClick={() => onChange(rating)}
      onKeyDown={event => moveFocus(event, rating)}
    >{rating <= value ? '★' : '☆'}</button>)}
  </div>;
}

export function StarsDisplay({ rating }: { rating: number }) {
  const clampedRating = Math.max(0, Math.min(5, rating));
  return <span className="reviewStarsDisplay" role="img" aria-label={`${rating} de 5 estrellas`}>
    <span className="reviewStarsVisual" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(star => {
        const fill = Math.max(0, Math.min(1, clampedRating - star + 1)) * 100;
        return <span className="reviewStarGlyph" key={star}
          style={{ backgroundImage: `linear-gradient(90deg, #b77a21 ${fill}%, #d7ddd7 ${fill}%)` }}>★</span>;
      })}
    </span>
  </span>;
}
