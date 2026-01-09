/**
 * CR AudioViz AI - Scraper Configuration
 * Defines all scrapers and their targets
 */

export const SCRAPER_CONFIG = {
  // Financial Data Scrapers
  financial: {
    mortgageRates: {
      id: 'mortgage-rates',
      name: 'Mortgage Rate Monitor',
      schedule: '0 */6 * * *', // Every 6 hours
      sources: [
        { name: 'Freddie Mac', url: 'https://www.freddiemac.com/pmms', priority: 1 },
        { name: 'Bankrate', url: 'https://www.bankrate.com/mortgages/mortgage-rates/', priority: 2 },
        { name: 'NerdWallet', url: 'https://www.nerdwallet.com/mortgages/mortgage-rates', priority: 3 },
        { name: 'Zillow', url: 'https://www.zillow.com/mortgage-rates/', priority: 4 },
        { name: 'LendingTree', url: 'https://www.lendingtree.com/home/mortgage/rates/', priority: 5 },
      ],
      dataFields: ['conventional30', 'conventional15', 'fha30', 'va30', 'jumbo30'],
    },
    stockData: {
      id: 'stock-data',
      name: 'Stock Market Data',
      schedule: '*/15 9-16 * * 1-5', // Every 15 min during market hours
      sources: [
        { name: 'Yahoo Finance', apiType: 'REST' },
        { name: 'Alpha Vantage', apiType: 'REST' },
        { name: 'Polygon.io', apiType: 'REST' },
      ],
    },
    cryptoData: {
      id: 'crypto-data',
      name: 'Cryptocurrency Data',
      schedule: '*/5 * * * *', // Every 5 minutes
      sources: [
        { name: 'CoinGecko', apiType: 'REST' },
        { name: 'CoinMarketCap', apiType: 'REST' },
      ],
    },
  },

  // Collectors Data Scrapers
  collectors: {
    tradingCards: {
      id: 'trading-cards',
      name: 'Trading Card Prices',
      schedule: '0 */4 * * *', // Every 4 hours
      sources: [
        { name: 'TCGPlayer', url: 'https://www.tcgplayer.com', categories: ['pokemon', 'mtg', 'yugioh', 'sports'] },
        { name: 'eBay', url: 'https://www.ebay.com', type: 'auction' },
        { name: 'COMC', url: 'https://www.comc.com', type: 'marketplace' },
        { name: 'PSA', url: 'https://www.psacard.com', type: 'grading' },
        { name: 'Beckett', url: 'https://www.beckett.com', type: 'grading' },
      ],
    },
    coins: {
      id: 'coins',
      name: 'Coin & Numismatic Prices',
      schedule: '0 */6 * * *',
      sources: [
        { name: 'PCGS', url: 'https://www.pcgs.com/prices', type: 'grading' },
        { name: 'NGC', url: 'https://www.ngccoin.com/price-guide', type: 'grading' },
        { name: 'Heritage Auctions', url: 'https://coins.ha.com', type: 'auction' },
        { name: 'GreatCollections', url: 'https://www.greatcollections.com', type: 'auction' },
      ],
    },
    vinyl: {
      id: 'vinyl',
      name: 'Vinyl Record Prices',
      schedule: '0 */8 * * *',
      sources: [
        { name: 'Discogs', url: 'https://www.discogs.com', type: 'marketplace' },
        { name: 'Popsike', url: 'https://www.popsike.com', type: 'auction-history' },
      ],
    },
    watches: {
      id: 'watches',
      name: 'Luxury Watch Prices',
      schedule: '0 */12 * * *',
      sources: [
        { name: 'Chrono24', url: 'https://www.chrono24.com', type: 'marketplace' },
        { name: 'WatchCharts', url: 'https://watchcharts.com', type: 'analytics' },
        { name: 'Bob\'s Watches', url: 'https://www.bobswatches.com', type: 'dealer' },
      ],
    },
    comics: {
      id: 'comics',
      name: 'Comic Book Prices',
      schedule: '0 */6 * * *',
      sources: [
        { name: 'CGC', url: 'https://www.cgccomics.com', type: 'grading' },
        { name: 'GoCollect', url: 'https://gocollect.com', type: 'analytics' },
        { name: 'MyComicShop', url: 'https://www.mycomicshop.com', type: 'marketplace' },
        { name: 'Heritage Auctions', url: 'https://comics.ha.com', type: 'auction' },
      ],
    },
    disney: {
      id: 'disney',
      name: 'Disney Collectibles',
      schedule: '0 */8 * * *',
      sources: [
        { name: 'eBay Disney', url: 'https://www.ebay.com/b/Disneyana', type: 'auction' },
        { name: 'Van Eaton Galleries', url: 'https://vegalleries.com', type: 'auction' },
      ],
    },
    spirits: {
      id: 'spirits',
      name: 'Collectible Spirits & Whiskey',
      schedule: '0 */12 * * *',
      sources: [
        { name: 'Wine-Searcher', url: 'https://www.wine-searcher.com', type: 'marketplace' },
        { name: 'Whisky Auctioneer', url: 'https://whiskyauctioneer.com', type: 'auction' },
        { name: 'Scotch Whisky Auctions', url: 'https://www.scotchwhiskyauctions.com', type: 'auction' },
      ],
    },
  },

  // Real Estate Scrapers
  realEstate: {
    listings: {
      id: 'real-estate-listings',
      name: 'Property Listings',
      schedule: '0 */2 * * *', // Every 2 hours
      sources: [
        { name: 'Zillow', apiType: 'REST' },
        { name: 'Realtor.com', apiType: 'REST' },
        { name: 'Redfin', apiType: 'REST' },
      ],
    },
    marketData: {
      id: 'real-estate-market',
      name: 'Market Analytics',
      schedule: '0 0 * * *', // Daily
      sources: [
        { name: 'Zillow Research', url: 'https://www.zillow.com/research/data/' },
        { name: 'Redfin Data Center', url: 'https://www.redfin.com/news/data-center/' },
      ],
    },
  },

  // Craft Pattern Scrapers
  craft: {
    crochet: {
      id: 'crochet-patterns',
      name: 'Crochet Patterns',
      schedule: '0 */12 * * *',
      sources: [
        { name: 'Ravelry', url: 'https://www.ravelry.com', type: 'patterns' },
        { name: 'AllFreeCrochet', url: 'https://www.allfreecrochet.com', type: 'patterns' },
        { name: 'Pinterest', url: 'https://www.pinterest.com', type: 'inspiration' },
      ],
    },
    knitting: {
      id: 'knitting-patterns',
      name: 'Knitting Patterns',
      schedule: '0 */12 * * *',
      sources: [
        { name: 'Ravelry', url: 'https://www.ravelry.com', type: 'patterns' },
        { name: 'KnitPicks', url: 'https://www.knitpicks.com', type: 'patterns' },
        { name: 'LoveCrafts', url: 'https://www.lovecrafts.com', type: 'patterns' },
      ],
    },
    yarn: {
      id: 'yarn-data',
      name: 'Yarn Database',
      schedule: '0 0 * * 0', // Weekly
      sources: [
        { name: 'Ravelry Yarns', url: 'https://www.ravelry.com/yarns', type: 'database' },
        { name: 'YarnSub', url: 'https://yarnsub.com', type: 'substitutes' },
      ],
    },
  },

  // Development Documentation
  devDocs: {
    mdn: {
      id: 'mdn-docs',
      name: 'MDN Web Docs',
      schedule: '0 0 * * 0', // Weekly
      url: 'https://developer.mozilla.org',
    },
    freeCodeCamp: {
      id: 'fcc-docs',
      name: 'freeCodeCamp',
      schedule: '0 0 * * 0',
      url: 'https://www.freecodecamp.org',
    },
  },
};

export default SCRAPER_CONFIG;
