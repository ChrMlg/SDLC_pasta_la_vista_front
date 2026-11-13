import React, { useState } from 'react';
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';

export function TestGerenteMenu() {
    const [currentPath, setCurrentPath] = useState('/management/menu');

    return currentPath === '/management/menu/new' ? (
        <
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