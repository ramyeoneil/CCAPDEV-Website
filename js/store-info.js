function getStoreSignupStep() {
    const raw = sessionStorage.getItem('storeSignupData');
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.email || !parsed.password) return null;
        return parsed;
    } catch (e) {
        return null;
    }
}

function setIfExists(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value == null ? '' : String(value);
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

document.addEventListener('DOMContentLoaded', function() {
    const step1 = getStoreSignupStep();
    if (!step1) {
        alert('Please start store signup from the beginning.');
        window.location.href = 'signup-store.html';
        return;
    }

    // Prefill read-only store email in both panels.
    setIfExists('store-email', step1.email || '');
    setIfExists('edit-email', step1.email || '');

    // Optional: if URL params include defaults, apply them.
    const params = new URLSearchParams(window.location.search);
    if (params.get('storeName')) setIfExists('store-name', params.get('storeName'));
    if (params.get('phone')) setIfExists('phone', params.get('phone'));
    if (params.get('address')) setIfExists('address', params.get('address'));
    if (params.get('region')) setIfExists('region', params.get('region'));
    if (params.get('website')) setIfExists('website', params.get('website'));

    // Keep left/right store fields synced (so user can type in either panel).
    // To avoid cursor jumps, we only copy values when they differ.
    let isSyncing = false;

    function syncValue(sourceId, targetId) {
        if (isSyncing) return;
        const source = document.getElementById(sourceId);
        const target = document.getElementById(targetId);
        if (!source || !target) return;
        if (source.value === target.value) return;
        isSyncing = true;
        target.value = source.value;
        isSyncing = false;
    }

    // Left -> Right
    ['store-name', 'phone', 'address', 'region', 'website'].forEach(function(leftId) {
        const rightId =
            leftId === 'store-name' ? 'edit-name' :
            leftId === 'phone' ? 'edit-phone' :
            leftId === 'address' ? 'edit-address' :
            leftId === 'region' ? 'edit-region' :
            leftId === 'website' ? 'edit-website' :
            null;
        if (!rightId) return;
        const left = document.getElementById(leftId);
        if (!left) return;
        left.addEventListener('input', function() {
            syncValue(leftId, rightId);
        });
    });

    // Right -> Left
    ['edit-name', 'edit-phone', 'edit-address', 'edit-region', 'edit-website'].forEach(function(rightId) {
        const leftId =
            rightId === 'edit-name' ? 'store-name' :
            rightId === 'edit-phone' ? 'phone' :
            rightId === 'edit-address' ? 'address' :
            rightId === 'edit-region' ? 'region' :
            rightId === 'edit-website' ? 'website' :
            null;
        if (!leftId) return;
        const right = document.getElementById(rightId);
        if (!right) return;
        right.addEventListener('input', function() {
            syncValue(rightId, leftId);
        });
    });

    // Initial sync (right panel should reflect left if left has values from query params).
    syncValue('store-name', 'edit-name');
    syncValue('phone', 'edit-phone');
    syncValue('address', 'edit-address');
    syncValue('region', 'edit-region');
    syncValue('website', 'edit-website');

    // SAVE CHANGES (submit store application)
    const saveChangesBtn = document.getElementById('save-changes-btn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', async function() {
            const storeName = getVal('edit-name') || getVal('store-name');
            const phone = getVal('edit-phone') || getVal('phone');
            const website = getVal('edit-website') || getVal('website');
            const address = document.getElementById('edit-address') ? document.getElementById('edit-address').value.trim() : getVal('address');
            const region = getVal('edit-region') || getVal('region');

            const openTime = getVal('edit-open');
            const closeTime = getVal('edit-close');
            const daysOpen = document.getElementById('edit-days') ? document.getElementById('edit-days').value : '';

            if (!storeName) return alert('Please enter Store Name.');
            if (!phone) return alert('Please enter Phone.');
            if (!address) return alert('Please enter Address.');
            if (!region) return alert('Please enter Region.');

            // NOTE: Backend currently saves only basic store fields.
            // We still collect opening/closing/days for UI completeness (not persisted by backend yet).
            sessionStorage.setItem('storeDraftOperatingHours', JSON.stringify({
                openTime: openTime || '',
                closeTime: closeTime || '',
                daysOpen: daysOpen || ''
            }));

            saveChangesBtn.disabled = true;
            saveChangesBtn.textContent = 'Saving...';

            try {
                const payload = {
                    storeName: storeName,
                    email: (step1.email || '').trim().toLowerCase(),
                    password: step1.password,
                    phone: phone,
                    website: website,
                    city: region,
                    address: address,
                    location: region
                };

                const res = await fetch((window.API_BASE || '') + '/api/stores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(function() { return {}; });
                if (!res.ok) {
                    alert(data.error || 'Could not submit application');
                    return;
                }

                sessionStorage.removeItem('storeSignupData');
                alert('Application submitted! You can log in once an admin approves your store.');
                window.location.href = 'login.html';
            } catch (e) {
                console.error(e);
                alert('Could not reach server. Is the API running?');
            } finally {
                saveChangesBtn.disabled = false;
                saveChangesBtn.textContent = 'SAVE CHANGES';
            }
        });
    }
});

