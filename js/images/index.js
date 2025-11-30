(function(App){
    App.editingImages = App.editingImages || [];
    let _imageEntryCounter = App._imageEntryCounter || 1;
    App.MAX_IMAGE_DIMENSION = App.MAX_IMAGE_DIMENSION || 1200;
    App.MAX_IMAGE_BYTES = App.MAX_IMAGE_BYTES || (200 * 1024);

    function createImageEntry(src, isDataUrl = false) {
        const id = `img_${Date.now()}_${_imageEntryCounter++}`;
        return { id, src, isDataUrl };
    }
    App.createImageEntry = createImageEntry;

    function findEntryIndexById(id) { return App.editingImages.findIndex(e => e.id === id); }
    App.findEntryIndexById = findEntryIndexById;

    function reorderImage(id, delta){
        const i = findEntryIndexById(id); if (i === -1) return; const newIndex = i + delta; if (newIndex < 0 || newIndex >= App.editingImages.length) return; const [item] = App.editingImages.splice(i,1); App.editingImages.splice(newIndex,0,item); const preview = document.getElementById('productImagesPreview'); if (preview) App.renderImagePreviews(preview, App.editingImages); const urlContainer = document.getElementById('productImagesContainer'); if (urlContainer) App.renderURLInputs(urlContainer, App.editingImages); }
    App.reorderImage = reorderImage;
    
    function reorderImageFromDrag(draggedId, targetId){
        const i = findEntryIndexById(draggedId);
        const j = findEntryIndexById(targetId);
        if (i === -1 || j === -1) return;
        const [item] = App.editingImages.splice(i,1);
        // insertar antes del índice objetivo (si el índice original < índice objetivo, ajustar)
        const insertIndex = i < j ? j - 1 : j;
        App.editingImages.splice(insertIndex, 0, item);
        const preview = document.getElementById('productImagesPreview'); if (preview) App.renderImagePreviews(preview, App.editingImages);
        const urlContainer = document.getElementById('productImagesContainer'); if (urlContainer) App.renderURLInputs(urlContainer, App.editingImages);
    }
    App.reorderImageFromDrag = reorderImageFromDrag;

    function setPrimaryImage(id){ const i = findEntryIndexById(id); if (i === -1) return; const [item] = App.editingImages.splice(i,1); App.editingImages.unshift(item); const preview = document.getElementById('productImagesPreview'); if (preview) App.renderImagePreviews(preview, App.editingImages); const urlContainer = document.getElementById('productImagesContainer'); if (urlContainer) App.renderURLInputs(urlContainer, App.editingImages); }
    App.setPrimaryImage = setPrimaryImage;

    function removeImageById(id){ const i = findEntryIndexById(id); if (i===-1) return; App.editingImages.splice(i,1); const preview = document.getElementById('productImagesPreview'); if(preview) App.renderImagePreviews(preview, App.editingImages); const urlContainer = document.getElementById('productImagesContainer'); if(urlContainer) App.renderURLInputs(urlContainer, App.editingImages); }
    App.removeImageById = removeImageById;

    function renderURLInputs(container, entries){
        container.innerHTML = '';
        entries.forEach((entry, idx) => {
            const inputWrap = document.createElement('div');
            inputWrap.className = 'image-entry';
            inputWrap.draggable = true;
            inputWrap.dataset.entryId = entry.id;
            // eventos de arrastre (drag)
            inputWrap.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', entry.id); e.dataTransfer.effectAllowed = 'move'; });
            inputWrap.addEventListener('dragover', (e) => { e.preventDefault(); inputWrap.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; });
            inputWrap.addEventListener('dragleave', () => inputWrap.classList.remove('drag-over'));
            inputWrap.addEventListener('drop', (e) => { e.preventDefault(); inputWrap.classList.remove('drag-over'); const draggedId = e.dataTransfer.getData('text/plain'); if(draggedId && draggedId !== entry.id) { App.reorderImageFromDrag(draggedId, entry.id); } });

            const input = document.createElement('input');
            input.type='text';
            input.className = 'product-image-url';
            input.placeholder = 'https://ejemplo.com/imagen.jpg';
            input.value = entry.src || '';
            input.dataset.entryId = entry.id;
            input.addEventListener('input', (e)=>{
                entry.src = e.target.value.trim();
                entry.isDataUrl = entry.src.startsWith('data:');
                const preview = document.getElementById('productImagesPreview'); if (preview) App.renderImagePreviews(preview, App.editingImages);
            });

            const btnRemove = document.createElement('button'); btnRemove.type='button'; btnRemove.className='btn-cancel btn-remove-image'; btnRemove.textContent='Eliminar'; btnRemove.addEventListener('click', () => App.removeImageById(entry.id));
            const btnPrimary = document.createElement('button'); btnPrimary.type='button'; btnPrimary.className='btn-link'; btnPrimary.textContent='⭐'; btnPrimary.title='Seleccionar principal'; btnPrimary.addEventListener('click', () => App.setPrimaryImage(entry.id));

            inputWrap.appendChild(input);
            const controls = document.createElement('div'); controls.style.display = 'flex'; controls.style.gap='6px'; controls.style.alignItems='center'; controls.appendChild(btnPrimary); controls.appendChild(btnRemove);
            inputWrap.appendChild(controls);
            container.appendChild(inputWrap);
        });
        updateRemoveVisibility(container);
    }
    App.renderURLInputs = renderURLInputs;

    function renderImagePreviews(container, entries){
        container.innerHTML='';
        entries.forEach((entry,idx)=>{
            const imgEl = document.createElement('img');
            imgEl.src = entry.src || App.PLACEHOLDER_SVG;
            imgEl.className='product-thumbnail';
            imgEl.alt = `Imagen ${idx+1}`;
            const wrap = document.createElement('div');
            wrap.className='image-preview-entry';
            wrap.draggable = true;
            wrap.style.display='flex';
            wrap.style.alignItems='center';
            wrap.style.gap='8px';
            wrap.dataset.entryId = entry.id;
            wrap.appendChild(imgEl);
            if(idx===0){ const primary = document.createElement('span'); primary.className='badge-mini'; primary.textContent = 'Principal'; wrap.appendChild(primary); }

            // manejadores de arrastre (drag handlers)
            wrap.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', entry.id); e.dataTransfer.effectAllowed = 'move'; });
            wrap.addEventListener('dragover', (e) => { e.preventDefault(); wrap.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; });
            wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
            wrap.addEventListener('drop', (e) => { e.preventDefault(); wrap.classList.remove('drag-over'); const draggedId = e.dataTransfer.getData('text/plain'); if(draggedId && draggedId !== entry.id) { App.reorderImageFromDrag(draggedId, entry.id); } });

            const btnPrimary = document.createElement('button'); btnPrimary.type='button'; btnPrimary.className='btn-link'; btnPrimary.textContent='⭐'; btnPrimary.addEventListener('click', ()=> App.setPrimaryImage(entry.id));
            const btnRemove = document.createElement('button'); btnRemove.type='button'; btnRemove.className='btn-cancel'; btnRemove.textContent='Eliminar'; btnRemove.addEventListener('click', ()=> App.removeImageById(entry.id));
            const controls = document.createElement('div'); controls.style.display='flex'; controls.style.gap='6px'; controls.style.alignItems='center'; controls.appendChild(btnPrimary); controls.appendChild(btnRemove); wrap.appendChild(controls);
            container.appendChild(wrap);
        });
    }
    App.renderImagePreviews = renderImagePreviews;

    function estimateDataURLSizeBytes(dataUrl){ const base64 = (dataUrl.split(',')[1]||''); return Math.ceil((base64.length*3)/4); }
    App.estimateDataURLSizeBytes = estimateDataURLSizeBytes;

    function resizeFileToDataURL(file, maxDim, maxBytes){ return new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = function(e){ const img = new Image(); img.onload = function(){ let width = img.width; let height = img.height; let scale = Math.min(1, maxDim/Math.max(width,height)); width = Math.round(width*scale); height = Math.round(height*scale); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,width,height); let quality = 0.92; let dataUrl = canvas.toDataURL('image/jpeg', quality); while(App.estimateDataURLSizeBytes(dataUrl) > maxBytes && quality > 0.5){ quality -= 0.1; dataUrl = canvas.toDataURL('image/jpeg', quality);} while(App.estimateDataURLSizeBytes(dataUrl) > maxBytes && (width>200 && height>200)){ width = Math.round(width*0.85); height = Math.round(height*0.85); canvas.width = width; canvas.height = height; ctx.drawImage(img,0,0,width,height); quality = Math.max(0.5,quality-0.1); dataUrl = canvas.toDataURL('image/jpeg', quality);} resolve(dataUrl); }; img.onerror = function(){ resolve(''); }; img.src = e.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }
    App.resizeFileToDataURL = resizeFileToDataURL;

    function readFilesToDataURLs(files, callback){ const promises = Array.from(files).map(f=> App.resizeFileToDataURL(f, App.MAX_IMAGE_DIMENSION, App.MAX_IMAGE_BYTES)); Promise.all(promises).then(results => callback(results)).catch(err => { App.showToast('Error al leer las imágenes: ' + (err.message||err)); callback([]); }); }
    App.readFilesToDataURLs = readFilesToDataURLs;

    // Añadir creación del elemento input usado por la UI
    function addImageInput(container, value = '', idx = null, imageEntry = null){
        const entryEl = document.createElement('div');
        entryEl.className = 'image-entry';
        entryEl.draggable = true;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'product-image-url';
        input.placeholder = 'https://ejemplo.com/imagen.jpg';
        input.value = value || '';
        if (idx !== null) input.id = `productImage_${idx}`;

        const preview = document.createElement('img');
        preview.className = 'product-thumbnail';
        preview.src = value || App.PLACEHOLDER_SVG;
        preview.alt = 'Preview';

        const btnRemove = document.createElement('button');
        btnRemove.type = 'button';
        btnRemove.className = 'btn-cancel btn-remove-image';
        btnRemove.textContent = 'Eliminar';
        btnRemove.style.marginLeft = '8px';

        // eventos de arrastre para que este input también pueda reordenarse
        entryEl.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', entryEl.dataset.entryId || ''); e.dataTransfer.effectAllowed = 'move'; });
        entryEl.addEventListener('dragover', (e) => { e.preventDefault(); entryEl.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; });
        entryEl.addEventListener('dragleave', () => entryEl.classList.remove('drag-over'));
        entryEl.addEventListener('drop', (e) => { e.preventDefault(); entryEl.classList.remove('drag-over'); const draggedId = e.dataTransfer.getData('text/plain'); if(draggedId && draggedId !== entryEl.dataset.entryId) { App.reorderImageFromDrag(draggedId, entryEl.dataset.entryId); } });

        btnRemove.addEventListener('click', () => {
            const entryId = entryEl.dataset.entryId;
            if (entryId) { App.removeImageById(entryId); }
            entryEl.remove();
            updateRemoveVisibility(container);
            const previewEl = document.getElementById('productImagesPreview');
            if (previewEl) App.renderImagePreviews(previewEl, App.editingImages);
        });

        input.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            preview.src = url || App.PLACEHOLDER_SVG;
            const entryId = entryEl.dataset.entryId;
            if (entryId) {
                const en = App.editingImages.find(x => x.id === entryId);
                if (en) { en.src = url; en.isDataUrl = url.startsWith('data:'); }
            }
            const previewEl = document.getElementById('productImagesPreview');
            if (previewEl) App.renderImagePreviews(previewEl, App.editingImages);
        });

        entryEl.appendChild(preview);
        entryEl.appendChild(input);
        entryEl.appendChild(btnRemove);
        container.appendChild(entryEl);
        updateRemoveVisibility(container);

        // crear entrada si no fue proporcionada
        if (!imageEntry) {
            const en = createImageEntry(value || '', (value || '').startsWith('data:'));
            entryEl.dataset.entryId = en.id;
            App.editingImages.push(en);
        } else {
            entryEl.dataset.entryId = imageEntry.id;
        }
        return entryEl;
    }
    App.addImageInput = addImageInput;

    function updateRemoveVisibility(container){ const entries = container.querySelectorAll('.image-entry'); entries.forEach((e,i)=>{ const btn = e.querySelector('.btn-remove-image'); if(btn) btn.style.display = entries.length > 1 ? 'inline-block' : 'none'; }); }
    App.updateRemoveVisibility = updateRemoveVisibility;

    function getCombinedImageList(){ return App.editingImages.map(e => e.src).filter(Boolean); }
    App.getCombinedImageList = getCombinedImageList;

    function removeImageByUrl(url){ const entry = App.editingImages.find(e=>e.src === url); if(entry){ App.removeImageById(entry.id); return;} document.querySelectorAll('.product-image-url').forEach(inp => { if(inp.value.trim() === url) inp.parentElement.remove(); }); const preview = document.getElementById('productImagesPreview'); if(preview) App.renderImagePreviews(preview, App.editingImages); }
    App.removeImageByUrl = removeImageByUrl;

    // Funciones de la galería
    let galleryCurrentIndex = 0; let galleryCurrentProduct = null; let _galleryTouchStartX = null; let _galleryTouchHandlerStart = null; let _galleryTouchHandlerEnd = null;
    function openGallery(productId, startIndex = 0){ const product = App.products.find(p => p.id === productId); if(!product) return; galleryCurrentProduct = product; const images = (product.images && product.images.length) ? product.images : (product.image ? [product.image] : []); if(!images.length) return; galleryCurrentIndex = Math.min(Math.max(0, startIndex), images.length - 1); const modal = document.getElementById('galleryModal'); const mainImg = document.getElementById('galleryMainImage'); const thumbs = document.getElementById('galleryThumbs'); const info = document.getElementById('galleryProductInfo'); if(!modal || !mainImg || !thumbs) return; mainImg.src = images[galleryCurrentIndex]; mainImg.alt = product.name + ' - Imagen ' + (galleryCurrentIndex + 1); thumbs.innerHTML = images.map((img, idx)=>`<img src="${img}" data-idx="${idx}" alt="${product.name} ${idx+1}" class="${idx===galleryCurrentIndex? 'selected' : ''}">`).join(''); if(info) info.textContent = `${product.name} — $${product.price.toLocaleString()}`; const counter = document.getElementById('galleryImageCounter'); if(counter) counter.textContent = `${galleryCurrentIndex+1}/${images.length}`; modal.style.display='block'; document.getElementById('prevImageBtn').onclick = () => changeGalleryIndex(-1); document.getElementById('nextImageBtn').onclick = () => changeGalleryIndex(1); mainImg.onclick = () => changeGalleryIndex(1); document.getElementById('closeGalleryBtn').onclick = closeGallery; thumbs.querySelectorAll('img').forEach(imgEl => imgEl.addEventListener('click', (e) => { const idx = Number(e.target.dataset.idx); setGalleryIndex(idx); })); document.addEventListener('keydown', galleryKeyHandler); _galleryTouchHandlerStart = (e) => { _galleryTouchStartX = e.touches ? e.touches[0].clientX : e.clientX; }; _galleryTouchHandlerEnd = (e) => { if(_galleryTouchStartX === null) return; const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX; const dx = endX - _galleryTouchStartX; const threshold = 40; if(dx > threshold) changeGalleryIndex(-1); else if (dx < -threshold) changeGalleryIndex(1); _galleryTouchStartX = null; }; const mainImageEl = document.getElementById('galleryMainImage'); if(mainImageEl){ mainImageEl.addEventListener('touchstart', _galleryTouchHandlerStart); mainImageEl.addEventListener('touchend', _galleryTouchHandlerEnd); mainImageEl.addEventListener('mousedown', _galleryTouchHandlerStart); mainImageEl.addEventListener('mouseup', _galleryTouchHandlerEnd); } }
    App.openGallery = openGallery;

    function closeGallery(){ const modal = document.getElementById('galleryModal'); if(!modal) return; modal.style.display='none'; galleryCurrentProduct = null; document.removeEventListener('keydown', galleryKeyHandler); const mainImageEl = document.getElementById('galleryMainImage'); if(mainImageEl){ if(_galleryTouchHandlerStart) mainImageEl.removeEventListener('touchstart', _galleryTouchHandlerStart); if(_galleryTouchHandlerEnd) mainImageEl.removeEventListener('touchend', _galleryTouchHandlerEnd); if(_galleryTouchHandlerStart) mainImageEl.removeEventListener('mousedown', _galleryTouchHandlerStart); if(_galleryTouchHandlerEnd) mainImageEl.removeEventListener('mouseup', _galleryTouchHandlerEnd); } _galleryTouchHandlerStart = null; _galleryTouchHandlerEnd = null; }
    App.closeGallery = closeGallery;

    function galleryKeyHandler(e){ if(e.key === 'ArrowRight') changeGalleryIndex(1); if(e.key === 'ArrowLeft') changeGalleryIndex(-1); if(e.key === 'Escape') closeGallery(); }
    App.galleryKeyHandler = galleryKeyHandler;

    function changeGalleryIndex(delta){ if(!galleryCurrentProduct) return; const images = (galleryCurrentProduct.images && galleryCurrentProduct.images.length) ? galleryCurrentProduct.images : (galleryCurrentProduct.image ? [galleryCurrentProduct.image] : []); if(!images.length) return; let newIndex = galleryCurrentIndex + delta; if(newIndex < 0) newIndex = images.length - 1; if(newIndex >= images.length) newIndex = 0; setGalleryIndex(newIndex); }
    App.changeGalleryIndex = changeGalleryIndex;

    function setGalleryIndex(idx){ galleryCurrentIndex = idx; const mainImg = document.getElementById('galleryMainImage'); const thumbs = document.getElementById('galleryThumbs'); if(!mainImg || !thumbs || !galleryCurrentProduct) return; const images = (galleryCurrentProduct.images && galleryCurrentProduct.images.length) ? galleryCurrentProduct.images : (galleryCurrentProduct.image ? [galleryCurrentProduct.image] : []); mainImg.src = images[galleryCurrentIndex]; mainImg.alt = galleryCurrentProduct.name + ' - Imagen ' + (galleryCurrentIndex + 1); thumbs.querySelectorAll('img').forEach(imgEl => imgEl.classList.remove('selected')); const selected = thumbs.querySelector(`img[data-idx="${idx}"]`); if(selected) selected.classList.add('selected'); const counter = document.getElementById('galleryImageCounter'); if(counter) counter.textContent = `${galleryCurrentIndex+1}/${images.length}`; }
    App.setGalleryIndex = setGalleryIndex;

})(window.App || (window.App = {}));
