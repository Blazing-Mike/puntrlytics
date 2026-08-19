# Puntrlytics

Puntrlytics is a privacy-first, client-side betting history analyzer. It allows users to extract their betting history from supported sportsbooks using a bookmarklet and visualize their performance on a dashboard. 

**Zero Data Collection**: All data extraction and analysis happen locally in the browser. Your betting data never leaves your device, and there are no accounts or backend servers involved.

## Features

- **100% Client-Side**: No backend, no accounts, no data upload.
- **Bookmarklet Extraction**: Easily pull betting history directly from the DOM of supported platforms.
- **Rich Analytics**: Visualizes betting performance, win rates, and trends using Recharts.
- **Supported Platforms**: 
  - [Stake](https://stake.com)
  - [SportyBet](https://www.sportybet.com)
  - [MSport](https://www.msport.com)
  - [football.com](https://football.com)

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Client Components)
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand (with localStorage persistence)
- **Charts**: Recharts
- **Bookmarklet**: Custom ESBuild pipeline to bundle the extraction scripts

## Getting Started

First, install dependencies:

```bash
npm install
```

### Development Server

Run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building the Bookmarklet

The bookmarklet scripts are located in the `bookmarklet/` directory. When you make changes to the data extraction logic, you need to build the bookmarklet:

```bash
npm run build:bookmarklet
```

This script (defined in `bookmarklet/build.mjs`) bundles the TypeScript files into minified JavaScript that can be injected via a URL. This step is automatically included when you run `npm run build` for the main Next.js app.

## How It Works

1. The user drags the Puntrlytics bookmarklet to their bookmarks bar.
2. The user navigates to a supported sportsbook and clicks the bookmarklet.
3. The bookmarklet script executes in the context of the sportsbook's page, reading the betting history from the DOM or intercepted network requests.
4. The extracted data is encoded and passed via the URL hash to the Puntrlytics dashboard.
5. The Next.js dashboard decodes the payload, saves it to `localStorage` using Zustand, and generates the analytical reports.

## Contributing

Contributions are welcome! If you want to add support for a new sportsbook, you'll need to create a new provider script in `bookmarklet/src/providers/` and update the registry.

## License

MIT
