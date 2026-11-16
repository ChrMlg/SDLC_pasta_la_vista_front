import { useEffect, useRef, useState, type FormEvent } from 'react';
import { StarRatingInput } from './StarRating';

type ReviewField = 'rating' | 'comment';

type ReviewDialogProps = {
  orderNumber: string;
  submitting: boolean;
  error: string;
  fieldErrors: Partial<Record<ReviewField, string>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  onClearFieldError: (field: ReviewField) => void;
};

export function ReviewDialog({
  orderNumber,
  submitting,
  error,
  fieldErrors,
  triggerRef,
  onClose,
  onSubmit,
  onClearFieldError,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [validationErrors, setValidationErrors] = useState<Partial<Record<ReviewField, string>>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const submittingRef = useRef(submitting);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);

  useEffect(() => {
    const dialog = dialogRef.current;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submittingRef.current) {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled)',
      )).filter(element => element.tabIndex >= 0);
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
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
    };
  }, [triggerRef]);

  function updateRating(next: number) {
    setRating(next);
    setValidationErrors(current => ({ ...current, rating: undefined }));
    onClearFieldError('rating');
  }

  function updateComment(next: string) {
    setComment(next);
    setValidationErrors(current => ({ ...current, comment: undefined }));
    onClearFieldError('comment');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<ReviewField, string>> = {};
    if (rating < 1 || rating > 5) nextErrors.rating = 'Seleccione una calificación de 1 a 5.';
    if (comment.length > 500) nextErrors.comment = 'El comentario no puede superar 500 caracteres.';
    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSubmit(rating, comment.length ? comment : undefined);
  }

  const ratingError = validationErrors.rating ?? fieldErrors.rating;
  const commentError = validationErrors.comment ?? fieldErrors.comment;

  return <div className="reviewsModalBackdrop">
    <div ref={dialogRef} className="reviewsModal" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
      <h2 id="review-dialog-title">Calificar pedido</h2>
      <p className="reviewsDialogOrder">Comprobante {orderNumber}</p>
      <form className="reviewDialogForm" noValidate onSubmit={submit}>
        <fieldset className="reviewRatingField" aria-describedby={ratingError ? 'review-rating-error' : undefined}>
          <legend>Calificación</legend>
          <StarRatingInput value={rating} onChange={updateRating} autoFocus disabled={submitting} />
          {ratingError && <small id="review-rating-error" className="reviewFieldError">{ratingError}</small>}
        </fieldset>
        <label className="reviewCommentField" htmlFor="review-comment">
          Comentario (opcional)
          <textarea
            id="review-comment"
            value={comment}
            maxLength={500}
            rows={5}
            disabled={submitting}
            aria-invalid={Boolean(commentError)}
            aria-describedby={commentError ? 'review-comment-error review-comment-count' : 'review-comment-count'}
            onChange={event => updateComment(event.target.value)}
          />
          <span id="review-comment-count" className="reviewCharacterCount">{comment.length}/500 caracteres</span>
          {commentError && <small id="review-comment-error" className="reviewFieldError">{commentError}</small>}
        </label>
        {error && <p role="alert" className="reviewSubmitError">{error}</p>}
        <div className="reviewDialogActions">
          <button type="button" className="secondaryButton" disabled={submitting} onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar reseña'}</button>
        </div>
      </form>
    </div>
  </div>;
}
