import type { InventoryItem } from './inventory-api';

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  return <div className="inventoryTableWrap">
    <table className="inventoryTable">
      <thead><tr>
        <th scope="col">Insumo</th>
        <th scope="col">Cantidad actual</th>
        <th scope="col">Unidad</th>
        <th scope="col">Stock mínimo</th>
      </tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <td data-label="Insumo">{item.name}{item.currentStock <= item.minStock
          && <span className="inventoryLowStock">Stock bajo</span>}</td>
        <td data-label="Cantidad actual">{item.currentStock}</td>
        <td data-label="Unidad">{item.unit}</td>
        <td data-label="Stock mínimo">{item.minStock}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
