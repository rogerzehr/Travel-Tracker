// Travel Mapper - Main Application Logic

// Initialize global variables
let map, countryLayer;
let trips = [];
let currentTripId = null;
let dateFormat = 'MM/DD/YYYY';
let darkMode = false;

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav-links li'),
    views: document.querySelectorAll('.view'),
    
    // Map View
    worldMap: document.getElementById('world-map'),
    
    // List View
    tripsList: document.getElementById('trips-list'),
    sortTrips: document.getElementById('sort-trips'),
    searchTrips: document.getElementById('search-trips'),
    
    // Stats View
    countriesCount: document.getElementById('countries-count'),
    tripsCount: document.getElementById('trips-count'),
    daysTraveled: document.getElementById('days-traveled'),
    mostVisited: document.getElementById('most-visited'),
    tripsByYearChart: document.getElementById('trips-by-year-chart'),
    tripsByContinentChart: document.getElementById('trips-by-continent-chart'),
    
    // Buttons and Controls
    addTripButton: document.getElementById('add-trip-button'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    dateFormatSelect: document.getElementById('date-format-select'),
    exportDataBtn: document.getElementById('export-data'),
    importDataBtn: document.getElementById('import-data'),
    importFileInput: document.getElementById('import-file'),
    clearDataBtn: document.getElementById('clear-data'),
    
    // Trip Form Modal
    tripModal: document.getElementById('trip-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeModal: document.querySelector('.close-modal'),
    cancelTripBtn: document.getElementById('cancel-trip'),
    
    // Trip Form
    tripForm: document.getElementById('trip-form'),
    tripId: document.getElementById('trip-id'),
    countrySelect: document.getElementById('country-select'),
    dateEntered: document.getElementById('date-entered'),
    dateLeft: document.getElementById('date-left'),
    accommodation: document.getElementById('accommodation'),
    tripNotes: document.getElementById('trip-notes'),
    tagsInput: document.getElementById('tags-input'),
    tagOptions: document.querySelectorAll('.tag'),
    selectedTags: document.getElementById('selected-tags'),
    photoInput: document.getElementById('photo-input'),
    photoUploadBtn: document.getElementById('photo-upload-btn'),
    photoPreview: document.getElementById('photo-preview'),
    
    // Trip Details Modal
    tripDetailsModal: document.getElementById('trip-details-modal'),
    detailsTitle: document.getElementById('details-title'),
    closeDetailsModal: document.querySelector('.close-details-modal'),
    tripDetailsContainer: document.querySelector('.trip-details-container'),
    editTripBtn: document.getElementById('edit-trip-btn'),
    deleteTripBtn: document.getElementById('delete-trip-btn'),
    
    // Confirm Modal
    confirmModal: document.getElementById('confirm-modal'),
    closeConfirmModal: document.querySelector('.close-confirm-modal'),
    cancelDeleteBtn: document.getElementById('cancel-delete'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ==========================
// App Initialization
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    initializeDatePickers();
    populateCountrySelect();
    initializeMap();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load user settings
    loadSettings();
    
    // Load trips data
    loadTrips();
    
    // Initial UI update
    updateUI();
});

// Initialize Flatpickr date pickers
function initializeDatePickers() {
    const dateOptions = {
        altInput: true,
        altFormat: 'F j, Y',
        dateFormat: 'Y-m-d',
        allowInput: true
    };
    
    flatpickr(elements.dateEntered, dateOptions);
    flatpickr(elements.dateLeft, { ...dateOptions, allowInput: true });
}

// Populate country select dropdown
function populateCountrySelect() {
    countries.sort((a, b) => a.name.localeCompare(b.name)).forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = `${country.flag} ${country.name}`;
        elements.countrySelect.appendChild(option);
    });
}

// Initialize Leaflet map
function initializeMap() {
    map = L.map(elements.worldMap, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        zoomControl: true,
        scrollWheelZoom: true
    });
    
    // Add dark and light mode tile layers
    const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });
    
    // Use appropriate tiles based on dark mode
    if (darkMode) {
        darkTiles.addTo(map);
    } else {
        lightTiles.addTo(map);
    }
    
    // Add GeoJSON layer for country highlighting
    countryLayer = L.geoJSON(worldGeoJSON, {
        style: countryStyle,
        onEachFeature: onEachCountryFeature
    }).addTo(map);
    
    // Fetch actual GeoJSON data
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        .then(response => response.json())
        .then(data => {
            countryLayer.clearLayers();
            countryLayer.addData(data);
            updateMapHighlights();
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            showToast('Failed to load map data. Using simplified version.', 'error');
        });
}

