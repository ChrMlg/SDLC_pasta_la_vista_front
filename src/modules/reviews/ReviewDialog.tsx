import { useEffect, useRef, useState, type FormEvent } from 'react';
import { StarRatingInput } from './StarRating';

type ReviewTarget = {
  orderId: string;
  receiptNumber: string;
  branchName: string | null;
};

export function ReviewDialog({ target, submitting, error, fieldError, onClose, onSubmit }: {
  target: ReviewTarget;
  submitting: boolean;
  error: string;
  fieldError: Partial<Record<'rating' | 'comment', string>>;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('[role="radio"]')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submittingRef.current) {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea:not(:disabled)',
        ));
        if (!focusable.length) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(rating, comment);
  }

  return <div className="modalBackdrop reviewModalBackdrop">
    <div className="modal reviewDialog" role="dialog" aria-modal="true"
      aria-labelledby="review-dialog-title" ref={dialogRef}>
      <h2 id="review-dialog-title">Calificar pedido</h2>
      <p className="reviewDialogContext">
        Comprobante {target.receiptNumber} · {target.branchName ?? 'Sucursal'}
      </p>
      <form onSubmit={submit} noValidate>
        <fieldset className="reviewRatingField">
          <legend>Calificación</legend>
          <StarRatingInput value={rating} disabled={submitting} onChange={setRating} />
          {fieldError.rating && <small role="alert">{fieldError.rating}</small>}
        </fieldset>
        <label className="reviewCommentField" htmlFor="review-comment">
          Comentario opcional
          <textarea
            id="review-comment"
            value={comment}
            maxLength={500}
            aria-invalid={Boolean(fieldError.comment)}
            aria-describedby={fieldError.comment ? 'review-comment-error review-comment-count' : 'review-comment-count'}
            disabled={submitting}
            onChange={event => setComment(event.target.value)}
          />
        </label>
        {fieldError.comment && <small id="review-comment-error" role="alert">{fieldError.comment}</small>}
        <p id="review-comment-count" className="reviewCommentCount">{comment.length} / 500</p>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="secondaryButton" disabled={submitting} onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar reseña'}</button>
        </div>
      </form>
    </div>
  </div>;
}
