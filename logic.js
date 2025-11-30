document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let cart = [];
    let editingProductId = null;
    let whatsappNumber = '';
    let filters = { gender: 'all', size: 'all' };

    // Placeholder image (SVG) base64 encoded as data URI
    const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%239ca3af%22%3ESin imagen%3C/text%3E%3C/svg%3E";

    // Helper: save to localStorage
    function saveData() {
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function saveFilters() {
        localStorage.setItem('filters', JSON.stringify(filters));
    }

    function loadFilters() {
        const saved = localStorage.getItem('filters');
        if (saved) {
            try { filters = JSON.parse(saved); } catch (e) { filters = { gender: 'all', size: 'all' }; }
        }
        // update UI selects
        const fg = document.getElementById('filterGender');
        const fs = document.getElementById('filterSize');
        if (fg) fg.value = filters.gender || 'all';
        if (fs) fs.value = filters.size || 'all';
    }

    // Cargar datos
    function loadData() {
        const savedProducts = localStorage.getItem('products');
        const savedCart = localStorage.getItem('cart');
        const savedWhatsApp = localStorage.getItem('whatsappNumber');

        if (savedProducts) products = JSON.parse(savedProducts);
        if (savedCart) cart = JSON.parse(savedCart);
        if (savedWhatsApp) whatsappNumber = savedWhatsApp;
        loadFilters();

        populateSizeFilter();
        renderCatalog();
        updateCartCount();
        updateSendButtonState();
        populateSizeFilter();
    }

    function populateSizeFilter() {
        const sizeSelect = document.getElementById('filterSize');
        if (!sizeSelect) return;
        // gather unique sizes from products
        const sizesSet = new Set();
        products.forEach(p => { if (p.sizes && p.sizes.length) p.sizes.forEach(s => sizesSet.add(s)); });
        const sizes = Array.from(sizesSet).sort((a,b) => a - b);

        // keep the 'all' option first
        const current = sizeSelect.value || 'all';
        sizeSelect.innerHTML = `<option value="all">Todas</option>` + sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sizes.includes(Number(current))) sizeSelect.value = current; else sizeSelect.value = 'all';
    }

    // Renderizar catálogo
    function renderCatalog() {
        const catalog = document.getElementById('catalog');
        if (products.length === 0) {
            catalog.innerHTML = '<div class="empty-message">No hay productos disponibles. Usa el panel Admin para agregar productos.</div>';
            return;
        }
        const filtered = products.filter(product => {
            const genderMatch = filters.gender === 'all' || (product.gender && product.gender === filters.gender);
            const sizeMatch = filters.size === 'all' || (product.sizes && product.sizes.includes(Number(filters.size)));
            return genderMatch && sizeMatch;
        });
        if (filtered.length === 0) {
            catalog.innerHTML = '<div class="empty-message">No hay productos que coincidan con los filtros.</div>';
            return;
        }

        catalog.innerHTML = filtered.map(product => `
                <div class="product-card">
                    <img src="${product.image ? product.image : PLACEHOLDER_SVG}" alt="${product.name}" class="product-image">
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
                        <button class="btn-add-cart" data-id="${product.id}">Agregar al Carrito</button>
                    </div>
                </div>
            `).join('');

        // Attach event listeners to new buttons
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => addToCart(Number(btn.dataset.id), e));
        });

        // Attach error handlers to images to set placeholder on load error
        document.querySelectorAll('.product-image').forEach(img => {
            img.addEventListener('error', function() {
                this.onerror = null; // avoid potential infinite loop
                this.src = PLACEHOLDER_SVG;
            });
        });
    }

    // Agregar al carrito
    function addToCart(productId, event) {
        const product = products.find(p => p.id === productId);
        const btn = event.target;
        const card = btn.closest('.product-card');
        const sizeSelect = card ? card.querySelector('.size-select') : null;
        const selectedSize = sizeSelect ? Number(sizeSelect.value) : null;

        const cartItem = cart.find(item => item.id === productId && (item.size || null) === (selectedSize || null));

        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({...product, size: selectedSize || null, quantity: 1});
        }

        saveData();
        updateCartCount();

        // Animación
        const previousText = btn.textContent;
        btn.textContent = '✓ Agregado';
        setTimeout(() => {
            btn.textContent = previousText;
        }, 1000);
    }

    // Actualizar contador del carrito
    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
        updateSendButtonState();
    }

    // Admin Modal
    function openAdmin() {
        document.getElementById('whatsappNumber').value = whatsappNumber;
        renderAdminProducts();
        document.getElementById('adminModal').style.display = 'block';
    }

    function closeAdmin() {
        document.getElementById('adminModal').style.display = 'none';
    }

    function saveWhatsApp() {
        const input = document.getElementById('whatsappNumber');
        const raw = input.value.trim();
        const digits = raw.replace(/\D/g, ''); // remove non-digits
        if (!isValidWhatsAppNumber(digits)) {
            alert('Número de WhatsApp inválido. Debe incluir el código de país y contener al menos 8 dígitos. Ej: 573001234567');
            return;
        }

        whatsappNumber = digits;
        localStorage.setItem('whatsappNumber', whatsappNumber);
        alert('Número de WhatsApp guardado correctamente');
        updateSendButtonState();
    }

    function renderAdminProducts() {
        const container = document.getElementById('adminProducts');
        if (products.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay productos. Agrega el primero.</div>';
            return;
        }

        container.innerHTML = products.map(product => `
                <div class="admin-product">
                    <div class="admin-product-info">
                        <strong>${product.name}</strong><br>
                        <span class="text-muted">$${product.price.toLocaleString()} - ${product.gender || 'unisex'} - Tallas: ${product.sizes ? product.sizes.join(',') : 'N/A'}</span>
                    </div>
                    <div class="admin-product-actions">
                        <button class="btn-edit" data-id="${product.id}">Editar</button>
                        <button class="btn-delete" data-id="${product.id}">Eliminar</button>
                    </div>
                </div>
            `).join('');

        // Attach listeners
        container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editProduct(Number(btn.dataset.id))));
        container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteProduct(Number(btn.dataset.id))));
    }

    // Product Modal
    function openProductForm(productId = null) {
        editingProductId = productId;

        if (productId) {
            const product = products.find(p => p.id === productId);
            document.getElementById('productModalTitle').textContent = 'Editar Producto';
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productImage').value = product.image;
            document.getElementById('productGender').value = product.gender || 'unisex';
            document.getElementById('productSizes').value = product.sizes ? product.sizes.join(',') : '';
        } else {
            document.getElementById('productModalTitle').textContent = 'Agregar Producto';
            document.getElementById('productName').value = '';
            document.getElementById('productDescription').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productImage').value = '';
            document.getElementById('productGender').value = 'unisex';
            document.getElementById('productSizes').value = '';
        }

        document.getElementById('productModal').style.display = 'block';
    }

    function closeProductForm() {
        document.getElementById('productModal').style.display = 'none';
        editingProductId = null;
    }

    function saveProduct() {
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const image = document.getElementById('productImage').value;
        const gender = document.getElementById('productGender') ? document.getElementById('productGender').value : 'unisex';
        const sizesRaw = document.getElementById('productSizes') ? document.getElementById('productSizes').value : '';
        const sizes = sizesRaw.split(',').map(s => Number(s.trim())).filter(s => !Number.isNaN(s));

        if (!name || !price) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        if (editingProductId) {
            const product = products.find(p => p.id === editingProductId);
            product.name = name;
            product.description = description;
            product.price = price;
            product.image = image;
            product.gender = gender || 'unisex';
            product.sizes = sizes;
        } else {
            const newProduct = {
                id: Date.now(),
                name,
                description,
                price,
                image,
                gender: gender || 'unisex',
                sizes
            };
            products.push(newProduct);
        }

        saveData();
        renderCatalog();
        renderAdminProducts();
        populateSizeFilter();
        closeProductForm();
    }

    function editProduct(id) {
        openProductForm(id);
    }

    function deleteProduct(id) {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            products = products.filter(p => p.id !== id);
            cart = cart.filter(item => item.id !== id);
            saveData();
            renderCatalog();
            renderAdminProducts();
            updateCartCount();
            populateSizeFilter();
        }
    }

    // Cart Modal
    function openCart() {
        renderCart();
        document.getElementById('cartModal').style.display = 'block';
    }

    function closeCart() {
        document.getElementById('cartModal').style.display = 'none';
    }

    function renderCart() {
        const container = document.getElementById('cartItems');

        if (cart.length === 0) {
            container.innerHTML = '<div class="empty-message">El carrito está vacío</div>';
            return;
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            container.innerHTML = `
                    ${cart.map(item => `
                        <div class=\"cart-item\">
                            <div class=\"cart-item-info\">
                                <strong>${item.name}</strong><br>
                                <span class=\"text-muted\">Cantidad: ${item.quantity} × $${item.price.toLocaleString()} = $${(item.price * item.quantity).toLocaleString()}</span>
                                ${item.size ? `<div class=\"text-muted\">Talla: ${item.size}</div>` : ''}\n
                            </div>
                            <button class=\"btn-delete remove-from-cart\" data-id=\"${item.id}\" data-size=\"${item.size || ''}\">Eliminar</button>
                        </div>
                    `).join('')}
                    <div class=\"cart-total\">Total: $${total.toLocaleString()}</div>
                    <button class=\"btn-whatsapp\" id=\"sendWhatsAppBtn\">📱 Enviar Pedido por WhatsApp</button>
                `;

        // Attach remove listeners
        container.querySelectorAll('.remove-from-cart').forEach(btn => btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.id), btn.dataset.size ? Number(btn.dataset.size) : null)));
        document.getElementById('sendWhatsAppBtn').addEventListener('click', sendToWhatsApp);
        updateSendButtonState();
    }

    // Validate whatsapp number (strip to digits) — return true if length plausible
    function isValidWhatsAppNumber(number) {
        if (!number) return false;
        if (!/^[0-9]+$/.test(number)) return false;
        // Minimum length 8 (short local numbers), maximum 15 (E.164 max)
        return number.length >= 8 && number.length <= 15;
    }

    // Update enable/disable of the 'send to whatsapp' button if rendered
    function updateSendButtonState() {
        const btn = document.getElementById('sendWhatsAppBtn');
        if (!btn) return; // none rendered
        btn.disabled = !(isValidWhatsAppNumber(whatsappNumber) && cart.length > 0);
    }

    function removeFromCart(productId, size = null) {
        cart = cart.filter(item => {
            if (size === null) return item.id !== productId || item.size !== null; // if size not provided, remove items with no size
            return !(item.id === productId && item.size === size);
        });
        saveData();
        updateCartCount();
        renderCart();
    }

    function sendToWhatsApp() {
        if (!isValidWhatsAppNumber(whatsappNumber)) {
            alert('Por favor configura el número de WhatsApp en el panel Admin');
            return;
        }

        if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        let message = '¡Hola! Me gustaría hacer el siguiente pedido:\n\n';
        let total = 0;

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            message += `• ${item.name}${item.size ? ' (Talla: ' + item.size + ')' : ''}\n  Cantidad: ${item.quantity}\n  Precio: $${item.price.toLocaleString()}\n  Subtotal: $${subtotal.toLocaleString()}\n\n`;
        });

        message += `*Total: $${total.toLocaleString()}*\n\n¡Gracias!`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    }

    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Productos de ejemplo
    function loadSampleProducts() {
        if (products.length === 0) {
            products = [
                {
                    id: 1,
                    name: "Nike Air Max 2024",
                    description: "Zapatillas deportivas con tecnología Air. Perfectas para correr y uso diario.",
                    price: 450000,
                    image: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/99486859-0ff3-46b4-949b-2d16af2ad421/custom-nike-air-max-90-by-you.png",
                    gender: 'masculino',
                    sizes: [39, 40, 41, 42, 43, 44]
                },
                {
                    id: 2,
                    name: "Adidas Ultraboost",
                    description: "Máxima comodidad y estilo. Ideales para entrenamientos intensos.",
                    price: 380000,
                    image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fc200cc78e644dacb4d7af3e016162cf_9366/Ultraboost_Light_Shoes_White_GY9352_01_standard.jpg",
                    gender: 'unisex',
                    sizes: [38, 39, 40, 41, 42]
                },
                {
                    id: 3,
                    name: "Puma Suede Classic",
                    description: "Estilo retro y elegante. Perfectos para el día a día.",
                    price: 250000,
                    image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_2000,h_2000/global/374915/01/sv01/fnd/PNA/fmt/png/Suede-Classic-XXI-Sneakers",
                    gender: 'femenino',
                    sizes: [36, 37, 38, 39, 40]
                },
                {
                    id: 4,
                    name: "Converse Chuck Taylor",
                    description: "Clásicos atemporales. Disponibles en varios colores.",
                    price: 180000,
                    image: "https://www.converse.com/dw/image/v2/BCZC_PRD/on/demandware.static/-/Sites-cnv-master-catalog/default/dw2f02ea6d/images/a_107/M9160_A_107X1.jpg",
                    gender: 'unisex',
                    sizes: [37, 38, 39, 40, 41]
                },
                {
                    id: 5,
                    name: "Vans Old Skool",
                    description: "Icónicos zapatos skate. Resistentes y con gran estilo urbano.",
                    price: 220000,
                    image: "https://images.vans.com/is/image/Vans/VN000D3HY28-HERO?wid=1600&hei=1984&fmt=jpeg&qlt=90&resMode=sharp2&op_usm=0.9,1.7,8,0",
                    gender: 'masculino',
                    sizes: [40, 41, 42, 43, 44]
                }
            ];
            saveData();
            populateSizeFilter();
        }
    }

    // Botones estáticos: agregar listeners
    function attachStaticListeners() {
        const adminBtn = document.getElementById('openAdminBtn');
        if (adminBtn) adminBtn.addEventListener('click', openAdmin);

        const cartBtn = document.getElementById('openCartBtn');
        if (cartBtn) cartBtn.addEventListener('click', openCart);

        const saveWhatsAppBtn = document.getElementById('saveWhatsAppBtn');
        if (saveWhatsAppBtn) saveWhatsAppBtn.addEventListener('click', saveWhatsApp);

        const openProductFormBtn = document.getElementById('openProductFormBtn');
        if (openProductFormBtn) openProductFormBtn.addEventListener('click', () => openProductForm());

        const closeAdminBtn = document.getElementById('closeAdminBtn');
        if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdmin);

        const cancelProductBtn = document.getElementById('cancelProductBtn');
        if (cancelProductBtn) cancelProductBtn.addEventListener('click', closeProductForm);

        const saveProductBtn = document.getElementById('saveProductBtn');
        if (saveProductBtn) saveProductBtn.addEventListener('click', saveProduct);

        const closeCartBtn = document.getElementById('closeCartBtn');
        if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

        const filterGender = document.getElementById('filterGender');
        if (filterGender) filterGender.addEventListener('change', (e) => {
            filters.gender = e.target.value;
            saveFilters();
            renderCatalog();
        });

        const filterSize = document.getElementById('filterSize');
        if (filterSize) filterSize.addEventListener('change', (e) => {
            filters.size = e.target.value;
            saveFilters();
            renderCatalog();
        });

        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
            filters.gender = 'all';
            filters.size = 'all';
            if (filterGender) filterGender.value = 'all';
            if (filterSize) filterSize.value = 'all';
            saveFilters();
            renderCatalog();
        });
    }

    // Inicializar
    loadData();
    loadSampleProducts();
    renderCatalog();
    attachStaticListeners();
});
