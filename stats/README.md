# EL Extension - Statistics Module

This directory contains the modularized statistics dashboard for the EL Extension.

## Directory Structure

```
stats/
├── js/
│   ├── core/
│   │   ├── constants.js     # Application constants and enums
│   │   ├── storage.js      # Data storage and retrieval
│   │   └── utils.js        # Utility functions
│   │
│   ├── services/
│   │   ├── statsService.js  # Statistical calculations
│   │   └── ...
│   │
│   ├── components/
│   │   └── charts/
│   │       ├── activityChart.js
│   │       └── vocabDistributionChart.js
│   │
│   ├── ui/
│   │   ├── toast.js
│   │   ├── loading.js
│   │   └── errorHandler.js
│   │
│   └── main.js          # Application entry point
│
├── index.html           # Main HTML file
└── README.md             # This file
```

## Key Features

- **Modular Architecture**: Code is split into logical modules for better maintainability
- **Responsive Design**: Works on both desktop and mobile devices
- **Interactive Charts**: Visual representation of learning progress
- **Real-time Updates**: Data refreshes automatically
- **Error Handling**: Graceful error handling and user feedback

## Development

1. The application uses ES6 modules for better code organization
2. All data operations are handled through the storage service
3. UI components are separated from business logic
4. Error boundaries catch and display errors gracefully

## Dependencies

- Bootstrap 5.3.0
- Chart.js
- Bootstrap Icons

## Building for Production

For production, you'll want to bundle and minify the JavaScript. This can be done using tools like:

- Webpack
- Rollup
- Vite

## Browser Support

The application targets modern browsers with support for:
- ES6 Modules
- Fetch API
- CSS Grid/Flexbox

## License

[MIT](LICENSE)
