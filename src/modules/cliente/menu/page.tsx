"use client";

import { useState } from "react";
import styles from "./menu.module.css";

export default function ClienteMenuPage() {
  const [sucursal, setSucursal] = useState("Centro");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<{ id: number; nombre: string; precio: number }[]>([]);

  const platillos = [
    { id: 1, nombre: "Pasta al pesto", categoria: "Plato fuerte", precio: 12.50, disponible: true },
    { id: 2, nombre: "Bruschettas", categoria: "Entrada", precio: 6.50, disponible: true },
    { id: 3, nombre: "Tarta de limón", categoria: "Postre", precio: 6.00, disponible: false },
    { id: 4, nombre: "Limonada natural", categoria: "Bebida", precio: 5.00, disponible: true },
    { id: 5, nombre: "Pollo al horno", categoria: "Plato fuerte", precio: 13.25, disponible: true },
    { id: 6, nombre: "Ensalada fresca", categoria: "Entrada", precio: 7.25, disponible: true },
    { id: 7, nombre: "Flan casero", categoria: "Postre", precio: 4.50, disponible: true },
    { id: 8, nombre: "Café de la casa", categoria: "Bebida", precio: 2.75, disponible: true },
  ];

  const agregarAlCarrito = (platillo: { id: number; nombre: string; precio: number }) => {
    setCarrito([...carrito, platillo]);
  };

  const platillosFiltrados = platillos.filter((item) => {
    const coincideCategoria = 
      categoriaSeleccionada === "Todas" || 
      (categoriaSeleccionada === "Entradas" && item.categoria === "Entrada") ||
      (categoriaSeleccionada === "Platos fuertes" && item.categoria === "Plato fuerte") ||
      (categoriaSeleccionada === "Postres" && item.categoria === "Postre");

    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  const totalCarrito = carrito.reduce((acc, item) => acc + item.precio, 0);

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <span className={styles.tagTop}>SABORES DE LA CASA</span>
        <h1 className={styles.mainTitle}>Descubre nuestro menú</h1>
        <p className={styles.subText}>Selecciona sucursal, busca platillos y consulta sus reseñas.</p>
      </div>

      <div className={styles.cardList}>
        {/* Filtros superiores */}
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Sucursal</label>
            <select 
              value={sucursal} 
              onChange={(e) => setSucursal(e.target.value)} 
              className={styles.selectField}
            >
              <option value="Centro">Centro</option>
              <option value="Norte">Norte</option>
              <option value="Sur">Sur</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Categoría</label>
            <select 
              value={categoriaSeleccionada} 
              onChange={(e) => setCategoriaSeleccionada(e.target.value)} 
              className={styles.selectField}
            >
              <option value="Todas">Todas</option>
              <option value="Entradas">Entradas</option>
              <option value="Platos fuertes">Platos fuertes</option>
              <option value="Postres">Postres</option>
            </select>
          </div>
        </div>

        {/* Buscador */}
        <div className={styles.searchWrapper}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Buscar por nombre</label>
            <input 
              type="text" 
              placeholder="Buscar platillo..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.inputField} 
            />
          </div>
        </div>

        {/* Pestañas de categoría rápida */}
        <div className={styles.tabsRow}>
          {["Todas", "Entradas", "Platos fuertes", "Postres"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSeleccionada(cat)}
              className={`${styles.tabBtn} ${categoriaSeleccionada === cat ? styles.tabBtnActive : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de platillos */}
        <div>
          {platillosFiltrados.map((item) => (
            <div key={item.id} className={styles.dishRow}>
              <div className={styles.dishInfo}>
                <div className={styles.dishThumb}>
                  <div className={styles.dishThumbInner} />
                </div>
                <div>
                  <p className={styles.dishName}>{item.nombre}</p>
                  <p className={styles.dishCategory}>{item.categoria}</p>
                </div>
              </div>

              <div className={styles.dishRight}>
                <span className={styles.dishPrice}>${item.precio.toFixed(2)}</span>
                {item.disponible ? (
                  <button 
                    onClick={() => agregarAlCarrito(item)}
                    className={styles.btnAdd}
                  >
                    + Añadir
                  </button>
                ) : (
                  <div>
                    <span className={styles.badgeUnavailable}>No disponible</span>
                    <button disabled className={styles.btnDisabled}>Agregar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pie de lista */}
        <div className={styles.listFooter}>
          <span>{platillosFiltrados.length} platillo(s) · muestra</span>
          <button className={styles.btnReviews}>Ver reseñas de la sucursal</button>
        </div>
      </div>

      {/* Barra inferior flotante del Carrito */}
      <div className={styles.cartBar}>
        <div className={styles.cartInfo}>
          Carrito · {carrito.length} artículo(s) · ${totalCarrito.toFixed(2)}
        </div>
        <button 
          onClick={() => alert("¡Pedido enviado con éxito!")} 
          className={styles.btnCartSubmit}
        >
          Ver pedido →
        </button>
      </div>
    </div>
  );
}