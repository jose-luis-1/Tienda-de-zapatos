(function(App){
    // UI: renderizado del catálogo, carrito, panel Admin, modal de producto y escuchas (listeners)

    function renderCatalog(){
        const catalog = document.getElementById('catalog');
        if (!catalog) return;
        if (App.products.length === 0){ catalog.innerHTML = '<div class="empty-message">No hay productos disponibles. Usa el panel Admin para agregar productos.</div>'; return; }
        const filtered = App.products.filter(product => {
            const genderMatch = App.filters.gender === 'all' || (product.gender && product.gender === App.filters.gender);
            const sizeMatch = App.filters.size === 'all' || (product.sizes && product.sizes.includes(Number(App.filters.size)));
            return genderMatch && sizeMatch;
        });
        const resultCountEl = document.getElementById('resultCount');
        if (filtered.length === 0){ catalog.innerHTML = '<div class="empty-message ">No hay productos que coincidan con los filtros.</div>'; if(resultCountEl) resultCountEl.textContent = 'Mostrando 0 productos'; updateActiveFiltersUI(); return; }
        catalog.innerHTML = filtered.map(product => `
            <div class="product-card" data-id="${product.id}">
            <img src="${product.images && product.images.length ? product.images[0] : (product.image ? product.image : App.PLACEHOLDER_SVG)}" alt="${product.name}" class="product-image" data-id="${product.id}">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta text-muted">${product.gender ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1) : ''}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">$${product.price.toLocaleString()}</div>
                    ${product.sizes && product.sizes.length ? `
                        <div class="form-group">
                            <label>Talla:</label>
                            <select class="size-select" data-id="${product.id}">
                                ${product.sizes.map(sz => `<option value="${sz}">${sz}</option>`).join('')}
                            </select>
                        </div>
                    ` : ''}
                    <button class="btn-add-cart" data-id="${product.id}" aria-label="Agregar ${product.name} al carrito">Agregar al Carrito</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.btn-add-cart').forEach(btn => { btn.addEventListener('click', (e) => addToCart(Number(btn.dataset.id), e)); });
        document.querySelectorAll('.product-image').forEach(img => { img.addEventListener('click', (e) => { const id = Number(img.dataset.id); App.openGallery(id,0);} ); });
        document.querySelectorAll('.product-image').forEach(img => { img.addEventListener('error', function(){ this.onerror = null; this.src = App.PLACEHOLDER_SVG; }); });
        if(resultCountEl) resultCountEl.textContent = `Mostrando ${filtered.length} productos`;
        updateActiveFiltersUI();
    }
    App.renderCatalog = renderCatalog;

    function updateActiveFiltersUI(){ const container = document.getElementById('activeFilters'); if(!container) return; container.innerHTML=''; const badges = []; if(App.filters.gender && App.filters.gender !== 'all') badges.push({ text: App.filters.gender.charAt(0).toUpperCase() + App.filters.gender.slice(1), key: 'gender'}); if(App.filters.size && App.filters.size !== 'all') badges.push({ text: 'Talla ' + App.filters.size, key: 'size'}); if(badges.length === 0){ container.innerHTML='<div class="text-muted">Sin filtros</div>'; return;} badges.forEach(b=>{ const span = document.createElement('span'); span.className='badge'; span.textContent = b.text; const clear = document.createElement('span'); clear.className='clear'; clear.textContent='✕'; clear.title = 'Eliminar filtro ' + b.key; clear.addEventListener('click', ()=> { App.filters[b.key] = 'all'; const fg = document.getElementById('filterGender'); const fs = document.getElementById('filterSize'); if(fg) fg.value = App.filters.gender; if(fs) fs.value = App.filters.size; App.saveFilters(); renderCatalog(); }); span.appendChild(clear); container.appendChild(span); }); }
    App.updateActiveFiltersUI = updateActiveFiltersUI;

    function addToCart(productId, event){ const product = App.products.find(p => p.id === productId); const btn = event.target; const card = btn.closest('.product-card'); const sizeSelect = card ? card.querySelector('.size-select') : null; const selectedSize = sizeSelect ? Number(sizeSelect.value) : null; const cartItem = App.cart.find(item => item.id === productId && (item.size || null) === (selectedSize || null)); if(cartItem) cartItem.quantity++; else App.cart.push({...product, size: selectedSize || null, quantity: 1}); App.saveData(); updateCartCount(); const previousText = btn.textContent; btn.textContent='✓ Agregado'; setTimeout(()=> btn.textContent = previousText, 1000); App.showToast(`${product.name}${selectedSize ? ' (Talla: ' + selectedSize + ')' : ''} agregado al carrito`); }
    App.addToCart = addToCart;

    function updateCartCount(){ const count = App.cart.reduce((sum,item)=>sum + item.quantity, 0); const el = document.getElementById('cartCount'); if(el) el.textContent = count; App.updateSendButtonState(); }
    App.updateCartCount = updateCartCount;

    function openAdmin(){ const el = document.getElementById('whatsappNumber'); if(el) el.value = App.whatsappNumber; renderAdminProducts(); document.getElementById('adminModal').style.display = 'block'; }
    App.openAdmin = openAdmin;
    function closeAdmin(){ document.getElementById('adminModal').style.display = 'none'; }
    App.closeAdmin = closeAdmin;

    function saveWhatsApp(){ const input = document.getElementById('whatsappNumber'); const raw = input.value.trim(); const digits = raw.replace(/\D/g, ''); const errorEl = document.getElementById('whatsappError'); if(!App.isValidWhatsAppNumber(digits)){ if(errorEl){ errorEl.textContent = 'Número inválido. Debe incluir el código de país y tener entre 8 y 15 dígitos. Ej: 573001234567'; errorEl.classList.remove('text-success'); errorEl.classList.add('text-error'); } return; } App.whatsappNumber = digits; localStorage.setItem('whatsappNumber', App.whatsappNumber); if(errorEl){ errorEl.textContent='Número guardado correctamente'; errorEl.classList.remove('text-error'); errorEl.classList.add('text-success'); } App.showToast('Número de WhatsApp guardado'); App.updateSendButtonState(); }
    App.saveWhatsApp = saveWhatsApp;

    function renderAdminProducts(){ const container = document.getElementById('adminProducts'); if(!container) return; if(App.products.length === 0){ container.innerHTML = '<div class="empty-message">No hay productos. Agrega el primero.</div>'; return; } container.innerHTML = App.products.map(product => `
            <div class="admin-product">
                <div class="admin-product-info">
                    <strong>${product.name}</strong><br>
                    <span class="text-muted">$${product.price.toLocaleString()} - ${product.gender || 'unisex'} - Tallas: ${product.sizes ? product.sizes.join(',') : 'N/A'}</span>
                    ${product.images && product.images.length ? `<div class="product-images-list">${product.images.map((img, idx) => `<img class="product-thumbnail ${idx===0? 'primary' : ''}" src="${img}" alt="${product.name}" />`).join('')}</div>` : ''}
                </div>
                <div class="admin-product-actions">
                    <button class="btn-edit" data-id="${product.id}">Editar</button>
                    <button class="btn-delete" data-id="${product.id}">Eliminar</button>
                </div>
            </div>
        `).join(''); container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editProduct(Number(btn.dataset.id)))); container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', ()=> deleteProduct(Number(btn.dataset.id)))); }
    App.renderAdminProducts = renderAdminProducts;

    function openProductForm(productId = null){ App.editingProductId = productId; if(productId){ const product = App.products.find(p => p.id === productId); document.getElementById('productModalTitle').textContent = 'Editar Producto'; document.getElementById('productName').value = product.name; document.getElementById('productDescription').value = product.description; document.getElementById('productPrice').value = product.price; const preview = document.getElementById('productImagesPreview'); const urlContainer = document.getElementById('productImagesContainer'); App.editingImages = []; const images = (product.images && product.images.length) ? product.images : (product.image ? [product.image] : []); images.forEach(src => App.editingImages.push(App.createImageEntry(src, src.startsWith('data:')))); if(urlContainer) App.renderURLInputs(urlContainer, App.editingImages); if(preview) App.renderImagePreviews(preview, App.editingImages); document.getElementById('productGender').value = product.gender || 'unisex'; document.getElementById('productSizes').value = product.sizes ? product.sizes.join(',') : ''; } else { document.getElementById('productModalTitle').textContent = 'Agregar Producto'; document.getElementById('productName').value=''; document.getElementById('productDescription').value=''; document.getElementById('productPrice').value=''; const preview=document.getElementById('productImagesPreview'); App.editingImages = []; if(preview) preview.innerHTML=''; const urlContainer = document.getElementById('productImagesContainer'); if(urlContainer) urlContainer.innerHTML=''; document.getElementById('productGender').value='unisex'; document.getElementById('productSizes').value=''; }
        const addImageBtn = document.getElementById('addImageBtn'); const container = document.getElementById('productImagesContainer'); if(addImageBtn && container) addImageBtn.onclick = () => App.addImageInput(container, '', null); const imagesFile = document.getElementById('productImagesFile'); const preview = document.getElementById('productImagesPreview'); if(imagesFile){ imagesFile.value=null; imagesFile.onchange = function(e){ const files = e.target.files; if(!files || files.length === 0) return; App.readFilesToDataURLs(files, (dataUrls) => { dataUrls.forEach(d=>{ if(d){ const size = App.estimateDataURLSizeBytes(d); if(size > App.MAX_IMAGE_BYTES) { App.showToast('Imagen procesada pero sigue siendo grande; será almacenada de todas formas'); } const en = App.createImageEntry(d, true); App.editingImages.push(en); } else { App.showToast('Algunas imágenes no pudieron procesarse'); } }); if(preview) App.renderImagePreviews(preview, App.editingImages); const urlContainer = document.getElementById('productImagesContainer'); if(urlContainer) App.renderURLInputs(urlContainer, App.editingImages); }); } }
        document.getElementById('productModal').style.display='block';
    }
    App.openProductForm = openProductForm;

    function closeProductForm(){ document.getElementById('productModal').style.display='none'; App.editingProductId = null; App.editingImages = []; const preview = document.getElementById('productImagesPreview'); if(preview) preview.innerHTML=''; const fileInput = document.getElementById('productImagesFile'); if(fileInput) fileInput.value=null; const urlContainer = document.getElementById('productImagesContainer'); if(urlContainer) urlContainer.innerHTML=''; }
    App.closeProductForm = closeProductForm;

    function saveProduct(){ const name = document.getElementById('productName').value; const description = document.getElementById('productDescription').value; const price = parseFloat(document.getElementById('productPrice').value); const images = App.getCombinedImageList(); const gender = document.getElementById('productGender') ? document.getElementById('productGender').value : 'unisex'; const sizesRaw = document.getElementById('productSizes') ? document.getElementById('productSizes').value : ''; const sizes = sizesRaw.split(',').map(s => Number(s.trim())).filter(s => !Number.isNaN(s)); if(!name || !price){ App.showToast('Por favor completa los campos obligatorios'); return; } if(App.editingProductId){ const product = App.products.find(p => p.id === App.editingProductId); product.name = name; product.description = description; product.price = price; product.images = images && images.length ? images : []; product.gender = gender || 'unisex'; product.sizes = sizes; } else { const newProduct = { id: Date.now(), name, description, price, images: images && images.length ? images : [], gender: gender || 'unisex', sizes }; App.products.push(newProduct); } App.saveData(); renderCatalog(); renderAdminProducts(); App.populateSizeFilter(); closeProductForm(); App.showToast('Producto guardado correctamente'); }
    App.saveProduct = saveProduct;

    function editProduct(id){ openProductForm(id); }
    App.editProduct = editProduct;
    function deleteProduct(id){ if(confirm('¿Estás seguro de eliminar este producto?')){ App.products = App.products.filter(p => p.id !== id); App.cart = App.cart.filter(item => item.id !== id); App.saveData(); renderCatalog(); renderAdminProducts(); updateCartCount(); App.populateSizeFilter(); App.showToast('Producto eliminado'); } }
    App.deleteProduct = deleteProduct;

    function openCart(){ renderCart(); document.getElementById('cartModal').style.display = 'block'; }
    App.openCart = openCart;
    function closeCart(){ document.getElementById('cartModal').style.display = 'none'; }
    App.closeCart = closeCart;

    function renderCart(){ const container = document.getElementById('cartItems'); if(!container) return; if(App.cart.length === 0){ container.innerHTML = '<div class="empty-message">El carrito está vacío</div>'; return; } const total = App.cart.reduce((sum,item) => sum + (item.price * item.quantity), 0); container.innerHTML = `${App.cart.map(item => `<div class="cart-item"><div class=\"cart-item-info\"><strong>${item.name}</strong><br><span class=\"text-muted\">Cantidad: ${item.quantity} × $${item.price.toLocaleString()} = $${(item.price * item.quantity).toLocaleString()}</span>${item.size ? `<div class=\"text-muted\">Talla: ${item.size}</div>` : ''}</div><button class=\"btn-delete remove-from-cart\" data-id=\"${item.id}\" data-size=\"${item.size || ''}\">Eliminar</button></div>`).join('')}<div class=\"cart-total\">Total: $${total.toLocaleString()}</div><button class=\"btn-whatsapp\" id=\"sendWhatsAppBtn\">📱 Enviar Pedido por WhatsApp</button>`; container.querySelectorAll('.remove-from-cart').forEach(btn => btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.id), btn.dataset.size ? Number(btn.dataset.size) : null))); document.getElementById('sendWhatsAppBtn').addEventListener('click', sendToWhatsApp); App.updateSendButtonState(); }
    App.renderCart = renderCart;

    function removeFromCart(productId, size=null){ App.cart = App.cart.filter(item => { if(size === null) return item.id !== productId || item.size !== null; return !(item.id === productId && item.size === size); }); App.saveData(); updateCartCount(); renderCart(); }
    App.removeFromCart = removeFromCart;

    function sendToWhatsApp(){ if(!App.isValidWhatsAppNumber(App.whatsappNumber)){ App.showToast('Por favor configura el número de WhatsApp en el panel Admin'); return; } if(App.cart.length === 0){ App.showToast('El carrito está vacío'); return; } let message = '¡Hola! Me gustaría hacer el siguiente pedido:\n\n'; let total = 0; App.cart.forEach(item => { const subtotal = item.price * item.quantity; total += subtotal; message += `• ${item.name}${item.size ? ' (Talla: ' + item.size + ')' : ''}\n  Cantidad: ${item.quantity}\n  Precio: $${item.price.toLocaleString()}\n  Subtotal: $${subtotal.toLocaleString()}\n\n`; }); message += `*Total: $${total.toLocaleString()}*\n\n¡Gracias!`; const encodedMessage = encodeURIComponent(message); const whatsappUrl = `https://wa.me/${App.whatsappNumber}?text=${encodedMessage}`; window.open(whatsappUrl, '_blank'); }
    App.sendToWhatsApp = sendToWhatsApp;

    // Adjuntar escuchas (listeners) iniciales
    document.addEventListener('DOMContentLoaded', () => {
        // botones estáticos
        const adminBtn = document.getElementById('openAdminBtn'); if(adminBtn) adminBtn.addEventListener('click', openAdmin);
        const cartBtn = document.getElementById('openCartBtn'); if(cartBtn) cartBtn.addEventListener('click', openCart);
        const saveWhatsAppBtn = document.getElementById('saveWhatsAppBtn'); if(saveWhatsAppBtn) saveWhatsAppBtn.addEventListener('click', saveWhatsApp);
        const whatsappInput = document.getElementById('whatsappNumber'); if(whatsappInput) whatsappInput.addEventListener('input', (e) => { const digits = e.target.value.replace(/\D/g, ''); const errorEl = document.getElementById('whatsappError'); if(!App.isValidWhatsAppNumber(digits)){ if(errorEl){ errorEl.textContent='Número inválido'; errorEl.classList.remove('text-success'); errorEl.classList.add('text-error'); }} else { if(errorEl){ errorEl.textContent=''; errorEl.classList.remove('text-error'); } } });
        const openProductFormBtn = document.getElementById('openProductFormBtn'); if(openProductFormBtn) openProductFormBtn.addEventListener('click', () => openProductForm());
        const closeAdminBtn = document.getElementById('closeAdminBtn'); if(closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdmin);
        const cancelProductBtn = document.getElementById('cancelProductBtn'); if(cancelProductBtn) cancelProductBtn.addEventListener('click', closeProductForm);
        const saveProductBtn = document.getElementById('saveProductBtn'); if(saveProductBtn) saveProductBtn.addEventListener('click', () => App.saveProduct());
        const closeCartBtn = document.getElementById('closeCartBtn'); if(closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
        const filterGender = document.getElementById('filterGender'); if(filterGender) filterGender.addEventListener('change', (e) => { App.filters.gender = e.target.value; App.saveFilters(); renderCatalog(); updateActiveFiltersUI(); });
        const filterSize = document.getElementById('filterSize'); if(filterSize) filterSize.addEventListener('change', (e) => { App.filters.size = e.target.value; App.saveFilters(); renderCatalog(); updateActiveFiltersUI(); });
        const clearFiltersBtn = document.getElementById('clearFiltersBtn'); if(clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => { App.filters.gender='all'; App.filters.size='all'; const fg = document.getElementById('filterGender'); const fs = document.getElementById('filterSize'); if(fg) fg.value='all'; if(fs) fs.value='all'; App.saveFilters(); renderCatalog(); updateActiveFiltersUI(); });

        // Iniciar la aplicación después de que los módulos estén listos
        if(App.init) App.init();
        // finalizar renderizado
        renderCatalog();
        App.populateSizeFilter();
        updateActiveFiltersUI();
        updateCartCount();

        // Asegurar que el botón 'Agregar imagen' esté conectado
        const initialAddImageBtn = document.getElementById('addImageBtn'); const container = document.getElementById('productImagesContainer'); if(initialAddImageBtn && container) initialAddImageBtn.addEventListener('click', () => App.addImageInput(container, '', null));

        // El comportamiento del clic en el overlay del modal ahora delega a App.closeGallery de forma apropiada
        document.addEventListener('click', (e) => { if(e.target.classList.contains('modal')) { if(e.target.id === 'galleryModal') App.closeGallery(); else e.target.style.display='none'; } });
    });

})(window.App || (window.App = {}));
