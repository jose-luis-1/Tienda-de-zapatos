Tienda de Zapatos - Proyecto
=============================

Breve descripción
------------------
Pequeña tienda de muestra con catálogo, panel de administración (agregar/editar/eliminar productos), carrito y opción para enviar el pedido por WhatsApp.

Estructura de archivos
----------------------
- `tienda_zapatos.html` - HTML principal (sin estilos ni lógica inline)
- `clean-styles.css` - Estilos centralizados (limpios y consolidados)
- `logic.js` - Lógica JS (renderizado del catálogo, manipulación del carrito, almacenamiento en LocalStorage y validación del número de WhatsApp)

Cambios principales realizados
------------------------------
- Se separó el código original en 3 archivos: HTML, CSS y JS.
- Se movieron los `onclick` y `onerror` inline a `logic.js` como listeners y handlers.
- Se añadió un `PLACEHOLDER_SVG` en `logic.js` para usar cuando las imágenes de producto fallan al cargar.
- Se añadió la validación del número de WhatsApp y el botón `Enviar por WhatsApp` se habilita/deshabilita acorde a la validez del número y el estado del carrito.
- Se limpió y consolidó `clean-styles.css`, se añadió fondo con overlay y utilidades CSS.

Cómo probar localmente
----------------------
1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta un servidor estático (Python) para evitar problemas de CORS y habilitar `window.open`:

	powershell.exe -Command "python -m http.server 8000;"

3. Abre tu navegador y visita `http://localhost:8000/tienda_zapatos.html`.

Pruebas rápidas
---------------
- Abre el panel Admin con el botón "🔧 Admin" para agregar productos o guardar un número de WhatsApp.
 - Abre el panel Admin con el botón "🔧 Admin" para agregar productos o guardar un número de WhatsApp.
- Agrega productos al carrito y abre el carrito con el botón "🛒 Carrito".
- Verifica que el botón "Enviar Pedido por WhatsApp" se habilita solo con un número válido y que se abrirá `wa.me` en una nueva pestaña con el mensaje codificado.

- Filtrar catálogo: Usa el panel de filtros (a la izquierda) para seleccionar el género (Masculino, Femenino, Unisex) y la talla. El catálogo mostrará solo productos que coincidan con los filtros.

Notas y recomendaciones
-----------------------
- Si prefieres alojar la imagen de fondo localmente, muévela a una carpeta `assets/` y actualiza `clean-styles.css` con la ruta relativa.
- Si deseas mejorar la experiencia del usuario (feedback inline en vez de `alert()`), puedo implementar mensajes dentro de las modales.

