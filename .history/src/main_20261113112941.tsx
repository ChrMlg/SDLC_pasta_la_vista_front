

export function TestGerenteMenu() {
    const [currentPath, setCurrentPath] = useState('/management/menu');

    return currentPath === '/management/menu/new' ? (
        <NuevoPlatilloForm</NuevoPlatilloForm>
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