import Link from "next/link";
import styles from "../../menu.module.css"

export default function DisponibilidadPage() {
  return (
    <div className={styles.container}>
      <div className={styles.topRoute}>/management/menu/:id/availability</div>

      <div className={styles.headerSection}>
        <span className={styles.tagTop}>H2 · MANAGER</span>
        <h1 className={styles.mainTitle}>Confirmar disponibilidad</h1>
        <p className={styles.subText}>Pantalla individual · Prototipo para diseñar y programar el sitio web</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.catalogTag}>DISPONIBILIDAD</span>
          <h2 className={styles.catalogTitle}>¿Confirmar cambio?</h2>
          <p className={styles.catalogSub}>Cambiarás el estado de disponibilidad del platillo seleccionado.</p>
        </div>

        <div className={styles.availabilityBox}>
          <div className={styles.availabilityRowHeader}>
            <span className={styles.itemName}>Tarta de limón</span>
            <span className={styles.badgeAvailable}>Disponible</span>
          </div>
          <div className={styles.availabilityDetail}>
            <span>Sucursal</span>
            <span className={styles.boldText}>Centro</span>
          </div>
          <div className={styles.availabilityDetail}>
            <span>Nuevo estado</span>
            <span className={styles.boldText}>Disponible</span>
          </div>
        </div>

        <div className={styles.formActions} style={{ marginTop: "24px" }}>
          <Link href="/gerente/menu" className={styles.btnCancel}>
            Cancelar
          </Link>
          <Link href="/gerente/menu" className={styles.btnSubmit}>
            Confirmar cambio
          </Link>
        </div>

        <div className={styles.infoBanner}>
          La opción «Agregar» se desactiva para todos los clientes si el platillo está no disponible. Los cambios no alteran pedidos existentes.
        </div>
      </div>
    </div>
  );
}