import { NuevoPlatilloForm } from "./modules/gerente/menu/NuevoPlatilloForm";


export function TestGerenteMenu() {
    const [currentPath, setCurrentPath] = useState('/management/menu');

    return currentPath === '/management/menu/new' ? (
        <NuevoPlatilloForm onNavigate={}
    )
}


**/
export function TestGerenteMenu() {
  const [currentPath, setCurrentPath] = useState('/management/menu');

  return currentPath === '/management/menu/new' ? (
    <NuevoPlatilloForm onNavigate={setCurrentPath} />
  ) : (
    <GerenteMenuApp onNavigate={setCurrentPath} />
  );
}