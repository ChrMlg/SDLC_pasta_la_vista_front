import { useEffect, useMemo, useState, type FormEvent } from 'react';
import './reservations.css';
import { reservationsApi, type ApiError, type Branch, type Reservation, type ReservationAvailability } from './reservations-api';

type FieldErrors = Partial<Record<'branchId' | 'date' | 'partySize' | 'time', string>>;

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function errorStatus(error: unknown): number | undefined {
  return (error as Partial<ApiError> | null)?.status;
}

function ReservationPermissionError() {
  return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
}

export function ReservationNew() {
  const today = useMemo(() => localDateString(new Date()), []);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(today);
  const [partySize, setPartySize] = useState('2');
  const [availability, setAvailability] = useState<ReservationAvailability | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [branchesError, setBranchesError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState<Reservation | null>(null);
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });

  useEffect(() => {
    const controller = new AbortController();
    reservationsApi.branches(controller.signal)
      .then(setBranches)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const status = errorStatus(cause);
        if (status === 401 || status === 403) setBranchesError('No tiene permiso para ver esta pantalla.');
        else setBranchesError('No se pudieron cargar las sucursales.');
      })
      .finally(() => { if (!controller.signal.aborted) setBranchesLoading(false); });
    return () => controller.abort();
  }, []);

  const partySizeNumber = Number(partySize);
  const partySizeValid = /^\d+$/.test(partySize) && Number.isInteger(partySizeNumber)
    && partySizeNumber >= 1 && partySizeNumber <= 2147483647;
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= today;

  useEffect(() => {
    setAvailability(null);
    setSelectedTime('');
    setAvailabilityError('');
    setFieldErrors({});
    setSuccess(null);
    setSubmitError('');
    setAvailabilityLoading(false);
    if (!branchId || !dateValid || !partySizeValid) return;

    const controller = new AbortController();
    setAvailabilityLoading(true);
    reservationsApi.availability(branchId, date, partySizeNumber, controller.signal)
      .then(setAvailability)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = cause as ApiError;
        if (apiError.status === 401 || apiError.status === 403) {
          setAvailabilityError('No tiene permiso para ver esta pantalla.');
        } else if (apiError.status === 400 && apiError.field) {
          setFieldErrors({ [apiError.field]: apiError.message });
        } else if (apiError.status === 404) {
          setFieldErrors({ branchId: apiError.message });
        } else {
          setAvailabilityError('No se pudieron cargar los horarios. Intente de nuevo.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setAvailabilityLoading(false); });
    return () => controller.abort();
  }, [branchId, date, dateValid, partySizeNumber, partySizeValid, availabilityRefresh]);

  const monthYear = calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const monthStartOffset = (calendarMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: monthStartOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function chooseDate(value: string) {
    setDate(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const selectedDate = parseLocalDate(value);
      setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }

  function updateSelection(field: 'branchId' | 'date' | 'partySize', value: string) {
    setFieldErrors(errors => ({ ...errors, [field]: undefined }));
    setSelectedTime('');
    setAvailability(null);
    setAvailabilityError('');
    setSubmitError('');
    setSuccess(null);
    if (field === 'branchId') setBranchId(value);
    if (field === 'date') chooseDate(value);
    if (field === 'partySize') setPartySize(value);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError('');
    setSuccess(null);
    const errors: FieldErrors = {};
    if (!branchId) errors.branchId = 'Seleccione una sucursal.';
    if (!dateValid) errors.date = 'Seleccione una fecha válida que no esté en el pasado.';
    if (!partySizeValid) errors.partySize = 'Indique un número entero de personas mayor o igual a 1.';
    if (!selectedTime || !availability?.slots.some(slot => slot.time === selectedTime && slot.available))
      errors.time = 'Seleccione un horario disponible.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await reservationsApi.create({ branchId, date, time: selectedTime, partySize: partySizeNumber });
      setSuccess(reservation);
    } catch (cause) {
      const apiError = cause as ApiError;
      if (apiError.status === 409) {
        setSubmitError('Ese horario ya no está disponible. Elige otra franja.');
        setSelectedTime('');
        setAvailabilityRefresh(value => value + 1);
      } else if (apiError.status === 400 && apiError.field) {
        setFieldErrors({ [apiError.field]: apiError.message });
      } else if (apiError.status === 404) {
        setFieldErrors({ branchId: apiError.message });
      } else if (apiError.status === 401 || apiError.status === 403) {
        setSubmitError('No tiene permiso para ver esta pantalla.');
      } else {
        setSubmitError('No se pudo registrar la reservación. Intente de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (branchesError === 'No tiene permiso para ver esta pantalla.'
    || availabilityError === 'No tiene permiso para ver esta pantalla.') {
    return <ReservationPermissionError />;
  }

  return <main className="shell reservationPage">
    <header className="reservationHeader">
      <div><span className="eyebrow">RESERVAS</span><h1>Reserva tu mesa</h1>
        <p>Elige la sucursal, la fecha y una franja disponible.</p></div>
    </header>

    {branchesError && <p role="alert" className="error">{branchesError}</p>}
    <form className="reservationForm" noValidate onSubmit={submit}>
      <label htmlFor="reservation-branch">Sucursal
        <select id="reservation-branch" value={branchId} disabled={branchesLoading}
          aria-invalid={Boolean(fieldErrors.branchId)} aria-describedby={fieldErrors.branchId ? 'reservation-branch-error' : undefined}
          onChange={event => updateSelection('branchId', event.target.value)}>
          <option value="">{branchesLoading ? 'Cargando…' : 'Selecciona una sucursal'}</option>
          {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
      </label>
      {fieldErrors.branchId && <small id="reservation-branch-error" className="reservationFieldError" role="alert">{fieldErrors.branchId}</small>}

      <label htmlFor="reservation-party-size">Personas
        <input id="reservation-party-size" type="number" min="1" max="2147483647" step="1" inputMode="numeric"
          value={partySize} aria-invalid={Boolean(fieldErrors.partySize)}
          aria-describedby={fieldErrors.partySize ? 'reservation-party-size-error' : undefined}
          onChange={event => updateSelection('partySize', event.target.value)} />
      </label>
      {fieldErrors.partySize && <small id="reservation-party-size-error" className="reservationFieldError" role="alert">{fieldErrors.partySize}</small>}

      <section className="reservationDateSection" aria-labelledby="reservation-calendar-title">
        <div className="reservationCalendarHeader">
          <h2 id="reservation-calendar-title">Fecha</h2>
          <div className="reservationCalendarNav">
            <button type="button" className="secondaryButton" aria-label="Mes anterior"
              onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
            <strong aria-live="polite">{monthYear}</strong>
            <button type="button" className="secondaryButton" aria-label="Mes siguiente"
              onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
          </div>
        </div>
        <div className="reservationCalendar" role="group" aria-label={`Calendario de ${monthYear}`}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => <span className="reservationWeekday" key={`${day}-${index}`} aria-hidden="true">{day}</span>)}
          {calendarDays.map((day, index) => {
            if (day === null) return <span className="reservationCalendarEmpty" key={`empty-${index}`} aria-hidden="true" />;
            const calendarDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
            const dateValue = localDateString(calendarDate);
            const isPast = dateValue < today;
            const isSelected = dateValue === date;
            return <button type="button" key={dateValue} className={`reservationCalendarDay${isSelected ? ' selected' : ''}`}
              disabled={isPast} aria-pressed={isSelected} aria-label={calendarDate.toLocaleDateString('es-MX', { dateStyle: 'full' })}
              onClick={() => updateSelection('date', dateValue)}>{day}</button>;
          })}
        </div>
        <label htmlFor="reservation-date">O selecciona otra fecha
          <input id="reservation-date" type="date" min={today} value={date}
            aria-invalid={Boolean(fieldErrors.date)} aria-describedby={fieldErrors.date ? 'reservation-date-error' : undefined}
            onChange={event => updateSelection('date', event.target.value)} />
        </label>
        {fieldErrors.date && <small id="reservation-date-error" className="reservationFieldError" role="alert">{fieldErrors.date}</small>}
      </section>

      <section className="reservationSlotsSection" aria-labelledby="reservation-slots-title">
        <div className="reservationSectionHeading">
          <h2 id="reservation-slots-title">Horarios disponibles · bloques de 1 hora</h2>
          {availability?.timeZone && <small>Zona horaria: {availability.timeZone}</small>}
        </div>
        {availabilityLoading && <p role="status">Cargando…</p>}
        {availabilityError && <p role="alert" className="error">{availabilityError}</p>}
        {fieldErrors.time && <p role="alert" className="reservationFieldError">{fieldErrors.time}</p>}
        {!availabilityLoading && availability && availability.slots.length === 0 && <p>No hay horarios disponibles para esta fecha.</p>}
        {!availabilityLoading && availability && availability.slots.length > 0 && <div className="reservationSlots">
          {availability.slots.map(slot => <button type="button" key={slot.time}
            className={`reservationSlot${selectedTime === slot.time ? ' selected' : ''}`}
            disabled={!slot.available} aria-pressed={selectedTime === slot.time}
            onClick={() => { setSelectedTime(slot.time); setFieldErrors(errors => ({ ...errors, time: undefined })); setSubmitError(''); setSuccess(null); }}>
            {slot.time}
          </button>)}
        </div>}
      </section>

      <p className="notice reservationNotice">Duración de la reserva: 90 minutos. No se admiten fechas pasadas, horarios fuera de atención o mesas duplicadas.</p>
      {submitError && <p role="alert" className="error">{submitError}</p>}
      {success && <div role="status" className="notice reservationSuccess">
        <strong>Reservación confirmada</strong>
        <p>{success.branchName} · {parseLocalDate(success.date).toLocaleDateString('es-MX')} · {success.startTime} · Mesa {success.tableNumber} · {success.partySize} personas</p>
      </div>}
      <button className="reservationSubmit" type="submit"
        disabled={submitting || branchesLoading || !branchId || !dateValid || !partySizeValid || !selectedTime
          || !availability?.slots.some(slot => slot.time === selectedTime && slot.available)}>
        {submitting ? 'Procesando…' : 'Confirmar reservación'}
      </button>
    </form>
  </main>;
}
