# D'SEA – simulación  (solo HTML + JS + localStorage)

Abre `Usuario/inicio.html` (o `Administrador/iniciosesionadmin.html`). Recomendado: Chrome o Edge.
Si usas otro navegador y algo no se guarda, sirve la carpeta con `python -m http.server` o Live Server.

## Cuentas de prueba
- Cliente: cliente@dsea.mx / 1234  (tiene un pedido entregado D030 para probar "Calificar")
- Admin:   admin@dsea.mx / admin123
- También puedes registrarte como cliente nuevo.

## Flujo cliente
Menú → producto (personalizar) → carrito → pago (login/crear cuenta si no hay sesión)
→ método de pago (tarjeta demo o al recoger) → horario → comprobante → seguimiento
→ (cuando el admin marca Entregado) calificar.

## Flujo admin
Panel (contadores reales) → Gestión de pedidos (filtros y búsqueda) → Detalle (cambiar estado y Guardar)
→ Administración del menú (agregar, editar, eliminar, marcar Agotado).
El cliente ve el cambio de estado en su seguimiento en ~2 s (abre ambos en pestañas distintas).

## Notas
- `dsea.js` está duplicado en Usuario/ y Administrador/ (idéntico). Si lo editas, cópialo a ambos.
- Para reiniciar los datos de demo: consola del navegador → `DSEA.reset()`.
- Los datos viven solo en el navegador; las contraseñas están en texto plano porque es una simulación.

## Cambios recientes
- Detalle de marquesita/bebidas: el botón "Agregar al carrito" ahora sí agrega (suma extras y cantidad) y muestra el total.
- Calificar: las 5 estrellas se pueden llenar (antes la 5ª quedaba como contorno).
- Menú: se genera desde lo que edita el administrador (nombre, precio, Agotado, productos nuevos y eliminados) y se actualiza solo.
- Lupa del encabezado: busca productos por nombre (sin importar acentos ni mayúsculas); desde otras páginas lleva al menú con el resultado.
- Productos nuevos creados por el admin se agregan al carrito directo desde el menú (sin personalización).
- Si el admin cambia el precio base de Frappe/Smoothie/Chocomil, el cambio se aplica a todos sus sabores.
