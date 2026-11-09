import Link from "next/link";
import styles from "./menu.module.css";

export default function GerenteMenuPage() {
  // Datos reales del menú extraídos del prototipo + 3 adicionales por categoría
  const platillos = [
    // Plato fuerte
    { id: 1, nombre: "Pollo al horno", categoria: "Plato fuerte", precio: 13.25, disponible: true },
    { id: 5, nombre: "Lomo saltado", categoria: "Plato fuerte", precio: 14.50, disponible: true },
    { id: 6, nombre: "Pasta al pesto", categoria: "Plato fuerte", precio: 11.00, disponible: false },
    // Entrada
    { id: 2, nombre: "Ensalada fresca", categoria: "Entrada", precio: 7.25, disponible: true },
    { id: 7, nombre: "Crema de calabaza", categoria: "Entrada", precio: 6.00, disponible: true },
    { id: 8, nombre: "Bruschettas de tomate", categoria: "Entrada", precio: 6.50, disponible: true },
    // Postre
    { id: 3, nombre: "Flan casero", categoria: "Postre", precio: 4.50, disponible: true },
    { id: 9, nombre: "Tarta de limón", categoria: "Postre", precio: 5.00, disponible: true },
    { id: 10, nombre: "Brownie con helado", categoria: "Postre", precio: 5.50, disponible: false },
    // Bebida
    { id: 4, nombre: "Café de la casa", categoria: "Bebida", precio: 2.75, disponible: true },
    { id: 11, nombre: "Limonada con hierbabuena", categoria: "Bebida", precio: 3.25, disponible: true },
    { id: 12, nombre: "Jugo natural de naranja", categoria: "Bebida", precio: 3.00, disponible: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.topRoute}>/management/menu</div>
      
      <div className={styles.headerSection}>
        <span className={styles.tagTop}>H1 + H2 • MANAGER</span>
        <h1 className={styles.mainTitle}>Administrar platillos</h1>
        <p className={styles.subText}>Pantalla individual · Prototipo para diseñar y programar el sitio web</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.catalogTag}>CATÁLOGO</span>
          <h2 className={styles.catalogTitle}>Menú de Centro</h2>
          <p className={styles.catalogSub}>Administración de productos, precios y disponibilidad.</p>
        </div>

        {/* Filtros */}
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Buscar por nombre</label>
            <input type="text" placeholder="Buscar..." className={styles.inputField} />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Categoría</label>
            <select className={styles.selectField}>
              <option value="Todas">Todas</option>
              <option value="Entrada">Entrada</option>
              <option value="Plato fuerte">Plato fuerte</option>
              <option value="Bebida">Bebida</option>
              <option value="Postre">Postre</option>
            </select>
          </div>
        </div>

        <div className={styles.tableControls}>
          <span className={styles.paginationBadge}>12 platillos en total</span>
          <Link href="/gerente/menu/nuevo" className={styles.btnNew}>
            + Nuevo platillo
          </Link>
        </div>

        {/* Tabla de registros */}
        <div className={styles.table}>
          {platillos.map((item) => (
            <div key={item.id} className={styles.tableRow}>
              <div>
                <p className={styles.itemName}>{item.nombre}</p>
                <p className={styles.itemCategory}>{item.categoria}</p>
              </div>
              <div className={styles.itemPrice}>${item.precio.toFixed(2)}</div>
              <div>
                <span className={item.disponible ? styles.badgeAvailable : styles.badgeUnavailable}>
                  {item.disponible ? "Disponible" : "No disponible"}
                </span>
              </div>
              <div className={styles.itemActions}>
                <Link href={`/gerente/menu/${item.id}/editar`} className={styles.actionLink}>
                  Editar
                </Link>
                <span>·</span>
                <Link href={`/gerente/menu/${item.id}/disponibilidad`} className={styles.actionLink}>
                  {item.disponible ? "Desactivar" : "Activar"}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        <div className={styles.footerPagination}>
          <button className={styles.btnPagination} disabled>Anterior</button>
          <span className={styles.pageInfo}>Página 2 de 2</span>
          <button className={styles.btnPagination}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}