// Set up event listeners
function initEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });
    
    // Add trip button
    elements.addTripButton.addEventListener('click', openTripModal);
    
    // Modal close buttons
    elements.closeModal.addEventListener('click', closeTripModal);
    elements.closeDetailsModal.addEventListener('click', closeDetailsModal);
    elements.closeConfirmModal.addEventListener('click', closeConfirmModal);
    elements.cancelTripBtn.addEventListener('click', closeTripModal);
    
    // Trip form submission
    elements.tripForm.addEventListener('submit', handleTripFormSubmit);
    
    // Trip action buttons
    elements.editTripBtn.addEventListener('click', handleEditTrip);
    elements.deleteTripBtn.addEventListener('click', handleDeleteTrip);
    elements.cancelDeleteBtn.addEventListener('click', closeConfirmModal);
    elements.confirmDeleteBtn.addEventListener('click', confirmDeleteTrip);
    
    // Tags selection
    elements.tagOptions.forEach(tag => {
        tag.addEventListener('click', toggleTag);
    });
    
    // Photo upload
    elements.photoUploadBtn.addEventListener('click', function() {
        elements.photoInput.click();
    });
    
    elements.photoInput.addEventListener('change', handlePhotoUpload);
    
    // List view controls
    elements.sortTrips.addEventListener('change', function() {
        sortTripsList(this.value);
    });
    
    elements.searchTrips.addEventListener('input', function() {
        filterTripsList(this.value);
    });
    
    // Settings
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    elements.dateFormatSelect.addEventListener('change', function() {
        dateFormat = this.value;
        saveSettings();
        updateUI();
    });
    
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataBtn.addEventListener('click', function() {
        elements.importFileInput.click();
    });
    
    elements.importFileInput.addEventListener('change', importData);
    elements.clearDataBtn.addEventListener('click', confirmClearData);
    
    // Window clicks to close modals
    window.addEventListener('click', function(event) {
        if (event.target === elements.tripModal) {
            closeTripModal();
        } else if (event.target === elements.tripDetailsModal) {
            closeDetailsModal();
        } else if (event.target === elements.confirmModal) {
            closeConfirmModal();
        }
    });
}

// ==========================
// Data Management Functions
// ==========================

// Save trips to localStorage
function saveTrips() {
    localStorage.setItem('travelMapperTrips', JSON.stringify(trips));
}

// Load trips from localStorage
function loadTrips() {
    const savedTrips = localStorage.getItem('travelMapperTrips');
    if (savedTrips) {
        trips = JSON.parse(savedTrips);
        updateUI();
    }
}

// Save user settings to localStorage
function saveSettings() {
    const settings = {
        darkMode: darkMode,
        dateFormat: dateFormat
    };
    localStorage.setItem('travelMapperSettings', JSON.stringify(settings));
}

// Load user settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('travelMapperSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        darkMode = settings.darkMode;
        dateFormat = settings.dateFormat || 'MM/DD/YYYY';
        
        // Apply settings to UI
        elements.darkModeToggle.checked = darkMode;
        elements.dateFormatSelect.value = dateFormat;
        
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
    }
}

// Add a new trip
function addTrip(tripData) {
    const newTrip = {
        id: Date.now().toString(),
        ...tripData,
        createdAt: new Date().toISOString()
    };
    
    trips.push(newTrip);
    saveTrips();
    updateUI();
    return newTrip;
}

// Update an existing trip
function updateTrip(tripId, tripData) {
    const index = trips.findIndex(trip => trip.id === tripId);
    if (index !== -1) {
        trips[index] = {
            ...trips[index],
            ...tripData,
            updatedAt: new Date().toISOString()
        };
        saveTrips();
        updateUI();
        return trips[index];
    }
    return null;
}

// Delete a trip
function deleteTrip(tripId) {
    const index = trips.findIndex(trip => trip.id === tripId);
    if (index !== -1) {
        trips.splice(index, 1);
        saveTrips();
        updateUI();
        return true;
    }
    return false;
}

