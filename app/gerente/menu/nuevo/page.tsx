import Link from "next/link";
import styles from "../menu.module.css";

export default function NuevoPlatilloPage() {
  return (
    <div className={styles.container}>
      <div className={styles.topRoute}>/management/menu/nuevo</div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.catalogTag}>MENÚ · CENTRO</span>
          <h2 className={styles.catalogTitle}>Nuevo platillo</h2>
          <p className={styles.catalogSub}>Los datos se validan antes de guardar.</p>
        </div>

        <form className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre · 2–80 caracteres</label>
            <input type="text" placeholder="Pasta al pesto" className={styles.inputFieldFull} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción · máx. 300</label>
            <textarea placeholder="Descripción del platillo" className={styles.textareaField} rows={3} />
          </div>

          <div className={styles.formRowDouble}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoría</label>
              <select className={styles.selectField}>
                <option value="Plato fuerte">Plato fuerte</option>
                <option value="Entrada">Entrada</option>
                <option value="Bebida">Bebida</option>
                <option value="Postre">Postre</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Precio USD · 0.01–99,999.99</label>
              <input type="number" step="0.01" placeholder="12.50" className={styles.inputFieldFull} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Sucursal autorizada</label>
            <input type="text" value="Centro" disabled className={styles.inputFieldDisabled} />
          </div>

          <div className={styles.formActions}>
            <Link href="/gerente/menu" className={styles.btnCancel}>
              Cancelar
            </Link>
            <button type="submit" className={styles.btnSubmit}>
              Guardar platillo
            </button>
          </div>

          <p className={styles.formFooterNote}>
            Nombre normalizado único por sucursal; cambios auditados con updatedByld. No hay borrado físico de platillos.
          </p>
        </form>
      </div>
    </div>
  );
}