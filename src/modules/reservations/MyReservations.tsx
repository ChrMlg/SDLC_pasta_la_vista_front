import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import './my-reservations.css';
import { myReservationsApi, type ApiError, type CustomerReservation } from './my-reservations-api';

const statusLabels: Record<CustomerReservation['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
};

function isUpcoming(reservation: CustomerReservation): boolean {
  if (reservation.status === 'CANCELLED') return false;
  const [year, month, day] = reservation.date.split('-').map(Number);
  const [hours, minutes] = reservation.startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).getTime() > Date.now();
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function errorStatus(error: unknown): number | undefined {
  return (error as Partial<ApiError> | null)?.status;
}

function errorCode(error: unknown): string | undefined {
  return (error as Partial<ApiError> | null)?.code;
}

function MyReservationsPermissionError() {
  return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
}

export function MyReservations({ role }: { role: string }) {
  const [reservations, setReservations] = useState<CustomerReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState<CustomerReservation | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!selected) return;
    const dialog = dialogRef.current;
    const previous = triggerRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        setSelected(null);
      }
      if (event.key === 'Tab' && dialog) {
        const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        if (!buttons.length) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons[buttons.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
          event.preventDefault();
          buttons[0].focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [selected]);

  useEffect(() => {
    if (role !== 'CUSTOMER') {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    myReservationsApi.list(controller.signal)
      .then(data => { if (!controller.signal.aborted) setReservations(data); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorStatus(cause) === 401
          ? 'Inicie sesión para ver sus reservaciones.'
          : 'No se pudieron cargar las reservaciones. Intente de nuevo.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh, role]);

  async function cancelReservation() {
    if (!selected || busyRef.current) return;
    const reservation = selected;
    busyRef.current = true;
    setCancellingId(reservation.id);
    setActionError('');
    setNotice('');
    try {
      const updatedReservation = await myReservationsApi.cancel(reservation.id);
      setReservations(current => current.map(item => item.id === reservation.id
        ? { ...item, ...updatedReservation }
        : item));
      setNotice('Reservación cancelada');
      setSelected(null);
    } catch (cause: unknown) {
      const status = errorStatus(cause);
      const code = errorCode(cause);
      if (status === 400 && code === 'CANCELLATION_DEADLINE_PASSED') {
        setActionError('Solo puedes cancelar con al menos 2 horas de anticipación.');
      } else if (status === 400 && code === 'RESERVATION_ALREADY_CANCELLED') {
        setActionError('La reservación ya estaba cancelada.');
        setSelected(null);
        setRefresh(value => value + 1);
      } else if (status === 403) {
        setActionError('No puedes cancelar esta reservación.');
        setSelected(null);
        setRefresh(value => value + 1);
      } else if (status === 404) {
        setActionError('No se encontró la reservación.');
        setSelected(null);
        setRefresh(value => value + 1);
      } else if (status === 401) {
        setActionError('Inicie sesión para ver sus reservaciones.');
        setSelected(null);
      } else {
        setActionError('No se pudo cancelar la reservación. Intente de nuevo.');
      }
    } finally {
      busyRef.current = false;
      setCancellingId(null);
    }
  }

  if (role !== 'CUSTOMER') return <MyReservationsPermissionError />;

  const upcoming = reservations.filter(isUpcoming);
  const history = reservations.filter(reservation => !isUpcoming(reservation));

  return <main className="shell myReservationsPage">
    <header className="myReservationsHeader">
      <div>
        <span className="eyebrow">RESERVAS</span>
        <h1>Mis reservaciones</h1>
        <p>Consulta tus reservaciones y cancela las que ya no necesites.</p>
      </div>
      <Link to="/reservations/new">Reservar mesa</Link>
    </header>
    {notice && <p role="status" className="notice">{notice}</p>}
    {actionError && !selected && <p role="alert" className="error">{actionError}</p>}
    {loading && <p role="status">Cargando reservaciones…</p>}
    {!loading && loadError && <div>
      <p role="alert" className="error">{loadError}</p>
      {loadError !== 'Inicie sesión para ver sus reservaciones.'
        && <button type="button" onClick={() => setRefresh(value => value + 1)}>Reintentar</button>}
    </div>}
    {!loading && !loadError && reservations.length === 0 && <section className="myReservationsEmpty">
      <p>Aún no tienes reservaciones.</p>
      <Link to="/reservations/new">Reservar una mesa</Link>
    </section>}
    {!loading && !loadError && reservations.length > 0 && <>
      <section className="myReservationSection" aria-labelledby="upcoming-reservations-title">
        <h2 id="upcoming-reservations-title">Próximas</h2>
        {upcoming.length === 0
          ? <p className="myReservationsSectionEmpty">No tienes reservaciones próximas.</p>
          : <div className="myReservationCards">{upcoming.map(reservation =>
            <ReservationCard key={reservation.id} reservation={reservation}
              cancelling={cancellingId !== null}
              onCancel={event => {
                triggerRef.current = event.currentTarget;
                setSelected(reservation);
                setActionError('');
              }} />)}</div>}
      </section>
      <section className="myReservationSection" aria-labelledby="reservation-history-title">
        <h2 id="reservation-history-title">Historial</h2>
        {history.length === 0
          ? <p className="myReservationsSectionEmpty">Aún no tienes historial.</p>
          : <div className="myReservationCards">{history.map(reservation =>
            <ReservationCard key={reservation.id} reservation={reservation} />)}</div>}
      </section>
    </>}
    {selected && <div className="modalBackdrop" role="presentation">
      <div className="modal myReservationDialog" role="dialog" aria-modal="true"
        aria-labelledby="cancel-reservation-title" ref={dialogRef}>
        <h2 id="cancel-reservation-title">¿Cancelar esta reservación?</h2>
        <ReservationDetails reservation={selected} />
        {actionError && <p role="alert" className="error">{actionError}</p>}
        <div className="actions">
          <button type="button" className="secondaryButton" disabled={cancellingId !== null}
            onClick={() => setSelected(null)}>Volver</button>
          <button type="button" disabled={cancellingId !== null} onClick={cancelReservation}>
            {cancellingId === selected.id ? 'Procesando…' : 'Cancelar reservación'}
          </button>
        </div>
      </div>
    </div>}
  </main>;
}

function ReservationDetails({ reservation }: { reservation: CustomerReservation }) {
  return <dl className="myReservationDetails">
    <div><dt>Sucursal</dt><dd>{reservation.branchName}</dd></div>
    <div><dt>Fecha</dt><dd>{formatDate(reservation.date)}</dd></div>
    <div><dt>Hora</dt><dd>{reservation.startTime} a {reservation.endTime}</dd></div>
    <div><dt>Mesa</dt><dd>{reservation.tableNumber}</dd></div>
    <div><dt>Personas</dt><dd>{reservation.partySize}</dd></div>
  </dl>;
}

function ReservationCard({ reservation, cancelling = false, onCancel }: {
  reservation: CustomerReservation;
  cancelling?: boolean;
  onCancel?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return <article className="card myReservationCard">
    <div className="myReservationCardHeading">
      <h3>{reservation.branchName}</h3>
      <span className={`statusBadge reservationStatus reservationStatus${reservation.status}`}>
        {statusLabels[reservation.status]}
      </span>
    </div>
    <ReservationDetails reservation={reservation} />
    {onCancel && <button type="button" disabled={cancelling} onClick={onCancel}>
      {cancelling ? 'Procesando…' : 'Cancelar reservación'}
    </button>}
  </article>;
}
