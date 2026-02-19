// Map logic using Leaflet
(function () {
    // parse stores from template (use textContent to avoid HTML parsing issues)
    const tpl = document.getElementById('stores-data');
    let stores = [];
    if (tpl) {
        try {
            const raw = tpl.textContent || tpl.innerHTML || '';
            stores = JSON.parse(raw.trim());
        } catch (e) {
            console.error('Failed to parse stores data from template', e);
        }
    } else {
        console.warn('stores-data template not found in DOM');
    }

    // If parsing failed or the template was empty, fall back to a small default list
    if (!Array.isArray(stores) || stores.length === 0) {
        console.warn('No stores found in template — using fallback sample stores');
        stores = [
            {id:1,name:'PC Hub Manila',lat:14.5995,lng:120.9842,address:'Makati City',rating:'★★★★★',hours:'9am - 8pm',img:'https://via.placeholder.com/120x80/00703c/ffffff?text=PC+Hub'},
            {id:2,name:"Gamer's Den",lat:14.61,lng:120.99,address:'Mandaluyong',rating:'★★★★☆',hours:'10am - 9pm',img:'https://via.placeholder.com/120x80/00703c/ffffff?text=Gamer%27s'},
            {id:3,name:'BuildLab',lat:14.585,lng:120.975,address:'Pasay',rating:'★★★★★',hours:'8am - 7pm',img:'https://via.placeholder.com/120x80/00703c/ffffff?text=BuildLab'}
        ];
    }
    console.info('Loaded stores:', stores.length);

    const map = L.map('map').setView([14.5995, 120.9842], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // marker cluster group for better performance with many markers
    const clusterGroup = L.markerClusterGroup();
    // keep a bounds list to fit the map to markers
    const markerBounds = [];

    // marker storage
    const markers = [];

    // add markers (with thumbnail icons) and add to cluster group
    stores.forEach(store => {
        // create a small icon using the store image (will be loaded by the browser)
        const icon = L.icon({
            iconUrl: store.img,
            iconSize: [42, 42],
            className: 'store-marker-icon'
        });

        const m = L.marker([store.lat, store.lng], { icon });

        const popupHtml = `
            <div class="popup-card">
                <img src="${store.img}" alt="${store.name}" class="popup-img"/>
                <div class="popup-body">
                    <strong>${store.name}</strong>
                    <div class="popup-rating">${store.rating}</div>
                    <div class="popup-hours">${store.hours}</div>
                    <div class="popup-address">${store.address}</div>
                    <div style="margin-top:6px">
                        <a href="store-page.html" class="popup-link">View store</a>
                        &nbsp;|&nbsp;
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" target="_blank" rel="noopener">Directions</a>
                    </div>
                </div>
            </div>
        `;

        m.bindPopup(popupHtml, { minWidth: 220 });
        markers.push({ marker: m, data: store });
        clusterGroup.addLayer(m);
        markerBounds.push([store.lat, store.lng]);
    });

    // add clustered markers to the map
    clusterGroup.addTo(map);

    // fit map to marker bounds if available
    if (markerBounds.length) {
        try {
            map.fitBounds(markerBounds, { padding: [64, 64] });
        } catch (e) {
            // fallback: set view to default
            map.setView([14.5995, 120.9842], 13);
        }
    }

    // create list of names for simple autocomplete
    const names = stores.map(s => s.name);

    // Simple search: focus on first match
    const searchInput = document.getElementById('mapSearch');
    // autocomplete dropdown element
    const acList = document.getElementById('autocompleteList');
    // accessibility attributes
    acList.setAttribute('role', 'listbox');
    acList.setAttribute('aria-hidden', 'true');
    searchInput.setAttribute('aria-controls', 'autocompleteList');
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-activedescendant', '');

    function buildAutocompleteItems(query) {
        const q = (query || '').trim().toLowerCase();
        // filter names by includes
        const results = q ? names.filter(n => n.toLowerCase().includes(q)) : names.slice();
        // limit
        return results.slice(0, 8);
    }

    // simple debounce helper
    function debounce(fn, wait) {
        let t = null;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    let acIndex = -1;
    function renderAutocomplete(query) {
        const items = buildAutocompleteItems(query);
        acList.innerHTML = '';
        if (!items.length) { acList.style.display = 'none'; acList.setAttribute('aria-hidden', 'true'); return; }
        const q = (query || '').trim();
        const qLower = q.toLowerCase();
        items.forEach((label, idx) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            // accessibility: make each item an option in the listbox
            div.id = `autocomplete-item-${idx}`;
            div.setAttribute('role', 'option');
            div.setAttribute('aria-selected', 'false');
            div.setAttribute('tabindex', '-1');
            // highlight matched substring
            if (q && label.toLowerCase().includes(qLower)) {
                const start = label.toLowerCase().indexOf(qLower);
                const before = label.slice(0, start);
                const match = label.slice(start, start + q.length);
                const after = label.slice(start + q.length);
                div.innerHTML = `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
            } else {
                div.textContent = label;
            }
            div.addEventListener('click', () => {
                selectAutocomplete(label);
                // keep input focused for keyboard users
                searchInput.focus();
            });
            acList.appendChild(div);
        });
        acList.style.display = 'block';
        acList.setAttribute('aria-hidden', 'false');
        searchInput.setAttribute('aria-expanded', 'true');
        acIndex = -1;
    }

    // simple HTML escape for injected content
    function escapeHtml(s) {
        return s.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function selectAutocomplete(label) {
        searchInput.value = label;
        acList.style.display = 'none';
        acList.setAttribute('aria-hidden', 'true');
        searchInput.setAttribute('aria-expanded', 'false');
        searchInput.setAttribute('aria-activedescendant', '');
        const found = markers.find(m => m.data.name === label);
        if (found) {
            map.setView([found.data.lat, found.data.lng], 16, { animate: true });
            found.marker.openPopup();
        }
    }

    // debounce the autocomplete rendering for smoother typing
    const debouncedRender = debounce((val) => renderAutocomplete(val), 150);
    searchInput.addEventListener('input', function (e) {
        debouncedRender(this.value);
    });

    searchInput.addEventListener('keydown', function (e) {
        const items = Array.from(acList.querySelectorAll('.autocomplete-item'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!items.length) return;
            if (acIndex < items.length - 1) acIndex += 1; else acIndex = 0; // wrap to start
            items.forEach(it => {
                it.classList.remove('active');
                it.setAttribute('aria-selected', 'false');
            });
            if (items[acIndex]) {
                items[acIndex].classList.add('active');
                items[acIndex].setAttribute('aria-selected', 'true');
                searchInput.setAttribute('aria-activedescendant', items[acIndex].id);
                items[acIndex].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!items.length) return;
            if (acIndex > 0) acIndex -= 1; else acIndex = items.length - 1; // wrap to end
            items.forEach(it => {
                it.classList.remove('active');
                it.setAttribute('aria-selected', 'false');
            });
            if (items[acIndex]) {
                items[acIndex].classList.add('active');
                items[acIndex].setAttribute('aria-selected', 'true');
                searchInput.setAttribute('aria-activedescendant', items[acIndex].id);
                items[acIndex].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            if (acList.style.display === 'block' && acIndex >= 0) {
                e.preventDefault();
                const label = items[acIndex].textContent;
                selectAutocomplete(label);
                return;
            }
            // otherwise fallback to first match
            const q = searchInput.value.trim().toLowerCase();
            if (!q) return;
            const found = markers.find(m => m.data.name.toLowerCase().includes(q));
            if (found) {
                map.setView([found.data.lat, found.data.lng], 16, { animate: true });
                found.marker.openPopup();
            }
            acList.style.display = 'none';
            acList.setAttribute('aria-hidden', 'true');
            searchInput.setAttribute('aria-expanded', 'false');
            searchInput.setAttribute('aria-activedescendant', '');
        } else if (e.key === 'Escape') {
            acList.style.display = 'none';
            acList.setAttribute('aria-hidden', 'true');
            searchInput.setAttribute('aria-expanded', 'false');
            searchInput.setAttribute('aria-activedescendant', '');
        }
    });

    // close autocomplete when clicking outside
    document.addEventListener('click', (ev) => {
        if (!ev.target.closest('#autocompleteList') && !ev.target.closest('#mapSearch')) {
            acList.style.display = 'none';
        }
    });

    // optional autocomplete suggestions using datalist fallback
    (function attachDatalist() {
        const dl = document.createElement('datalist');
        dl.id = 'stores-list';
        names.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            dl.appendChild(opt);
        });
        document.body.appendChild(dl);
        searchInput.setAttribute('list', 'stores-list');
    })();

    // locate button
    const locateBtn = document.getElementById('locateBtn');
    let userMarker = null;
    let accuracyCircle = null;
    locateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        locateBtn.disabled = true;
        locateBtn.textContent = 'Locating...';
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            // remove previous
            if (userMarker) map.removeLayer(userMarker);
            if (accuracyCircle) map.removeLayer(accuracyCircle);

            // add a circle marker for the user's position and a radius for accuracy
            userMarker = L.circleMarker([lat, lng], {
                radius: 10,
                color: '#fff',
                weight: 2,
                fillColor: '#00703c',
                fillOpacity: 0.95
            }).addTo(map).bindPopup('You are here');

            accuracyCircle = L.circle([lat, lng], {
                radius: pos.coords.accuracy || 50,
                color: '#00703c',
                opacity: 0.25,
                fillOpacity: 0.06
            }).addTo(map);

            // include user in bounds and fit
            try {
                const all = markerBounds.slice();
                all.push([lat, lng]);
                map.fitBounds(all, { padding: [64, 64] });
            } catch (e) {
                map.setView([lat, lng], 14);
            }

            // optionally open nearest store popup if within 2km
            if (markers.length) {
                let nearest = null;
                let minDist = Infinity;
                markers.forEach(m => {
                    const d = L.latLng(lat, lng).distanceTo(L.latLng(m.data.lat, m.data.lng));
                    if (d < minDist) { minDist = d; nearest = m; }
                });
                if (nearest && minDist < 2000) {
                    nearest.marker.openPopup();
                }
            }

            locateBtn.disabled = false;
            locateBtn.textContent = 'Show my location';
        }, err => {
            console.error(err);
            alert('Unable to retrieve your location');
            locateBtn.disabled = false;
            locateBtn.textContent = 'Show my location';
        }, { enableHighAccuracy: true });
    });

    // make map responsive on load
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });
})();