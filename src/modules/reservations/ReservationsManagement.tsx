import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import './management-reservations.css';
import {
  managementReservationsApi,
  type ApiError,
  type Branch,
  type ManagedReservation,
  type Occupancy,
  type ReservationStatus,
} from './management-reservations-api';

type ManagementRole = 'MANAGER' | 'GENERAL_MANAGER';

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
};

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function isFuture(reservation: ManagedReservation, timeZone: string): boolean {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  const currentLocalTime = `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
  return `${reservation.date}T${reservation.startTime}` > currentLocalTime;
}

function errorStatus(error: unknown): number | undefined {
  return (error as Partial<ApiError> | null)?.status;
}

function errorCode(error: unknown): string | undefined {
  return (error as Partial<ApiError> | null)?.code;
}

function ReservationsPermissionError() {
  return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
}

export function ReservationsManagement({ role, branchId: sessionBranchId }: {
  role: ManagementRole;
  branchId: string | null;
}) {
  const today = useMemo(() => localDateString(new Date()), []);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesReady, setBranchesReady] = useState(false);
  const [branchesRetry, setBranchesRetry] = useState(0);
  const [branchId, setBranchId] = useState(role === 'MANAGER' ? sessionBranchId ?? '' : '');
  const [date, setDate] = useState(today);
  const [appliedDate, setAppliedDate] = useState(today);
  const [occupancy, setOccupancy] = useState<Occupancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dateError, setDateError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState<ManagedReservation | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);
  const branchName = branches.find(branch => branch.id === branchId)?.name ?? '';

  useEffect(() => {
    if (role !== 'MANAGER' && role !== 'GENERAL_MANAGER') return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    managementReservationsApi.branches(controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setBranches(items);
        if (role === 'GENERAL_MANAGER' && items.length > 0) {
          setBranchId(current => items.some(branch => branch.id === current) ? current : items[0].id);
        } else if (role === 'MANAGER' && sessionBranchId) {
          setBranchId(sessionBranchId);
        }
        setBranchesReady(true);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorStatus(cause) === 401
          ? 'Inicie sesión para continuar.'
          : 'No se pudo cargar la ocupación. Intente de nuevo.');
        setBranchesReady(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [role, sessionBranchId, branchesRetry]);

  useEffect(() => {
    if (!branchesReady || !branchId) {
      if (branchesReady) setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    setDateError('');
    managementReservationsApi.occupancy(branchId, appliedDate, controller.signal)
      .then(result => { if (!controller.signal.aborted) setOccupancy(result); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setOccupancy(null);
        if (errorStatus(cause) === 400 && errorCode(cause) === 'INVALID_FIELD'
          && (cause as Partial<ApiError>).field === 'date') {
          setDateError((cause as Partial<ApiError>).message ?? 'Fecha inválida.');
        } else if (errorStatus(cause) === 404) {
          setLoadError('No tiene acceso a esta sucursal.');
        } else if (errorStatus(cause) === 401) {
          setLoadError('Inicie sesión para continuar.');
        } else {
          setLoadError('No se pudo cargar la ocupación. Intente de nuevo.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [branchesReady, branchId, appliedDate, refresh]);

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

  async function cancelReservation() {
    if (!selected || busyRef.current) return;
    const reservation = selected;
    busyRef.current = true;
    setCancellingId(reservation.id);
    setActionError('');
    setNotice('');
    try {
      await managementReservationsApi.cancel(reservation.id);
      setNotice('Reservación cancelada');
      setSelected(null);
      setRefresh(value => value + 1);
    } catch (cause: unknown) {
      const status = errorStatus(cause);
      const code = errorCode(cause);
      if (status === 400 && code === 'CANCELLATION_DEADLINE_PASSED') {
        setActionError('Solo se puede cancelar con al menos 2 horas de anticipación.');
      } else if (status === 400 && code === 'RESERVATION_ALREADY_CANCELLED') {
        setActionError('La reservación ya estaba cancelada.');
        setSelected(null);
        setRefresh(value => value + 1);
      } else if (status === 403) {
        setActionError('No tiene permiso para cancelar reservaciones.');
        setSelected(null);
      } else if (status === 404) {
        setActionError('No se encontró la reservación.');
        setSelected(null);
        setRefresh(value => value + 1);
      } else if (status === 401) {
        setActionError('Inicie sesión para continuar.');
        setSelected(null);
      } else {
        setActionError('No se pudo cancelar la reservación. Intente de nuevo.');
      }
    } finally {
      busyRef.current = false;
      setCancellingId(null);
    }
  }

  if (role !== 'MANAGER' && role !== 'GENERAL_MANAGER') return <ReservationsPermissionError />;

  return <main className="shell reservationsManagementPage">
    <header className="reservationsManagementHeader">
      <div>
        <span className="eyebrow">RESERVAS</span>
        <h1>Ocupación y reservaciones</h1>
        <p>Consulta la ocupación proyectada y gestiona las reservaciones de la sucursal.</p>
      </div>
    </header>
    <form className="reservationManagementFilters" onSubmit={event => {
      event.preventDefault();
      setNotice('');
      setActionError('');
      setDateError('');
      setAppliedDate(date);
      if (date === appliedDate) setRefresh(value => value + 1);
    }}>
      {role === 'GENERAL_MANAGER'
        ? <label>Sucursal<select value={branchId} disabled={!branchesReady || branches.length === 0 || cancellingId !== null}
          onChange={event => { setBranchId(event.target.value); setNotice(''); setActionError(''); }} required>
          {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select></label>
        : <div className="reservationManagementBranch"><span>Sucursal</span><strong>{branchName || (loading ? 'Cargando…' : 'No disponible')}</strong></div>}
      <label>Fecha<input type="date" value={date} disabled={cancellingId !== null}
        onChange={event => { setDate(event.target.value); setDateError(''); }} required
        aria-invalid={Boolean(dateError)} aria-describedby={dateError ? 'management-date-error' : undefined} />
        {dateError && <small id="management-date-error" className="reservationManagementFieldError" role="alert">{dateError}</small>}
      </label>
      <button type="submit" disabled={loading || cancellingId !== null || !branchId}>
        {loading ? 'Procesando…' : 'Actualizar'}
      </button>
    </form>
    {notice && <p role="status" className="notice">{notice}</p>}
    {actionError && !selected && <p role="alert" className="error">{actionError}</p>}
    {loading && <p role="status">Cargando ocupación…</p>}
    {!loading && loadError && <div>
      <p role="alert" className="error">{loadError}</p>
      {loadError !== 'Inicie sesión para continuar.' && <button type="button"
        onClick={() => {
          if (branches.length === 0) {
            setBranchesReady(false);
            setBranchesRetry(value => value + 1);
          } else {
            setRefresh(value => value + 1);
          }
        }}>Reintentar</button>}
    </div>}
    {!loading && !loadError && occupancy && <>
      <section className="projectedOccupancy" aria-labelledby="projected-occupancy-title">
        <div className="reservationManagementSectionHeading">
          <div><h2 id="projected-occupancy-title">Ocupación proyectada</h2>
            <p>{formatDate(occupancy.date)} <small>Zona horaria: {occupancy.timeZone}</small></p></div>
        </div>
        <div className="occupancySlots">{occupancy.slots.map(slot => {
          const full = occupancy.totalTables > 0 && slot.occupancyPercentage >= 100;
          return <article className={`occupancySlot${full ? ' occupancySlotFull' : ''}`}
            key={`${slot.startTime}-${slot.endTime}`}>
            <div className="occupancySlotHeading">
              <strong>{slot.startTime} – {slot.endTime}</strong>
              <span>{slot.reservedTables} / {occupancy.totalTables} mesas reservadas</span>
            </div>
            <div className="occupancyProgress" role="progressbar"
              aria-label={`Ocupación de ${slot.startTime} a ${slot.endTime}`}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={slot.occupancyPercentage}>
              <span style={{ width: `${slot.occupancyPercentage}%` }} />
            </div>
            <div className="occupancySlotFooter">
              <span>{slot.availableTables} disponibles</span>
              <strong>{slot.occupancyPercentage}%</strong>
            </div>
          </article>;
        })}</div>
      </section>
      <section className="managedReservationsSection" aria-labelledby="managed-reservations-title">
        <h2 id="managed-reservations-title">Reservaciones del día</h2>
        {occupancy.reservations.length === 0
          ? <p className="managedReservationsEmpty">No hay reservaciones para esta fecha.</p>
          : <div className="tableWrap reservationsManagementTableWrap">
            <table><thead><tr><th>Hora</th><th>Mesa</th><th>Personas</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>{occupancy.reservations.map(reservation => <tr key={reservation.id}>
                <td data-label="Hora">{reservation.startTime} a {reservation.endTime}</td>
                <td data-label="Mesa">{reservation.tableNumber}</td>
                <td data-label="Personas">{reservation.partySize}</td>
                <td data-label="Estado"><span className={`statusBadge managedReservationStatus managedReservationStatus${reservation.status}`}>
                  {statusLabels[reservation.status]}</span></td>
                <td data-label="Acciones">{reservation.status !== 'CANCELLED' && isFuture(reservation, occupancy.timeZone)
                  ? <button type="button" className="secondaryButton" disabled={loading || cancellingId !== null}
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                      triggerRef.current = event.currentTarget;
                      setSelected(reservation);
                      setActionError('');
                    }}>{cancellingId === reservation.id ? 'Procesando…' : 'Cancelar'}</button>
                  : '—'}</td>
              </tr>)}</tbody>
            </table>
          </div>}
      </section>
    </>}
    {selected && <div className="modalBackdrop" role="presentation">
      <div className="modal reservationsManagementDialog" role="dialog" aria-modal="true"
        aria-labelledby="cancel-management-reservation-title" ref={dialogRef}>
        <h2 id="cancel-management-reservation-title">¿Cancelar esta reservación?</h2>
        <dl className="managedReservationDetails">
          <div><dt>Fecha</dt><dd>{formatDate(selected.date)}</dd></div>
          <div><dt>Hora</dt><dd>{selected.startTime} a {selected.endTime}</dd></div>
          <div><dt>Mesa</dt><dd>{selected.tableNumber}</dd></div>
          <div><dt>Personas</dt><dd>{selected.partySize}</dd></div>
          <div><dt>Estado</dt><dd>{statusLabels[selected.status]}</dd></div>
        </dl>
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