// Export data to JSON file
function exportData() {
    if (trips.length === 0) {
        showToast('No trips to export', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(trips, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `travel_mapper_export_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showToast('Data exported successfully', 'success');
}

// Import data from JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData) && importedData.length > 0) {
                // Check if this is a valid trips file
                if (importedData[0].country && importedData[0].dateEntered) {
                    if (trips.length > 0 && !confirm('This will override your existing trips. Continue?')) {
                        return;
                    }
                    
                    trips = importedData;
                    saveTrips();
                    updateUI();
                    showToast(`Imported ${trips.length} trips successfully`, 'success');
                } else {
                    showToast('Invalid data format', 'error');
                }
            } else {
                showToast('No trips found in file', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing data', 'error');
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Confirm clearing all data
function confirmClearData() {
    if (trips.length === 0) {
        showToast('No data to clear', 'error');
        return;
    }
    
    elements.confirmModal.style.display = 'block';
}

// Clear all data
function clearAllData() {
    trips = [];
    saveTrips();
    updateUI();
    closeConfirmModal();
    showToast('All data cleared successfully', 'success');
}

// ==========================
// UI Functions
// ==========================

// Switch between views
function switchView(viewName) {
    // Update navigation links
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show selected view, hide others
    elements.views.forEach(view => {
        if (view.id === `${viewName}-view`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
    
    // Special handling for map view to fix Leaflet rendering
    if (viewName === 'map' && map) {
        setTimeout(() => {
            map.invalidateSize();
            updateMapHighlights();
        }, 100);
    }
    
    // Update stats if viewing statistics
    if (viewName === 'stats') {
        updateStatistics();
    }
}

// Update the entire UI
function updateUI() {
    renderTripsList();
    updateMapHighlights();
    updateStatistics();
}

// Open trip form modal
function openTripModal(tripId = null) {
    // Reset form
    elements.tripForm.reset();
    elements.photoPreview.innerHTML = '';
    elements.selectedTags.innerHTML = '';
    elements.tagsInput.value = '';
    
    // Remove selected state from all tags
    elements.tagOptions.forEach(tag => tag.classList.remove('selected'));
    
    currentTripId = tripId;
    
    if (tripId) {
        // Edit mode
        elements.modalTitle.textContent = 'Edit Trip';
        const trip = trips.find(t => t.id === tripId);
        
        if (trip) {
            // Populate form with trip data
            elements.tripId.value = trip.id;
            elements.countrySelect.value = trip.country;
            elements.dateEntered.value = trip.dateEntered;
            if (trip.dateLeft) {
                elements.dateLeft.value = trip.dateLeft;
            }
            elements.accommodation.value = trip.accommodation || '';
            elements.tripNotes.value = trip.notes || '';
            
            // Set tags
            if (trip.tags && trip.tags.length > 0) {
                trip.tags.forEach(tag => {
                    const tagElement = document.querySelector(`.tag[data-tag="${tag}"]`);
                    if (tagElement) {
                        tagElement.classList.add('selected');
                        addSelectedTag(tag);
                    }
                });
                elements.tagsInput.value = trip.tags.join(',');
            }
            
            // Show photos
            if (trip.photos && trip.photos.length > 0) {
                trip.photos.forEach(photo => {
                    addPhotoPreview(photo);
                });
            }
        }
    } else {
        // Add mode
        elements.modalTitle.textContent = 'Add New Trip';
        elements.tripId.value = '';
        
        // Set default start date to today
        const dateEntered = flatpickr(elements.dateEntered);
        dateEntered.setDate(new Date());
    }
    
    elements.tripModal.style.display = 'block';
}

// Close trip form modal
function closeTripModal() {
    elements.tripModal.style.display = 'none';
    currentTripId = null;
}

// Open trip details modal
function openTripDetails(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    const country = getCountryByCode(trip.country);
    
    // Set trip ID for edit/delete operations
    currentTripId = tripId;
    
    // Set title
    elements.detailsTitle.textContent = country.name;
    
    // Build details content
    let detailsHTML = `
        <div class="trip-header">
            <div class="trip-flag">${country.flag}</div>
            <div class="trip-info">
                <h2>${country.name}</h2>
                <div class="trip-dates">
                    ${formatDate(trip.dateEntered)} - ${trip.dateLeft ? formatDate(trip.dateLeft) : 'Present'}
                </div>
            </div>
        </div>
    `;
    
    // Accommodation
    if (trip.accommodation) {
        detailsHTML += `
            <div class="trip-section">
                <h3>Accommodation</h3>
                <div class="trip-accommodation">
                    <i class="fas fa-home"></i> 
                    <span>${trip.accommodation}</span>
                </div>
            </div>
        `;
    }
    
    // Tags
    if (trip.tags && trip.tags.length > 0) {
        detailsHTML += `
            <div class="trip-section">
                <h3>Trip Tags</h3>
                <div class="trip-tags-list">
                    ${trip.tags.map(tag => `<span class="trip-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Notes
    if (trip.notes) {
        detailsHTML += `
            <div class="trip-section">
                <h3>Trip Notes</h3>
                <div class="trip-notes">
                    ${trip.notes.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }
    
    // Photos
    if (trip.photos && trip.photos.length > 0) {
        detailsHTML += `
            <div class="trip-section">
                <h3>Photos</h3>
                <div class="trip-photos-grid">
                    ${trip.photos.map(photo => `
                        <div class="trip-photo-item">
                            <a href="${photo}" data-lightbox="trip-${trip.id}" data-title="${country.name}">
                                <img src="${photo}" alt="${country.name}">
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    elements.tripDetailsContainer.innerHTML = detailsHTML;
    elements.tripDetailsModal.style.display = 'block';
}

// Close trip details modal
function closeDetailsModal() {
    elements.tripDetailsModal.style.display = 'none';
    currentTripId = null;
}

// Show confirm delete modal
function openConfirmModal() {
    elements.confirmModal.style.display = 'block';
}

// Close confirm delete modal
function closeConfirmModal() {
    elements.confirmModal.style.display = 'none';
}

// Render trips list
function renderTripsList() {
    if (!elements.tripsList) return;
    
    elements.tripsList.innerHTML = '';
    
    if (trips.length === 0) {
        elements.tripsList.innerHTML = `
            <div class="no-trips">
                <p>You haven't added any trips yet. Click "Add New Trip" to get started!</p>
            </div>
        `;
        return;
    }
    
    // Sort trips by date (newest first by default)
    const sortedTrips = [...trips].sort((a, b) => {
        return new Date(b.dateEntered) - new Date(a.dateEntered);
    });
    
    sortedTrips.forEach(trip => {
        const country = getCountryByCode(trip.country);
        if (!country) return;
        
        const tripCard = document.createElement('div');
        tripCard.className = 'trip-card';
        tripCard.setAttribute('data-trip-id', trip.id);
        
        // Choose background image
        const bgImage = trip.photos && trip.photos.length > 0 
            ? trip.photos[0] 
            : `https://source.unsplash.com/random/800x600/?${country.name},travel`;
        
        tripCard.innerHTML = `
            <div class="trip-card-header" style="background-image: url('${bgImage}')">
                <div class="trip-country">
                    <h3>${country.flag} ${country.name}</h3>
                    <span class="trip-dates">${formatDate(trip.dateEntered)} - ${trip.dateLeft ? formatDate(trip.dateLeft) : 'Present'}</span>
                </div>
            </div>
            <div class="trip-card-body">
                ${trip.accommodation ? `
                    <div class="trip-location">
                        <i class="fas fa-map-marker-alt"></i> ${trip.accommodation}
                    </div>
                ` : ''}
                
                ${trip.tags && trip.tags.length > 0 ? `
                    <div class="trip-tags">
                        ${trip.tags.map(tag => `<span class="trip-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${trip.notes ? `
                    <div class="trip-preview">
                        ${trip.notes.substring(0, 120)}${trip.notes.length > 120 ? '...' : ''}
                    </div>
                ` : ''}
                
                ${trip.photos && trip.photos.length > 1 ? `
                    <div class="trip-photos">
                        ${trip.photos.slice(1, 4).map(photo => `
                            <img class="trip-photo" src="${photo}" alt="${country.name}">
                        `).join('')}
                        ${trip.photos.length > 4 ? `<span class="trip-photo-count">+${trip.photos.length - 4}</span>` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="trip-card-footer">
                <button class="view-trip-btn" data-trip-id="${trip.id}">View Details</button>
            </div>
        `;
        
        elements.tripsList.appendChild(tripCard);
        
        // Add click event for the view details button
        const viewBtn = tripCard.querySelector('.view-trip-btn');
        viewBtn.addEventListener('click', function() {
            openTripDetails(this.getAttribute('data-trip-id'));
        });
    });
}

// Sort trips list
function sortTripsList(sortOption) {
    const tripCards = Array.from(elements.tripsList.querySelectorAll('.trip-card'));
    if (tripCards.length === 0) return;
    
    // Remove existing cards
    tripCards.forEach(card => card.remove());
    
    // Sort trips based on the selected option
    let sortedTrips = [...trips];
    
    switch (sortOption) {
        case 'date-desc':
            sortedTrips.sort((a, b) => new Date(b.dateEntered) - new Date(a.dateEntered));
            break;
        case 'date-asc':
            sortedTrips.sort((a, b) => new Date(a.dateEntered) - new Date(b.dateEntered));
            break;
        case 'country-asc':
            sortedTrips.sort((a, b) => {
                const countryA = getCountryByCode(a.country);
                const countryB = getCountryByCode(b.country);
                return countryA.name.localeCompare(countryB.name);
            });
            break;
        case 'country-desc':
            sortedTrips.sort((a, b) => {
                const countryA = getCountryByCode(a.country);
                const countryB = getCountryByCode(b.country);
                return countryB.name.localeCompare(countryA.name);
            });
            break;
    }
    
    // Update trips array and re-render
    trips = sortedTrips;
    renderTripsList();
}

// Filter trips list by search term
function filterTripsList(searchTerm) {
    const tripCards = elements.tripsList.querySelectorAll('.trip-card');
    
    if (searchTerm.trim() === '') {
        // Show all trips
        tripCards.forEach(card => card.style.display = 'block');
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    tripCards.forEach(card => {
        const tripId = card.getAttribute('data-trip-id');
        const trip = trips.find(t => t.id === tripId);
        
        if (!trip) return;
        
        const country = getCountryByCode(trip.country);
        const countryName = country ? country.name.toLowerCase() : '';
        const accommodation = (trip.accommodation || '').toLowerCase();
        const notes = (trip.notes || '').toLowerCase();
        const tags = (trip.tags || []).join(' ').toLowerCase();
        
        // Check if any field contains the search term
        if (
            countryName.includes(searchLower) || 
            accommodation.includes(searchLower) || 
            notes.includes(searchLower) || 
            tags.includes(searchLower)
        ) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Update map highlights for visited countries
function updateMapHighlights() {
    if (!countryLayer) return;
    
    countryLayer.eachLayer(layer => {
        const countryCode = layer.feature.properties.code;
        
        // Check if country has been visited
        const visits = trips.filter(trip => trip.country === countryCode);
        const isCurrentlyVisiting = visits.some(trip => !trip.dateLeft);
        
        if (visits.length > 0) {
            if (isCurrentlyVisiting) {
                layer.setStyle({
                    fillColor: '#2ecc71',
                    fillOpacity: 0.7,
                    weight: 1,
                    color: '#fff',
                    opacity: 0.7
                });
            } else {
                layer.setStyle({
                    fillColor: '#3498db',
                    fillOpacity: 0.7,
                    weight: 1,
                    color: '#fff',
                    opacity: 0.7
                });
            }
        } else {
            layer.setStyle(countryStyle(layer.feature));
        }
    });
}

// Update statistics view
function updateStatistics() {
    if (!elements.countriesCount) return;
    
    // Count unique countries
    const uniqueCountries = [...new Set(trips.map(trip => trip.country))];
    elements.countriesCount.textContent = uniqueCountries.length;
    
    // Total trips
    elements.tripsCount.textContent = trips.length;
    
    // Calculate days traveled
    let totalDays = 0;
    trips.forEach(trip => {
        const startDate = new Date(trip.dateEntered);
        const endDate = trip.dateLeft ? new Date(trip.dateLeft) : new Date();
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        totalDays += days;
    });
    elements.daysTraveled.textContent = totalDays;
    
    // Most visited country
    const countryVisits = {};
    trips.forEach(trip => {
        countryVisits[trip.country] = (countryVisits[trip.country] || 0) + 1;
    });
    
    let mostVisitedCountry = null;
    let maxVisits = 0;
    
    for (const country in countryVisits) {
        if (countryVisits[country] > maxVisits) {
            mostVisitedCountry = country;
            maxVisits = countryVisits[country];
        }
    }
    
    if (mostVisitedCountry) {
        const country = getCountryByCode(mostVisitedCountry);
        elements.mostVisited.textContent = `${country.name} (${maxVisits} trips)`;
    } else {
        elements.mostVisited.textContent = 'None';
    }
    
    // Create charts
    createYearlyChart();
    createContinentChart();
}

// Create yearly trips chart
function createYearlyChart() {
    if (!elements.tripsByYearChart) return;
    
    // Get years from trips
    const years = [];
    trips.forEach(trip => {
        const year = new Date(trip.dateEntered).getFullYear();
        if (!years.includes(year)) {
            years.push(year);
        }
    });
    
    years.sort();
    
    // Count trips per year
    const tripCounts = years.map(year => {
        return trips.filter(trip => {
            return new Date(trip.dateEntered).getFullYear() === year;
        }).length;
    });
    
    // Create chart
    const ctx = elements.tripsByYearChart.getContext('2d');
    
    // Destroy previous chart if exists
    if (window.yearlyChart) {
        window.yearlyChart.destroy();
    }
    
    window.yearlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Number of Trips',
                data: tripCounts,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create continent distribution chart
function createContinentChart() {
    if (!elements.tripsByContinentChart) return;
    
    // Get continents from visited countries
    const visitedCountries = [...new Set(trips.map(trip => trip.country))];
    const continents = {};
    
    visitedCountries.forEach(countryCode => {
        const country = getCountryByCode(countryCode);
        if (country) {
            continents[country.continent] = (continents[country.continent] || 0) + 1;
        }
    });
    
    const continentLabels = Object.keys(continents);
    const continentData = Object.values(continents);
    
    // Create chart
    const ctx = elements.tripsByContinentChart.getContext('2d');
    
    // Destroy previous chart if exists
    if (window.continentChart) {
        window.continentChart.destroy();
    }
    
    // Colors for continents
    const colors = [
        '#3498db', // Europe
        '#e74c3c', // Asia
        '#2ecc71', // North America
        '#f39c12', // Africa
        '#9b59b6', // South America
        '#1abc9c', // Oceania
        '#34495e'  // Antarctica
    ];
    
    window.continentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: continentLabels,
            datasets: [{
                data: continentData,
                backgroundColor: colors.slice(0, continentLabels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Toggle dark mode
function toggleDarkMode() {
    darkMode = elements.darkModeToggle.checked;
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Update map tiles
    if (map) {
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        if (darkMode) {
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);
        } else {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        }
    }
    
    saveSettings();
}

// Show toast notification
function showToast(message, type = 'default') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    }
    
    toast.style.display = 'block';
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

// ==========================
// Form Handling Functions
// ==========================

// Toggle tag selection
function toggleTag() {
    const tag = this.getAttribute('data-tag');
    
    if (this.classList.contains('selected')) {
        // Remove tag
        this.classList.remove('selected');
        removeSelectedTag(tag);
    } else {
        // Add tag
        this.classList.add('selected');
        addSelectedTag(tag);
    }
    
    // Update hidden input with selected tags
    updateTagsInput();
}

// Add a tag to the selected tags container
function addSelectedTag(tag) {
    const tagElement = document.createElement('span');
    tagElement.className = 'trip-tag';
    tagElement.textContent = tag;
    tagElement.setAttribute('data-tag', tag);
    
    const removeButton = document.createElement('span');
    removeButton.className = 'remove-tag';
    removeButton.innerHTML = '&times;';
    removeButton.addEventListener('click', function() {
        const tagName = this.parentElement.getAttribute('data-tag');
        const tagOption = document.querySelector(`.tag[data-tag="${tagName}"]`);
        if (tagOption) {
            tagOption.classList.remove('selected');
        }
        this.parentElement.remove();
        updateTagsInput();
    });
    
    tagElement.appendChild(removeButton);
    elements.selectedTags.appendChild(tagElement);
}

// Remove a tag from the selected tags container
function removeSelectedTag(tag) {
    const selectedTag = elements.selectedTags.querySelector(`.trip-tag[data-tag="${tag}"]`);
    if (selectedTag) {
        selectedTag.remove();
    }
}

// Update hidden tags input value
function updateTagsInput() {
    const selectedTags = elements.selectedTags.querySelectorAll('.trip-tag');
    const tags = Array.from(selectedTags).map(tag => tag.getAttribute('data-tag'));
    elements.tagsInput.value = tags.join(',');
}

// Handle photo upload
function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            addPhotoPreview(e.target.result);
        };
        
        reader.readAsDataURL(file);
    }
}

// Add photo preview
function addPhotoPreview(photoSrc) {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    
    const img = document.createElement('img');
    img.src = photoSrc;
    img.alt = 'Trip photo';
    
    const removeBtn = document.createElement('div');
    removeBtn.className = 'photo-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', function() {
        photoItem.remove();
    });
    
    photoItem.appendChild(img);
    photoItem.appendChild(removeBtn);
    elements.photoPreview.appendChild(photoItem);
}

// Handle trip form submission
function handleTripFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const tripData = {
        country: elements.countrySelect.value,
        dateEntered: elements.dateEntered.value,
        dateLeft: elements.dateLeft.value || null,
        accommodation: elements.accommodation.value,
        notes: elements.tripNotes.value,
        tags: elements.tagsInput.value ? elements.tagsInput.value.split(',') : []
    };
    
    // Get photos
    const photoItems = elements.photoPreview.querySelectorAll('.photo-item img');
    tripData.photos = Array.from(photoItems).map(img => img.src);
    
    // Validate required fields
    if (!tripData.country || !tripData.dateEntered) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Add or update the trip
    if (currentTripId) {
        // Update existing trip
        updateTrip(currentTripId, tripData);
        showToast('Trip updated successfully', 'success');
    } else {
        // Add new trip
        addTrip(tripData);
        showToast('Trip added successfully', 'success');
    }
    
    // Close the modal
    closeTripModal();
}

// Handle edit trip button
function handleEditTrip() {
    if (currentTripId) {
        closeDetailsModal();
        openTripModal(currentTripId);
    }
}

// Handle delete trip button
function handleDeleteTrip() {
    if (currentTripId) {
        closeDetailsModal();
        openConfirmModal();
    }
}

// Handle confirm delete button
function confirmDeleteTrip() {
    if (currentTripId) {
        deleteTrip(currentTripId);
        closeConfirmModal();
        showToast('Trip deleted successfully', 'success');
        currentTripId = null;
    }
}

// ==========================
// Helper Functions
// ==========================

// Format date according to user preference
function formatDate(dateString) {
    if (!dateString) return 'Present';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return dateString;
    }
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    switch (dateFormat) {
        case 'MM/DD/YYYY':
            return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
        case 'DD/MM/YYYY':
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        default:
            return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    }
}

// Default style for map countries
function countryStyle(feature) {
    return {
        fillColor: '#95a5a6',
        weight: 1,
        opacity: 0.5,
        color: 'white',
        fillOpacity: 0.2
    };
}

// Add interactions to countries on the map
function onEachCountryFeature(feature, layer) {
    // Add tooltip with country name
    layer.bindTooltip(feature.properties.name, {
        permanent: false,
        direction: 'center',
        className: 'country-tooltip'
    });
    
    // Add click event to show trips to this country
    layer.on({
        click: function(e) {
            const countryCode = feature.properties.code;
            const countryTrips = trips.filter(trip => trip.country === countryCode);
            
            if (countryTrips.length > 0) {
                // Show the most recent trip for this country
                const mostRecentTrip = countryTrips.sort((a, b) => {
                    return new Date(b.dateEntered) - new Date(a.dateEntered);
                })[0];
                
                openTripDetails(mostRecentTrip.id);
            } else {
                // No trips for this country yet, offer to add one
                if (confirm(`You haven't been to ${feature.properties.name} yet. Would you like to add a trip?`)) {
                    openTripModal();
                    elements.countrySelect.value = countryCode;
                }
            }
        }
    });
}