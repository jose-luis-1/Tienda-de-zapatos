// Módulo core: define el objeto global App, estado, persistencia, carga de filtros y datos de ejemplo
window.App = window.App || {};
(function(App){
    // Estado
    App.products = App.products || [];
    App.cart = App.cart || [];
    App.editingProductId = null;
    App.whatsappNumber = App.whatsappNumber || '';
    App.filters = App.filters || { gender: 'all', size: 'all' };

    // Constantes
    App.PLACEHOLDER_SVG = App.PLACEHOLDER_SVG || "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%239ca3af%22%3ESin imagen%3C/text%3E%3C/svg%3E";

    // Funciones de persistencia
    App.saveData = function(){
        localStorage.setItem('products', JSON.stringify(App.products));
        localStorage.setItem('cart', JSON.stringify(App.cart));
    };
    App.saveFilters = function(){
        localStorage.setItem('filters', JSON.stringify(App.filters));
    };

    App.loadFilters = function(){
        const saved = localStorage.getItem('filters');
        if (saved) {
            try { App.filters = JSON.parse(saved); } catch(e) { App.filters = { gender: 'all', size: 'all' }; }
        }
        // normalizar filtros
        if (App.filters.gender && typeof App.filters.gender === 'string') App.filters.gender = App.filters.gender.trim() || 'all';
        if (App.filters.size && typeof App.filters.size === 'string') App.filters.size = App.filters.size.trim() || 'all';
        if (App.filters.size !== 'all' && isNaN(Number(App.filters.size))) App.filters.size = 'all';

        const fg = document.getElementById('filterGender');
        const fs = document.getElementById('filterSize');
        if (fg) fg.value = App.filters.gender || 'all';
        if (fs) fs.value = App.filters.size || 'all';
    };

    App.loadData = function(){
        const savedProducts = localStorage.getItem('products');
        const savedCart = localStorage.getItem('cart');
        const savedWhatsApp = localStorage.getItem('whatsappNumber');
        if (savedProducts) App.products = JSON.parse(savedProducts);
        // migración de datos (compatibilidad con esquema antiguo)
        App.products = App.products.map(p => {
            if (!p.images && p.image) return { ...p, images: [p.image] };
            if (!p.images) p.images = [];
            return p;
        });
        if (savedCart) App.cart = JSON.parse(savedCart);
        if (savedWhatsApp) App.whatsappNumber = savedWhatsApp;
        App.loadFilters();
    };

    App.populateSizeFilter = function(){
        const sizeSelect = document.getElementById('filterSize');
        if (!sizeSelect) return;
        const sizesSet = new Set();
        App.products.forEach(p => { if (p.sizes && p.sizes.length) p.sizes.forEach(s => sizesSet.add(s)); });
        const sizes = Array.from(sizesSet).sort((a,b) => a - b);
        const current = sizeSelect.value || 'all';
        sizeSelect.innerHTML = `<option value="all">Todas</option>` + sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        if (sizes.includes(Number(current))) sizeSelect.value = current; else sizeSelect.value = 'all';
    };

    App.loadSampleProducts = function(){
        if (App.products.length === 0) {
            App.products = [
                { id: 1, name: "Nike Air Max 2024", description: "Zapatillas deportivas con tecnología Air. Perfectas para correr y uso diario.", price: 450000, image: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/99486859-0ff3-46b4-949b-2d16af2ad421/custom-nike-air-max-90-by-you.png", gender: 'masculino', sizes: [39,40,41,42,43,44] },
                { id: 2, name: "Adidas Ultraboost", description: "Máxima comodidad y estilo. Ideales para entrenamientos intensos.", price: 380000, image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fc200cc78e644dacb4d7af3e016162cf_9366/Ultraboost_Light_Shoes_White_GY9352_01_standard.jpg", gender: 'unisex', sizes: [38,39,40,41,42] },
                { id: 3, name: "Puma Suede Classic", description: "Estilo retro y elegante. Perfectos para el día a día.", price: 250000, image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_2000,h_2000/global/374915/01/sv01/fnd/PNA/fmt/png/Suede-Classic-XXI-Sneakers", gender: 'femenino', sizes: [36,37,38,39,40] },
                { id: 4, name: "Converse Chuck Taylor", description: "Clásicos atemporales. Disponibles en varios colores.", price: 180000, image: "https://www.converse.com/dw/image/v2/BCZC_PRD/on/demandware.static/-/Sites-cnv-master-catalog/default/dw2f02ea6d/images/a_107/M9160_A_107X1.jpg", gender: 'unisex', sizes: [37,38,39,40,41] },
                { id: 5, name: "Vans Old Skool", description: "Icónicos zapatos skate. Resistentes y con gran estilo urbano.", price: 220000, image: "https://images.vans.com/is/image/Vans/VN000D3HY28-HERO?wid=1600&hei=1984&fmt=jpeg&qlt=90&resMode=sharp2&op_usm=0.9,1.7,8,0", gender: 'masculino', sizes: [40,41,42,43,44] }
            ];
            App.saveData();
        }
    };

    App.isValidWhatsAppNumber = function(number) { if (!number) return false; if (!/^[0-9]+$/.test(number)) return false; return number.length >= 8 && number.length <= 15; };

    App.updateSendButtonState = function(){
        const btn = document.getElementById('sendWhatsAppBtn'); if (!btn) return; btn.disabled = !(App.isValidWhatsAppNumber(App.whatsappNumber) && App.cart.length > 0);
    };

    App.showToast = function(message, duration = 2000) {
        const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); toast.style.display = 'block'; setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.style.display = 'none', 200); }, duration); };

    // Exponer una función init simple; el módulo de UI debe llamar a App.init cuando esté cargado (DOMContentLoaded)
    App.init = function(){
        App.loadData();
        App.loadSampleProducts();
        App.populateSizeFilter();
    };

})(window.App);
