const dataSource = [
    // US Companies
    { name: 'ABBV', long_name: 'AbbVie Inc' },
    { name: 'APD', long_name: 'Air Products & Chemicals Inc' },
    { name: 'ATO', long_name: 'Atmos Energy Corp' },
    { name: 'BAC', long_name: 'Bank of America Corp' },
    { name: 'BEN', long_name: 'Franklin Resources Inc.' },
    { name: 'CINF', long_name: 'Cincinnati Financial Corp' },
    { name: 'CLX', long_name: 'Clorox Co' },
    { name: 'CVX', long_name: 'Chevron' },
    { name: 'D', long_name: 'Dominion Energy Inc' },
    { name: 'DLR', long_name: 'Digital Realty Trust Inc' },
    { name: 'DUK', long_name: 'Duke Energy Corp' },
    { name: 'ED', long_name: 'Consolidated Edison Inc' },
    { name: 'ENB', long_name: 'Enbridge Inc' },
    { name: 'ESS', long_name: 'Essex Property Trust Inc' },
    { name: 'FRT', long_name: 'Federal Realty Investment Trust' },
    { name: 'GPC', long_name: 'Genuine Parts Co' },
    { name: 'HRL', long_name: 'Hormel Foods Corp' },
    { name: 'IBM', long_name: 'International Business Machines Corporation (IBM)' },
    { name: 'JNJ', long_name: 'Johnson & Johnson' },
    { name: 'JPM', long_name: 'JPMorgan Chase & Co' },
    { name: 'KMB', long_name: 'Kimberly-Clark Corp' },
    { name: 'KMI', long_name: 'Kinder Morgan Inc' },
    { name: 'KO', long_name: 'Coca-Cola' },
    { name: 'LEG', long_name: 'Leggett & Platt Inc' },
    { name: 'MCD', long_name: "McDonald's" },
    { name: 'MDT.US', long_name: 'Medtronic PLC' },
    { name: 'MMM', long_name: '3M' },
    { name: 'MO', long_name: 'Altria Group Inc' },
    { name: 'NEE', long_name: 'NextEra Energy Inc' },
    { name: 'O', long_name: 'Realty Income Corp' },
    { name: 'PEP', long_name: 'PepsiCo' },
    { name: 'PG', long_name: 'Procter & Gamble Co' },
    { name: 'STAG', long_name: 'STAG Industrial Inc.' },
    { name: 'SWK', long_name: 'Stanley Black & Decker Inc' },
    { name: 'SYY', long_name: 'Sysco Corp' },
    { name: 'T', long_name: 'AT&T Inc' },
    { name: 'TGT', long_name: 'Target Corp' },
    { name: 'TROW', long_name: 'T Rowe Price Group Inc' },
    { name: 'TXN', long_name: 'Texas Instruments Inc' },
    { name: 'UGI', long_name: 'UGI Corp' },
    { name: 'UPS', long_name: 'United Parcel Service Inc' },
    { name: 'VZ', long_name: 'Verizon' },
    { name: 'WBA', long_name: 'Walgreens Boots Alliance Inc' },
    { name: 'XOM', long_name: 'Exxon-Mobil' },
    
    // European Companies
    { name: 'A2A.MI', long_name: 'A2A Group' },
    { name: 'ALV.DE', long_name: 'Allianz SE' },
    { name: 'AMCR', long_name: 'Amcor PLC' },
    { name: 'BBVA.MC', long_name: 'BBVA' },
    { name: 'CABK.MC', long_name: 'Caixabank' },
    { name: 'DHL.DE', long_name: 'Deutsche Post AG' },
    { name: 'EN.PA', long_name: 'Bouygues SA' },
    { name: 'ENG.MC', long_name: 'Enagas' },
    { name: 'G.MI', long_name: 'Assicurazioni Generali SpA' },
    { name: 'REP.MC', long_name: 'Repsol' },
    { name: 'SAB.MC', long_name: 'Banco Sabadell' },
    { name: 'UPM.HE', long_name: 'UPM-Kymmene Oyj' },
];

/**
 * Gets the short name by matching the long company name
 * Returns the short ticker symbol or undefined if not found
 */
export function getNameByLongName(longName: string): string | undefined {
    if (!longName) return undefined;
    
    const foundItem = dataSource.find(item => 
        item.long_name.toLowerCase() === longName.toLowerCase().trim()
    );
    return foundItem?.name;
}

/**
 * Gets the long company name by matching the short ticker symbol
 * Returns the full company name or undefined if not found
 */
export function getLongNameByName(shortName: string): string | undefined {
    if (!shortName) return undefined;
    
    const foundItem = dataSource.find(item => 
        item.name.toLowerCase() === shortName.toLowerCase().trim()
    );
    return foundItem?.long_name;
}

/**
 * Gets all available company mappings
 * Returns array of all companies with their short and long names
 */
export function getAllCompanies(): typeof dataSource {
    return [...dataSource];
}

/**
 * Searches for companies by partial name match (both short and long names)
 * Returns array of matching companies
 */
export function searchCompanies(searchTerm: string): typeof dataSource {
    if (!searchTerm) return [];
    
    const term = searchTerm.toLowerCase().trim();
    return dataSource.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.long_name.toLowerCase().includes(term)
    );
}

