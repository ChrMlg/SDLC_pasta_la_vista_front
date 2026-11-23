# Bistro — Pasta a la Vista (Frontend)

Interfaz web del sistema de gestión para restaurantes con sucursales (catálogo, pedidos, cocina, reservaciones, inventario, pagos, lealtad, reseñas, notificaciones y reportes) diseñada para centralizar la operación diaria del restaurante y la atención a clientes.

**Proyecto asignado:** Bistro (Pasta a la Vista)
**Curso:** Ingeniería de Software, UCA, ciclo 02/2026, Sección [01]

## Ambiente desplegado

| Componente | URL |
|---|---|
| Frontend | https://sdlc-pasta-la-vista-front-gray.vercel.app/ | v1.0.0 
            | https://sdlc-pasta-la-vista-front-aniq.vercel.app/ | v1.0.1 
| Documentación de la API (Swagger) | https://practical-transformation-staging.up.railway.app/api/docs |

Los usuarios de prueba se entregan en Moodle, no en este repositorio.

## Integrantes

| Nombre | Carnet | Usuario de GitHub | Módulos o historias principales |
|---|---|---|---|
| Ronald Francisco Rivas Diaz | 00131321 | @RonaldFRDiaz | Módulos 4, 5, 6, 7 y 8 Módulo 4: Reservaciones.  Módulo 5: Inventario  Módulo 6: Mesas y cobros/cierre   Módulo 7: Programa de lealtad / puntos.   Módulo 8: Reseñas |
| Diego Armando Jacobo Cornejo| 00043719 | @DiegoJacob0 | Módulos 1, 2, 3, 9 y 10Módulo 1: Menú y catálogo.   Módulo 2: Pedidos y órdenes.   Módulo 3: Cocina y seguimiento.   Módulo 9: Notificaciones y avisos.   Módulo 10: Reportes y estadísticas. |

## Documentación

Este proyecto cuenta con un repositorio separado para el backend (`https://github.com/ChrMlg/SDLC_pasta_la_vista.git`); la documentación completa del sistema y de la API se encuentra en el repositorio correspondiente al backend, mientras que este repositorio documenta la interfaz frontend desplegada en Vercel.

#Tecnologías del Frontend
Stack: React, TypeScript y Vite (src/main.tsx con AppShell y vistas por rol), con herencia previa de Next.js / create-next-app en el repositorio.

Estilos y red: CSS modular por vista/módulo y cliente centralizado en src/shared/api-client.ts (/api, credentials: 'include', cache: 'no-store').

#Vercel
Proxy y sesión: vite.config.ts solo redirige /api en local, así que se agregó vercel.json para reenviar /api/:path* a [https://practical-transformation-staging.up.railway.app/api/:path](https://practical-transformation-staging.up.railway.app/api/:path)* y evitar bloqueos de cookies/CORS en producción.

Preset y rama: Se desplegó desde main y se cambió manualmente el Application Preset de Next.js a Vite (con salida en dist).

