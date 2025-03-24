# Travel Mapper - Track Your Global Adventures

Travel Mapper is a responsive web application that helps you track and document your travels around the world. The app stores all your travel memories, including visited countries, trip dates, accommodations, notes, and photos.

![Travel Mapper Screenshot](screenshot.jpg)

## Features

- **Interactive World Map**: Visualize your travels with a color-coded world map
- **Trip Journal**: Record detailed information about each trip including dates, accommodations, and personal notes
- **Photo Gallery**: Upload and store photos from your trips
- **Travel Statistics**: View insights about your travels including countries visited, total trips, travel days, and more
- **Data Management**: Export and import your travel data for backup or sharing
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Offline Support**: All data is stored locally in your browser

## Getting Started

### Prerequisites

No special prerequisites are needed! Travel Mapper is a pure client-side application, so all you need is a modern web browser.

### Installation

1. Clone this repository or download the ZIP file
2. Extract the files if you downloaded a ZIP
3. Open `index.html` in your web browser

That's it! The app will run directly in your browser.

### Hosting on GitHub Pages

To host this app on GitHub Pages:

1. Create a new GitHub repository
2. Upload all the files to your repository
3. Go to your repository Settings > Pages
4. Under "Source", select "main" branch
5. Click Save
6. Your app will be available at `https://yourusername.github.io/repository-name/`

## Project Structure

```
travel-mapper/
├── index.html           # Main HTML file
├── css/
│   └── styles.css       # Application styles
├── js/
│   ├── app.js           # Main application logic
│   └── countries.js     # Country data and utilities
├── img/                 # (Optional) Image assets
└── README.md            # This documentation
```

## Usage

1. **Adding a Trip**: Click the "Add New Trip" button and fill in the details
2. **Viewing Trips**: Navigate through the Map View or List View to see your trips
3. **Editing/Deleting**: Open trip details and use the edit or delete buttons
4. **Statistics**: Check out your travel stats on the Statistics page
5. **Settings**: Customize the app and manage your data in the Settings page

## Data Privacy

Travel Mapper respects your privacy. All your data is stored locally in your browser using localStorage. No data is sent to any server.

To back up your data, use the Export feature in the Settings page. This will download a JSON file containing all your travel records.

## Contributing

Feel free to fork this project and customize it for your own needs. If you make improvements that might be useful for others, consider submitting a pull request!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Leaflet.js for the interactive map
- Chart.js for statistics visualization
- Flatpickr for the date picker
- Font Awesome for icons
