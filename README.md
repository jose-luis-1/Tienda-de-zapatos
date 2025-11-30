Tienda de Zapatos - Proyecto
=============================

Breve descripción
------------------
Pequeña tienda de muestra con catálogo, panel de administración (agregar/editar/eliminar productos), carrito y opción para enviar el pedido por WhatsApp.

Estructura de archivos
----------------------
- `tienda_zapatos.html` - HTML principal (sin estilos ni lógica inline)
- `clean-styles.css` - Estilos centralizados (limpios y consolidados)
- `js/core/index.js` - Código core: estado global (App), persistencia, filtros, utilidades y carga de datos.
- `js/images/index.js` - Módulo de imágenes: uploads (resize), previews, reorder, drag & drop y galería.
- `js/ui/index.js` - UI: renderizado de catálogo, CRUD de productos, carrito, y listeners.

Cambios principales realizados
------------------------------
- Se separó la lógica original en 3 módulos JS (core, images, ui).
- Se añadió soporte para múltiples imágenes por producto (uploads y URL), con previews y miniaturas en la vista Admin.
- Redimensionado automático para imágenes subidas y límite aproximado por imagen (configurable).
- Drag & drop para reordenar imágenes en el Admin, con soporte para seleccionar la imagen principal (thumbnail).
- Galería de producto con navegação por flechas, miniaturas, contador y gestos swipe en mobile.
- Se migró la lógica de `logic.js` a módulos; el archivo original quedó archivado y ya no se carga.

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
- Si deseas mejorar la experiencia del usuario (feedback inline en vez de `alert()`), se usaron toasts. Puedo añadir más UX refinamientos si lo deseas.

