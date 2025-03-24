// App.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import ClipLoader from 'react-spinners/ClipLoader';
import localforage from 'localforage';
import { motion, AnimatePresence } from 'framer-motion';

// Define string similarity function for comparing text
const stringSimilarity = {
  compareTwoStrings: (str1, str2) => {
    if (!str1 || !str2) return 0;
    
    // Convert to lowercase strings
    const s1 = String(str1).toLowerCase();
    const s2 = String(str2).toLowerCase();
    
    // Quick check for equality
    if (s1 === s2) return 1;
    
    // Quick check for completely different lengths
    if (Math.abs(s1.length - s2.length) > s1.length * 0.7) return 0;
    
    // Convert to character arrays and get common character count
    const charMap = {};
    
    for (const char of s1) {
      charMap[char] = (charMap[char] || 0) + 1;
    }
    
    let matchCount = 0;
    
    for (const char of s2) {
      if (charMap[char] && charMap[char] > 0) {
        charMap[char]--;
        matchCount++;
      }
    }
    
    // Calculate similarity
    return (2 * matchCount) / (s1.length + s2.length);
  }
};

// Define constants
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIPEDIA_REST_API_URL = 'https://en.wikipedia.org/api/rest_v1';
// Remove CORS proxy as it requires approval
// const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

// Initialize the cache store
localforage.config({
  name: 'kaalchitra-cache',
  storeName: 'historical-data'
});

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOpening, setShowOpening] = useState(true);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [titleHovered, setTitleHovered] = useState(false);
  const [isTopicChanging, setIsTopicChanging] = useState(false);
  const [prevCategory, setPrevCategory] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef(null);

  // Keywords indicating significant events - wrapped in useMemo
  const keyEventIndicators = useMemo(() => [
    'war', 'revolution', 'discovery', 'invention', 'founded', 'established',
    'independence', 'battle', 'pandemic', 'disaster', 'treaty', 'assassination',
    'coronation', 'birth', 'death', 'declared', 'invented', 'discovered',
    'began', 'ended', 'signed', 'published', 'first', 'historic', 'milestone'
  ], []);

  // Content type detection patterns - wrapped in useMemo
  const personPatterns = useMemo(() => [
    'born', 'died', 'birth', 'death', 'biography', 'philosopher', 'scientist',
    'inventor', 'leader', 'king', 'queen', 'emperor', 'president', 'prime minister',
    'artist', 'musician', 'writer', 'deity', 'god', 'goddess', 'divine', 'avatar',
    'incarnation', 'worship', 'devotion', 'temple', 'sacred', 'holy', 'religious'
  ], []);

  const innovationPatterns = useMemo(() => [
    'invention', 'invented', 'discovery', 'discovered', 'technology', 'innovation',
    'developed', 'created', 'designed', 'patent', 'breakthrough', 'scientific'
  ], []);

  // Function to clean search query and handle special cases - Define this early
  const cleanSearchQuery = useCallback((query) => {
    if (!query) return '';
    
    // Standardize the query
    let cleanedQuery = query.trim();
    
    // Handle common prefixes for Indian names/deities
    const prefixes = ['shree', 'shri', 'sri', 'lord', 'ishree', 'bhagwan', 'god'];
    for (const prefix of prefixes) {
      if (cleanedQuery.toLowerCase().startsWith(prefix + ' ')) {
        cleanedQuery = cleanedQuery.substring(prefix.length + 1);
        break;
      }
    }
    
    // Special cases for religious/mythological figures
    const specialCases = {
      'krishna': 'Krishna',
      'ram': 'Rama',
      'rama': 'Rama',
      'hanuman': 'Hanuman',
      'ganesh': 'Ganesha',
      'ganesha': 'Ganesha',
      'buddha': 'Gautama Buddha',
      'jesus': 'Jesus Christ',
      'christ': 'Jesus Christ',
      'muhammad': 'Muhammad',
      'vishnu': 'Vishnu',
      'shiva': 'Shiva',
      'shiv': 'Shiva',
      'ramayan': 'Ramayana',
      'ramayana': 'Ramayana',
      'mahabharat': 'Mahabharata',
      'mahabharata': 'Mahabharata',
      'durga': 'Durga',
      'lakshmi': 'Lakshmi',
      'zeus': 'Zeus',
      'athena': 'Athena',
      'hercules': 'Hercules',
      'odin': 'Odin',
      'thor': 'Thor',
      'ra': 'Ra',
      'osiris': 'Osiris',
      'vedas': 'Vedas',
      'bible': 'Bible',
      'quran': 'Quran',
      'koran': 'Quran',
      'vajra': 'Vajra',
      'mjolnir': 'Mjolnir',
      'excalibur': 'Excalibur',
      'trishul': 'Trishul',
      'trident': 'Trishul',
      'sudarshana chakra': 'Sudarshana Chakra',
      'chakra': 'Sudarshana Chakra',
      'gungnir': 'Gungnir',
      'aegis': 'Aegis',
      'gae bulg': 'Gáe Bulg',
      'pashupatastra': 'Pashupatastra',
      'brahmastra': 'Brahmastra',
      'brahma astra': 'Brahmastra',
      'guru nanak': 'Guru Nanak',
      'gautama buddha': 'Buddha',
      'vikramaditya': 'Vikramaditya',
      'ashoka': 'Ashoka',
      'akbar': 'Akbar',
      'jerusalem': 'Jerusalem',
      'mecca': 'Mecca',
      'varanasi': 'Varanasi',
      'kashi': 'Varanasi',
      
      // Empires
      'roman empire': 'Roman Empire',
      'rome': 'Roman Empire',
      'byzantine empire': 'Byzantine Empire',
      'byzantium': 'Byzantine Empire',
      'ottoman empire': 'Ottoman Empire',
      'ottoman': 'Ottoman Empire',
      'mongol empire': 'Mongol Empire',
      'mongols': 'Mongol Empire',
      'mughal empire': 'Mughal Empire',
      'mughals': 'Mughal Empire',
      'british empire': 'British Empire',
      
      // Historical Personalities
      'alexander the great': 'Alexander the Great',
      'alexander': 'Alexander the Great',
      'julius caesar': 'Julius Caesar',
      'caesar': 'Julius Caesar',
      'cleopatra': 'Cleopatra',
      'genghis khan': 'Genghis Khan',
      'temujin': 'Genghis Khan',
      'napoleon': 'Napoleon Bonaparte',
      'napoleon bonaparte': 'Napoleon Bonaparte',
      'leonardo': 'Leonardo da Vinci',
      'leonardo da vinci': 'Leonardo da Vinci',
      'michelangelo': 'Michelangelo',
      'einstein': 'Albert Einstein',
      'albert einstein': 'Albert Einstein',
      'gandhi': 'Mahatma Gandhi',
      'mahatma gandhi': 'Mahatma Gandhi',
      'mandela': 'Nelson Mandela',
      'nelson mandela': 'Nelson Mandela',
      'chanakya': 'Chanakya',
      'kautilya': 'Chanakya',
      'vishnugupta': 'Chanakya',
      'arthashastra': 'Chanakya',
      
      // Mahabharata figures
      'arjuna': 'Arjuna',
      'arjun': 'Arjuna',
      'partha': 'Arjuna',
      'savyasachi': 'Arjuna',
      'dhananjaya': 'Arjuna',
      'bhishma': 'Bhishma',
      'bhishm': 'Bhishma',
      'devavrata': 'Bhishma',
      'draupadi': 'Draupadi',
      'panchali': 'Draupadi',
      'krishnaa': 'Draupadi',
      'karna': 'Karna',
      'radheya': 'Karna',
      'vasusena': 'Karna',
      
      // Other religious figures
      'moses': 'Moses',
      'mary': 'Mary',
      'virgin mary': 'Mary',
      'mother mary': 'Mary',
      'blessed virgin': 'Mary',
      'confucius': 'Confucius',
      'kong qiu': 'Confucius',
      'kong fuzi': 'Confucius',
      'lao tzu': 'Lao Tzu',
      'laozi': 'Lao Tzu',
      'saint peter': 'Saint Peter',
      'peter': 'Saint Peter',
      'peter the apostle': 'Saint Peter',
      
      // Add detailed entries for Subhash Chandra Bose
      'Subhash Chandra Bose': {
        birth: 1897,
        events: [
          { year: 1897, description: "Subhash Chandra Bose was born in Cuttack, Orissa Division, Bengal Province", isSignificant: true },
          { year: 1919, description: "Bose graduated from Scottish Church College and went to England to prepare for Indian Civil Service", isSignificant: true },
          { year: 1921, description: "Bose resigned from the prestigious Indian Civil Service to join India's independence movement", isSignificant: true },
          { year: 1923, description: "Bose was elected President of the All India Youth Congress and Secretary of Bengal State Congress", isSignificant: true },
          { year: 1924, description: "Bose became Chief Executive Officer of Calcutta Municipal Corporation with Das as Mayor", isSignificant: true },
          { year: 1925, description: "Bose was arrested and sent to prison in Mandalay for nationalist activities", isSignificant: true },
          { year: 1927, description: "After release, Bose became General Secretary of Congress party and worked with Jawaharlal Nehru", isSignificant: true },
          { year: 1930, description: "Bose was imprisoned during Civil Disobedience Movement", isSignificant: true },
          { year: 1937, description: "Bose was elected President of the Indian National Congress", isSignificant: true },
          { year: 1938, description: "Bose was re-elected Congress President but resigned due to differences with Gandhi", isSignificant: true },
          { year: 1939, description: "Bose formed the Forward Bloc within the Indian National Congress", isSignificant: true },
          { year: 1941, description: "Bose escaped from British surveillance from his Calcutta house and fled to Germany", isSignificant: true },
          { year: 1942, description: "In Berlin, Bose organized the Indian Legion, consisting of Indian prisoners of war", isSignificant: true },
          { year: 1943, description: "Bose traveled to Japan and took leadership of the Indian National Army (INA)", isSignificant: true },
          { year: 1943, description: "Bose established the Provisional Government of Free India (Azad Hind) in Singapore", isSignificant: true },
          { year: 1944, description: "INA under Bose's leadership fought alongside Japanese forces against the British in Imphal-Kohima", isSignificant: true },
          { year: 1945, description: "Bose reportedly died in a plane crash in Taiwan on August 18, though controversies surround his death", isSignificant: true },
          { year: 1956, description: "The Shah Nawaz Committee, set up by the Indian government, concluded that Bose died in the plane crash", isSignificant: true },
          { year: 1992, description: "The Justice Mukherjee Commission was set up to probe Bose's death", isSignificant: true },
          { year: 2015, description: "Indian government began declassifying files related to Bose", isSignificant: true },
          { year: 2018, description: "Bose's statue was unveiled at India Gate in Delhi", isSignificant: true },
          { year: 2022, description: "A 28-foot-tall hologram statue of Bose was installed at India Gate before permanent granite statue", isSignificant: true },
          { year: 2023, description: "Prime Minister Modi inaugurated the permanent granite statue of Bose at India Gate", isSignificant: true },
          { year: 2024, description: "Commemorations continued across India honoring Bose's 127th birth anniversary", isSignificant: true }
        ]
      },
      
      // Add comprehensive timeline for India's independence
      'India Independence': {
        events: [
          { year: 1600, description: "East India Company established, marking the beginning of British commercial interests in India", isSignificant: true },
          { year: 1757, description: "Battle of Plassey: Robert Clive led the East India Company to victory, establishing British dominance in Bengal", isSignificant: true },
          { year: 1857, description: "The First War of Indian Independence (Sepoy Mutiny) erupted against British rule", isSignificant: true },
          { year: 1858, description: "British Crown took direct control of India from the East India Company", isSignificant: true },
          { year: 1885, description: "Indian National Congress was founded, becoming India's first modern nationalist movement", isSignificant: true },
          { year: 1905, description: "Partition of Bengal by Lord Curzon triggered the Swadeshi Movement", isSignificant: true },
          { year: 1906, description: "All-India Muslim League was founded in Dhaka", isSignificant: true },
          { year: 1915, description: "Mahatma Gandhi returned to India from South Africa", isSignificant: true },
          { year: 1919, description: "Jallianwala Bagh Massacre in Amritsar shocked the nation", isSignificant: true },
          { year: 1920, description: "Non-Cooperation Movement launched under Gandhi's leadership", isSignificant: true },
          { year: 1930, description: "Gandhi led the Civil Disobedience Movement, beginning with the Salt March to Dandi", isSignificant: true },
          { year: 1935, description: "Government of India Act provided for provincial autonomy and a federal structure", isSignificant: true },
          { year: 1942, description: "Quit India Movement launched by Gandhi demanding immediate independence", isSignificant: true },
          { year: 1943, description: "Subhash Chandra Bose formed the Azad Hind Government and reorganized the Indian National Army", isSignificant: true },
          { year: 1946, description: "Royal Indian Navy Mutiny erupted, displaying widespread anti-British sentiment", isSignificant: true },
          { year: 1946, description: "Cabinet Mission proposed a federal structure for an independent India", isSignificant: true },
          { year: 1947, description: "Lord Mountbatten announced the Partition Plan on June 3", isSignificant: true },
          { year: 1947, description: "Indian Independence Act was passed by the British Parliament in July", isSignificant: true },
          { year: 1947, description: "India gained independence on August 15; Jawaharlal Nehru became the first Prime Minister", isSignificant: true },
          { year: 1947, description: "Partition of India led to massive population exchange and communal violence", isSignificant: true },
          { year: 1948, description: "Mahatma Gandhi was assassinated on January 30", isSignificant: true },
          { year: 1950, description: "India adopted its Constitution and became a Republic on January 26", isSignificant: true },
          { year: 1951, description: "First general elections held in independent India", isSignificant: true },
          { year: 1962, description: "Indo-China War resulted in a defeat for India", isSignificant: true },
          { year: 1965, description: "Indo-Pakistan War ended in a stalemate", isSignificant: true },
          { year: 1971, description: "Indo-Pakistan War led to the creation of Bangladesh", isSignificant: true },
          { year: 1975, description: "Emergency was declared by Prime Minister Indira Gandhi, suspending civil liberties", isSignificant: true },
          { year: 1977, description: "Janata Party formed the first non-Congress government at the center", isSignificant: true },
          { year: 1984, description: "Operation Blue Star at Golden Temple followed by assassination of Indira Gandhi", isSignificant: true },
          { year: 1991, description: "Economic liberalization began under P.V. Narasimha Rao government", isSignificant: true },
          { year: 1998, description: "India conducted nuclear tests, declaring itself a nuclear power", isSignificant: true },
          { year: 1999, description: "Kargil War with Pakistan ended with India regaining control of occupied territories", isSignificant: true },
          { year: 2000, description: "India's population crossed 1 billion", isSignificant: true },
          { year: 2014, description: "Narendra Modi became Prime Minister, leading BJP to the first single-party majority since 1984", isSignificant: true },
          { year: 2019, description: "Article 370 was abrogated, revoking the special status of Jammu and Kashmir", isSignificant: true },
          { year: 2020, description: "India faced the COVID-19 pandemic with nationwide lockdowns", isSignificant: true },
          { year: 2022, description: "India celebrated 75 years of independence with the 'Azadi Ka Amrit Mahotsav' initiative", isSignificant: true },
          { year: 2023, description: "India assumed G20 presidency and hosted the summit in New Delhi", isSignificant: true },
          { year: 2023, description: "Chandrayaan-3 successfully landed on the Moon's south pole, making India the fourth country to land on the Moon", isSignificant: true },
          { year: 2024, description: "India held its 18th general election, the largest democratic exercise in world history", isSignificant: true }
        ]
      }
    };
    
    const lowerQuery = cleanedQuery.toLowerCase();
    if (specialCases[lowerQuery]) {
      cleanedQuery = specialCases[lowerQuery];
    }
    
    return cleanedQuery;
  }, []);

  // Function to detect event type
  const detectEventType = useCallback((description) => {
    const lowerDesc = description.toLowerCase();
    
    if (personPatterns.some(pattern => lowerDesc.includes(pattern))) {
      return 'people';
    }
    
    if (innovationPatterns.some(pattern => lowerDesc.includes(pattern))) {
      return 'innovations';
    }
    
    return 'events';
  }, [personPatterns, innovationPatterns]);

  // Function to extract precise dates using regex
  const extractPreciseDate = (description) => {
    const fullDateRegex = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}\b/gi;
    const altDateRegex = /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b/gi;
    
    const fullDateMatch = description.match(fullDateRegex);
    const altDateMatch = description.match(altDateRegex);
    
    if (fullDateMatch) return fullDateMatch[0];
    if (altDateMatch) return altDateMatch[0];
    
    return null;
  };

  // Opening animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOpening(false);
      // Focus on search input after opening animation
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 500);
    }, 2800); // Extended to 2.8 seconds to let animations complete

    return () => clearTimeout(timer);
  }, []);

  // Function to check if event is significant
  const isSignificantEvent = useCallback((description) => {
    const lowerDesc = description.toLowerCase();
    return keyEventIndicators.some(keyword => lowerDesc.includes(keyword));
  }, [keyEventIndicators]);

  // Function to validate years
  const validateYear = (year, title, extractText) => {
    // Current year
    const currentYear = new Date().getFullYear();
    
    // Check if year is impossible given the title/subject
    const modernFigures = [
      { name: 'narendra modi', birthYear: 1950 },
      { name: 'donald trump', birthYear: 1946 },
      { name: 'joe biden', birthYear: 1942 },
      { name: 'subhash chandra bose', birthYear: 1897, deathYear: 1945 },
      // Add other modern figures as needed
    ];
    
    // Check against modern figures
    const lowerTitle = title.toLowerCase();
    for (const figure of modernFigures) {
      if (lowerTitle.includes(figure.name)) {
        if (year < figure.birthYear - 5) { // Allow slight flexibility
          return false; // Invalid year for this figure
        }
        
        if (figure.deathYear && year > figure.deathYear + 5) {
          // For events after death, we allow them if they're about legacy
          const extractLower = extractText.toLowerCase();
          const legacyTerms = ['legacy', 'posthumous', 'memorial', 'remembrance', 'anniversary'];
          const isLegacyEvent = legacyTerms.some(term => extractLower.includes(term));
          
          if (!isLegacyEvent) {
            return false;
          }
        }
      }
    }

    // Filter out potential numeric references that could be misinterpreted as years
    const lowerExtract = extractText.toLowerCase();
    
    // Check for INA officers count misinterpretation
    if (year < 1900 && lowerExtract.includes('ina') && 
       (lowerExtract.includes('officers') || lowerExtract.includes('soldiers'))) {
      // Look for patterns like "300 INA officers" that might be misinterpreted as years
      const inaPattern = new RegExp(`\\b${year}\\s+(?:ina|indian national army)`, 'i');
      if (inaPattern.test(lowerExtract)) {
        return false;
      }
    }
    
    // Check for independence movement number references
    if (year < 1900 && 
       (lowerExtract.includes('independence') || lowerExtract.includes('movement') || 
        lowerExtract.includes('congress') || lowerExtract.includes('nationalist'))) {
      // Look for patterns like "300 members" or "300 protesters" etc.
      const numberPattern = new RegExp(`\\b${year}\\s+(?:members|protesters|people|participants|followers)`, 'i');
      if (numberPattern.test(lowerExtract)) {
        return false;
      }
    }
    
    // Basic range validation
    if (year > currentYear + 100) { // Allow for some future predictions, but not too far
      return false;
    }
    
    // If year is 0, it's likely an error (year 0 doesn't exist in calendar)
    if (year === 0) {
      return false;
    }
    
    return true;
  };

  // Function to fetch data for a specific page
  const fetchPageData = useCallback(async (pageid, title, previousThumbnail = null) => {
    try {
      // Check if this page has already been processed
      const cacheKey = `page_${pageid}`;
      const cachedData = await localforage.getItem(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const params = {
        action: 'query',
        prop: 'extracts|pageimages',
        exintro: 1,
        explaintext: 1,
        pageids: pageid,
        format: 'json',
        pithumbsize: 300,
        redirects: 1,
        origin: '*' // This is critical for CORS
      };
      
      // Use axios instead of fetch for better browser compatibility
      try {
        const response = await axios.get(WIKIPEDIA_API_URL, { params });
        const data = response.data;
        
        if (!data || !data.query || !data.query.pages || !data.query.pages[pageid]) {
          console.error('Invalid page data received');
          return null;
        }
        
        const page = data.query.pages[pageid];
        const extract = page.extract || '';
        
        // Use previous thumbnail if available, otherwise try to get a new one
        let thumbnail = null;
        if (previousThumbnail) {
          thumbnail = previousThumbnail;
        } else if (page.thumbnail && page.thumbnail.source) {
          thumbnail = page.thumbnail.source;
        }
        
        // Clean up the text to ensure consistency
        const cleanText = cleanupText(extract);
        
        // Extract years using improved regex to avoid invalid year matches
        // This regex now matches years more accurately by requiring proper context
        // For BCE years, we'll handle with a separate regex
        const yearRegex = /\b(?:in|around|circa|year|during|by)\s+([1-9]\d{2,3})\b(?:\s*(?:AD|CE))?/gi;
        const yearRegex2 = /\b([1-9]\d{2,3})\b(?:\s*(?:AD|CE))?\s+(?:was|is|marks|saw|marked)/gi;
        const bceYearRegex = /\b(?:in|around|circa|year|during|by)\s+([1-9]\d{0,3})\s*(?:BC|BCE)\b/gi;
        const bceYearRegex2 = /\b([1-9]\d{0,3})\s*(?:BC|BCE)\b\s+(?:was|is|marks|saw|marked)/gi;
        
        // Helper function to extract year matches
        const extractYearMatches = (text, regex) => {
          const matches = [];
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            // The first capturing group is the actual year
            if (match[1]) {
              matches.push(parseInt(match[1], 10));
            }
          }
          
          return matches;
        };
        
        // Extract years with proper context
        let yearMatches = [
          ...extractYearMatches(cleanText, yearRegex),
          ...extractYearMatches(cleanText, yearRegex2)
        ];
        
        // Process BCE matches to convert to negative years
        const processedBceMatches = [
          ...extractYearMatches(cleanText, bceYearRegex),
          ...extractYearMatches(cleanText, bceYearRegex2)
        ].map(year => -year);
        
        // Combine both types of years
        const allYears = [...yearMatches, ...processedBceMatches];
        
        // Get valid years - pass extract text for context validation
        const validYears = allYears.filter(year => validateYear(year, title, cleanText));
        
        // If this is a person, try to get biographical data
        let biographicalData = null;
        const isPerson = personPatterns.some(pattern => cleanText.toLowerCase().includes(pattern));
        
        if (isPerson) {
          try {
            biographicalData = await fetchBiographicalData(title);
          } catch (bioError) {
            console.error('Error fetching biographical data:', bioError);
          }
        }
        
        // Extract precise dates
        const datesInfo = extractPreciseDates(cleanText);
        
        // Calculate a significance score
        const significanceScore = calculateSignificanceScore(cleanText, title);
        
        // Determine content type
        const contentType = determineContentType(cleanText, title);
        
        const result = {
          id: pageid,
          title,
          extract: cleanText,
          thumbnail,
          years: validYears.length > 0 ? validYears : null,
          dates: datesInfo,
          significanceScore,
          contentType,
          biographicalData
        };
        
        // Cache the result
        await localforage.setItem(cacheKey, result);
        
        return result;
      } catch (fetchError) {
        console.error('Error fetching page data:', fetchError);
        return null;
      }
    } catch (error) {
      console.error(`Error processing page ${pageid}:`, error);
      return null;
    }
  }, []);

  // Fetch biographical data using Wikipedia's REST API
  const fetchBiographicalData = useCallback(async (title) => {
    try {
      console.log(`Fetching biographical data for: "${title}"`);
      
      // Special handling for religious/mythological figures
      const religiousFigures = {
        'Krishna': {
          birth: -3228, // Approximate traditional birth year according to some beliefs
          events: [
            { year: -3228, description: "Krishna was born in Mathura to Devaki and Vasudeva", isSignificant: true },
            { year: -3228, description: "Krishna was taken to Gokul to be raised by Yashoda and Nanda", isSignificant: true },
            { year: -3200, description: "Krishna lifted Govardhan Hill to protect villagers from Indra's rains", isSignificant: true },
            { year: -3175, description: "Krishna moved to Dwarka and established his kingdom", isSignificant: true },
            { year: -3138, description: "Krishna participated in the Mahabharata war as Arjuna's charioteer and delivered the Bhagavad Gita", isSignificant: true },
            { year: -3102, description: "Krishna departed from the world, marking the beginning of the Kali Yuga", isSignificant: true }
          ]
        },
        'Rama': {
          birth: -5114, // Approximate traditional date
          events: [
            { year: -5114, description: "Rama was born in Ayodhya to King Dasharatha and Queen Kausalya", isSignificant: true },
            { year: -5090, description: "Rama married Sita after breaking Lord Shiva's bow", isSignificant: true },
            { year: -5089, description: "Rama was exiled for 14 years to the forest", isSignificant: true },
            { year: -5077, description: "Rama defeated Ravana and rescued Sita", isSignificant: true },
            { year: -5076, description: "Rama returned to Ayodhya and was crowned king", isSignificant: true }
          ]
        },
        'Ramayana': {
          events: [
            { year: -5090, description: "The Ramayana epic begins with Rama's marriage to Sita", isSignificant: true },
            { year: -5089, description: "Rama, Lakshmana and Sita leave Ayodhya for 14 years of exile", isSignificant: true },
            { year: -5080, description: "Ravana abducts Sita and takes her to Lanka", isSignificant: true },
            { year: -5077, description: "Rama, with the help of Hanuman and the monkey army, defeats Ravana", isSignificant: true },
            { year: -5076, description: "Rama returns to Ayodhya and is crowned king, establishing Rama Rajya", isSignificant: true }
          ]
        },
        'Mahabharata': {
          events: [
            { year: -3140, description: "The Kurukshetra War begins between the Pandavas and Kauravas", isSignificant: true },
            { year: -3139, description: "Krishna delivers the Bhagavad Gita to Arjuna on the battlefield", isSignificant: true },
            { year: -3138, description: "The 18-day Kurukshetra War results in the defeat of the Kauravas", isSignificant: true },
            { year: -3138, description: "Yudhishthira is crowned king after the war", isSignificant: true },
            { year: -3102, description: "The Pandavas renounce their kingdom and begin their final journey", isSignificant: true }
          ]
        },
        // Hindu Gods and Goddesses
        'Shiva': {
          birth: -10000, // Symbolic - Shiva is considered eternal
          events: [
            { year: -8000, description: "Shiva performed the cosmic dance (Tandava) of creation and destruction", isSignificant: true },
            { year: -7500, description: "Shiva married Parvati after intense meditation and penance", isSignificant: true },
            { year: -7000, description: "Shiva drank the poison Halahala during the churning of the ocean (Samudra Manthan)", isSignificant: true },
            { year: -5000, description: "Shiva's form as Nataraja became widely worshipped in southern India", isSignificant: true }
          ]
        },
        'Vishnu': {
          birth: -10000, // Symbolic - Vishnu is considered eternal
          events: [
            { year: -9000, description: "Vishnu's first avatar Matsya (fish) saved Manu from the great deluge", isSignificant: true },
            { year: -8500, description: "Vishnu's second avatar Kurma (turtle) supported Mount Mandara during the churning of the ocean", isSignificant: true },
            { year: -8000, description: "Vishnu's third avatar Varaha (boar) rescued Earth from the cosmic waters", isSignificant: true },
            { year: -7500, description: "Vishnu's fourth avatar Narasimha (half-man, half-lion) defeated the demon king Hiranyakashipu", isSignificant: true },
            { year: -5200, description: "Vishnu's eighth avatar Krishna was born in Mathura", isSignificant: true }
          ]
        },
        'Ganesha': {
          birth: -7000, // Symbolic date
          events: [
            { year: -7000, description: "Ganesha was created by Goddess Parvati and later beheaded by Lord Shiva", isSignificant: true },
            { year: -6999, description: "Ganesha received an elephant head from Lord Shiva", isSignificant: true },
            { year: -6900, description: "Ganesha won the race around the world by circumambulating his parents", isSignificant: true },
            { year: -6000, description: "Ganesha wrote down the Mahabharata as dictated by sage Vyasa", isSignificant: true },
            { year: -5000, description: "Ganesha became known as the remover of obstacles and god of new beginnings", isSignificant: true }
          ]
        },
        'Hanuman': {
          birth: -5200, // Symbolic traditional date
          events: [
            { year: -5200, description: "Hanuman was born to Anjana and Kesari, with divine essence from Lord Shiva", isSignificant: true },
            { year: -5190, description: "Young Hanuman leapt for the sun, mistaking it for a fruit", isSignificant: true },
            { year: -5080, description: "Hanuman met Lord Rama during his exile and became his devoted servant", isSignificant: true },
            { year: -5079, description: "Hanuman leapt across the ocean to Lanka in search of Sita", isSignificant: true },
            { year: -5078, description: "Hanuman set Lanka on fire with his burning tail", isSignificant: true },
            { year: -5077, description: "Hanuman brought the Sanjeevani herb to save Lakshmana's life during the war", isSignificant: true }
          ]
        },
        'Durga': {
          birth: -8000, // Symbolic date
          events: [
            { year: -8000, description: "Goddess Durga was created by combined energies of all gods to defeat the buffalo demon Mahishasura", isSignificant: true },
            { year: -7999, description: "Durga battled with Mahishasura for nine days and nights", isSignificant: true },
            { year: -7998, description: "Durga slayed Mahishasura on the tenth day, which is celebrated as Vijayadashami", isSignificant: true },
            { year: -6000, description: "Durga defeated the demons Shumbha and Nishumbha", isSignificant: true },
            { year: -5000, description: "Durga worship became widespread in ancient India", isSignificant: true }
          ]
        },
        'Lakshmi': {
          birth: -8500, // Symbolic date connected to Samudra Manthan
          events: [
            { year: -8500, description: "Goddess Lakshmi emerged from the churning of the cosmic ocean (Samudra Manthan)", isSignificant: true },
            { year: -8499, description: "Lakshmi chose Lord Vishnu as her eternal consort", isSignificant: true },
            { year: -5200, description: "Lakshmi incarnated as Radha, the beloved of Lord Krishna", isSignificant: true },
            { year: -5100, description: "Lakshmi incarnated as Sita, the wife of Lord Rama", isSignificant: true },
            { year: -2500, description: "The worship of Lakshmi during Diwali became a major tradition", isSignificant: true }
          ]
        },
        
        // Greek/Roman Mythology
        'Zeus': {
          birth: -5000, // Symbolic date
          events: [
            { year: -5000, description: "Zeus was born to Titans Cronus and Rhea, and hidden on the island of Crete", isSignificant: true },
            { year: -4990, description: "Zeus overthrew his father Cronus and freed his siblings from his father's stomach", isSignificant: true },
            { year: -4980, description: "Zeus led the Olympians to victory against the Titans in the ten-year Titanomachy", isSignificant: true },
            { year: -4950, description: "Zeus divided the world with his brothers: Poseidon (sea) and Hades (underworld)", isSignificant: true },
            { year: -4800, description: "Zeus married his sister Hera, becoming the king and queen of the gods", isSignificant: true }
          ]
        },
        'Athena': {
          birth: -4900, // Symbolic date
          events: [
            { year: -4900, description: "Athena was born fully grown and armored from the forehead of Zeus", isSignificant: true },
            { year: -4500, description: "Athena competed with Poseidon for patronage of Athens, offering the olive tree", isSignificant: true },
            { year: -4200, description: "Athena helped Perseus defeat Medusa by giving him a polished shield", isSignificant: true },
            { year: -3500, description: "Athena assisted Odysseus during his ten-year journey home from Troy", isSignificant: true },
            { year: -800, description: "The Parthenon was built in Athens to honor Athena", isSignificant: true }
          ]
        },
        'Hercules': {
          birth: -1300, // Semi-historical date
          events: [
            { year: -1300, description: "Hercules was born to Zeus and the mortal woman Alcmene", isSignificant: true },
            { year: -1280, description: "Infant Hercules strangled two serpents sent by Hera to kill him", isSignificant: true },
            { year: -1270, description: "Hercules was driven mad by Hera and killed his own children", isSignificant: true },
            { year: -1268, description: "Hercules began his Twelve Labors as penance", isSignificant: true },
            { year: -1255, description: "Hercules completed his Twelve Labors and was granted immortality", isSignificant: true },
            { year: -1240, description: "Hercules died and ascended to Mount Olympus after being poisoned", isSignificant: true }
          ]
        },
        
        // Norse Mythology
        'Odin': {
          birth: -6000, // Symbolic date
          events: [
            { year: -6000, description: "Odin and his brothers Vili and Ve slew the primeval giant Ymir", isSignificant: true },
            { year: -5990, description: "Odin and his brothers created the world from Ymir's body", isSignificant: true },
            { year: -5900, description: "Odin hung himself from Yggdrasil for nine days to gain knowledge of the runes", isSignificant: true },
            { year: -5800, description: "Odin sacrificed one of his eyes at Mimir's well to gain wisdom", isSignificant: true },
            { year: -5000, description: "Odin established himself as the All-Father and ruler of Asgard", isSignificant: true }
          ]
        },
        'Thor': {
          birth: -5500, // Symbolic date
          events: [
            { year: -5500, description: "Thor was born to Odin and Jörð (Earth)", isSignificant: true },
            { year: -5400, description: "Thor received his hammer Mjölnir, forged by dwarves", isSignificant: true },
            { year: -5000, description: "Thor fought against the giants to protect Asgard and Midgard", isSignificant: true },
            { year: -4500, description: "Thor fished for the Midgard Serpent, Jörmungandr", isSignificant: true },
            { year: -4000, description: "Thor's worship became widespread among Norse peoples", isSignificant: true }
          ]
        },
        
        // Egyptian Mythology
        'Ra': {
          birth: -8000, // Symbolic date
          events: [
            { year: -8000, description: "Ra emerged from the primordial waters of Nun and created himself", isSignificant: true },
            { year: -7900, description: "Ra created the gods Shu (air) and Tefnut (moisture)", isSignificant: true },
            { year: -7800, description: "Ra created humans from his tears", isSignificant: true },
            { year: -7000, description: "Ra sailed across the sky daily in his solar boat", isSignificant: true },
            { year: -3000, description: "Ra became syncretized with the god Amun as Amun-Ra in ancient Egypt", isSignificant: true }
          ]
        },
        'Osiris': {
          birth: -7500, // Symbolic date
          events: [
            { year: -7500, description: "Osiris was born to Geb (Earth) and Nut (Sky)", isSignificant: true },
            { year: -7400, description: "Osiris became the first pharaoh of Egypt and taught civilization", isSignificant: true },
            { year: -7350, description: "Osiris was murdered by his brother Set, who dismembered his body", isSignificant: true },
            { year: -7349, description: "Isis collected Osiris's body parts and resurrected him temporarily", isSignificant: true },
            { year: -7348, description: "Osiris became the ruler of the afterlife and judge of the dead", isSignificant: true }
          ]
        },
        
        // Religious Texts & Scriptures
        'Vedas': {
          events: [
            { year: -6000, description: "The Rig Veda, oldest of the Vedas, began to be composed", isSignificant: true },
            { year: -4500, description: "The Sama Veda, containing musical chants, was compiled", isSignificant: true },
            { year: -4000, description: "The Yajur Veda, focused on ritual formulas, was compiled", isSignificant: true },
            { year: -3500, description: "The Atharva Veda, with spells and incantations, was compiled", isSignificant: true },
            { year: -1500, description: "The Vedas were systematically organized by Vyasa", isSignificant: true }
          ]
        },
        'Bible': {
          events: [
            { year: -1200, description: "The earliest biblical texts began to be written", isSignificant: true },
            { year: -600, description: "The Torah (first five books) was compiled in its current form", isSignificant: true },
            { year: -200, description: "The Hebrew Bible (Old Testament) was largely completed", isSignificant: true },
            { year: 100, description: "The Gospels and other New Testament texts were written", isSignificant: true },
            { year: 400, description: "The Christian biblical canon was standardized", isSignificant: true }
          ]
        },
        'Quran': {
          events: [
            { year: 610, description: "The first revelations of the Quran were received by Prophet Muhammad", isSignificant: true },
            { year: 632, description: "The revelations of the Quran were completed", isSignificant: true },
            { year: 650, description: "Caliph Uthman ordered the standardization of the Quran's text", isSignificant: true },
            { year: 651, description: "The Uthmanic codex became the standard version of the Quran", isSignificant: true },
            { year: 800, description: "The system of diacritical marks and vowels was developed for the Quran", isSignificant: true }
          ]
        },
        
        // Mythological Weapons
        'Vajra': {
          events: [
            { year: -9000, description: "Vajra was crafted from the bones of sage Dadhichi for Indra", isSignificant: true },
            { year: -8900, description: "Indra used the Vajra to defeat the dragon Vritra", isSignificant: true },
            { year: -7000, description: "The Vajra became the symbol of indestructibility in Hindu and Buddhist traditions", isSignificant: true },
            { year: -600, description: "Vajra symbolism spread to Buddhist traditions across Asia", isSignificant: true }
          ]
        },
        'Mjolnir': {
          events: [
            { year: -5400, description: "Mjolnir was forged by the dwarven brothers Sindri and Brokkr for Thor", isSignificant: true },
            { year: -5300, description: "Thor used Mjolnir to slay giants and protect Asgard", isSignificant: true },
            { year: -4000, description: "Mjolnir became a sacred symbol among Norse worshippers", isSignificant: true },
            { year: -1000, description: "Mjolnir amulets became popular protective symbols in Scandinavia", isSignificant: true }
          ]
        },
        'Excalibur': {
          events: [
            { year: 500, description: "Excalibur was given to King Arthur by the Lady of the Lake", isSignificant: true },
            { year: 510, description: "Arthur proved his kingship by wielding Excalibur", isSignificant: true },
            { year: 540, description: "Arthur used Excalibur in his battles to unite Britain", isSignificant: true },
            { year: 550, description: "As Arthur lay dying, he ordered Excalibur to be returned to the lake", isSignificant: true }
          ]
        },
        'Trishul': {
          events: [
            { year: -9000, description: "Trishul (trident) was created as Lord Shiva's primary weapon", isSignificant: true },
            { year: -8500, description: "Shiva used the Trishul to destroy demons and maintain cosmic order", isSignificant: true },
            { year: -7000, description: "The three prongs of Trishul came to represent creation, preservation, and destruction", isSignificant: true },
            { year: -3000, description: "Trishul became a sacred symbol in Shaivism and Hindu worship", isSignificant: true }
          ]
        },
        'Sudarshana Chakra': {
          events: [
            { year: -9000, description: "Sudarshana Chakra was crafted by Vishwakarma for Lord Vishnu", isSignificant: true },
            { year: -8000, description: "Vishnu used the Sudarshana Chakra to defeat the demon Jalandhara", isSignificant: true },
            { year: -5000, description: "Krishna used the Sudarshana Chakra to defeat numerous enemies", isSignificant: true },
            { year: -3000, description: "The Sudarshana Chakra became a prominent symbol in Vaishnavism", isSignificant: true }
          ]
        },
        'Gungnir': {
          events: [
            { year: -6000, description: "Gungnir, Odin's spear, was forged by the dwarves known as the Sons of Ivaldi", isSignificant: true },
            { year: -5900, description: "Odin carried Gungnir during the war between the Aesir and Vanir gods", isSignificant: true },
            { year: -5800, description: "Odin inscribed Gungnir with magical runes to ensure it never missed its target", isSignificant: true },
            { year: -2000, description: "Gungnir became a symbol of Odin's authority and kingship", isSignificant: true }
          ]
        },
        'Aegis': {
          events: [
            { year: -5000, description: "The Aegis shield was created by Hephaestus (Vulcan) for Zeus", isSignificant: true },
            { year: -4900, description: "Zeus gave the Aegis to Athena, who adorned it with the head of Medusa", isSignificant: true },
            { year: -4500, description: "Athena used the Aegis to terrify her enemies in battle", isSignificant: true },
            { year: -3000, description: "The Aegis became a symbol of divine protection in Greek mythology", isSignificant: true }
          ]
        },
        'Gáe Bulg': {
          events: [
            { year: -500, description: "Gáe Bulg, the spear of Cú Chulainn, was crafted from the bone of a sea monster", isSignificant: true },
            { year: -300, description: "Cú Chulainn received the Gáe Bulg from the warrior woman Scáthach", isSignificant: true },
            { year: -290, description: "Cú Chulainn used the Gáe Bulg to slay his friend and foster-brother, Ferdiad", isSignificant: true },
            { year: -280, description: "The Gáe Bulg became renowned for causing wounds that could not be healed", isSignificant: true }
          ]
        },
        'Pashupatastra': {
          events: [
            { year: -5000, description: "Pashupatastra was created by Lord Shiva as the most powerful weapon", isSignificant: true },
            { year: -4000, description: "Shiva bestowed the Pashupatastra upon Arjuna after he performed penance", isSignificant: true },
            { year: -3200, description: "Arjuna vowed to use the Pashupatastra only against divine foes", isSignificant: true },
            { year: -3138, description: "Arjuna refrained from using the Pashupatastra during the Kurukshetra War", isSignificant: true }
          ]
        },
        'Brahmastra': {
          events: [
            { year: -7000, description: "Brahmastra was created by Lord Brahma as a weapon of last resort", isSignificant: true },
            { year: -6000, description: "The knowledge of the Brahmastra was passed to select sages and warriors", isSignificant: true },
            { year: -4000, description: "The Brahmastra was described as causing devastation similar to modern nuclear weapons", isSignificant: true },
            { year: -3138, description: "Multiple Brahmastras were used during the Kurukshetra War", isSignificant: true }
          ]
        },
        
        // Religious Leaders & Gurus
        'Guru Nanak': {
          birth: 1469,
          events: [
            { year: 1469, description: "Guru Nanak was born in Talwandi (now Nankana Sahib, Pakistan)", isSignificant: true },
            { year: 1499, description: "Guru Nanak received his divine calling after disappearing in a river for three days", isSignificant: true },
            { year: 1500, description: "Guru Nanak began his missionary travels (udasis) across India and beyond", isSignificant: true },
            { year: 1522, description: "Guru Nanak settled in Kartarpur and established a community of followers", isSignificant: true },
            { year: 1539, description: "Guru Nanak appointed Bhai Lehna (Guru Angad) as his successor before his death", isSignificant: true }
          ]
        },
        'Muhammad': {
          birth: 570,
          events: [
            { year: 570, description: "Prophet Muhammad was born in Mecca", isSignificant: true },
            { year: 610, description: "Muhammad received his first revelation from Allah through the angel Gabriel", isSignificant: true },
            { year: 622, description: "Muhammad made the Hijra (migration) from Mecca to Medina, marking the start of the Islamic calendar", isSignificant: true },
            { year: 630, description: "Muhammad returned to Mecca with his followers and conquered the city peacefully", isSignificant: true },
            { year: 632, description: "Muhammad delivered his final sermon and passed away in Medina", isSignificant: true }
          ]
        },
        'Buddha': {
          birth: -563,
          events: [
            { year: -563, description: "Siddhartha Gautama (Buddha) was born in Lumbini to King Suddhodana and Queen Maya", isSignificant: true },
            { year: -534, description: "Siddhartha left his palace to seek enlightenment after seeing the Four Sights", isSignificant: true },
            { year: -528, description: "After six years of asceticism, Siddhartha attained enlightenment under the Bodhi tree", isSignificant: true },
            { year: -527, description: "Buddha delivered his first sermon at Sarnath, setting in motion the Wheel of Dharma", isSignificant: true },
            { year: -483, description: "Buddha attained parinirvana (final nirvana) at Kushinagar at the age of 80", isSignificant: true }
          ]
        },
        
        // Kings and Emperors
        'Vikramaditya': {
          birth: -80,
          events: [
            { year: -80, description: "Vikramaditya was born as a prince of Ujjain", isSignificant: true },
            { year: -57, description: "Vikramaditya defeated the Saka invaders and established the Vikrama Samvat calendar era", isSignificant: true },
            { year: -50, description: "Vikramaditya's court flourished with the nine gems (navaratnas) of science and arts", isSignificant: true },
            { year: -20, description: "Vikramaditya expanded his empire to include much of northern India", isSignificant: true },
            { year: -15, description: "Vikramaditya became known for his justice and wisdom, inspiring many legends", isSignificant: true }
          ]
        },
        'Ashoka': {
          birth: -304,
          events: [
            { year: -304, description: "Ashoka was born to Emperor Bindusara of the Mauryan Empire", isSignificant: true },
            { year: -273, description: "Ashoka ascended to the Mauryan throne after a succession struggle", isSignificant: true },
            { year: -261, description: "Ashoka conquered Kalinga in a bloody war that transformed his outlook", isSignificant: true },
            { year: -260, description: "Ashoka converted to Buddhism and renounced warfare", isSignificant: true },
            { year: -250, description: "Ashoka erected pillars and rock edicts promoting Dharma throughout his empire", isSignificant: true },
            { year: -232, description: "Ashoka died after a 40-year reign that unified most of the Indian subcontinent", isSignificant: true }
          ]
        },
        'Akbar': {
          birth: 1542,
          events: [
            { year: 1542, description: "Akbar was born to Emperor Humayun and Hamida Banu Begum", isSignificant: true },
            { year: 1556, description: "Akbar ascended the Mughal throne at the age of 13 after his father's death", isSignificant: true },
            { year: 1562, description: "Akbar abolished the jizya tax on non-Muslims", isSignificant: true },
            { year: 1571, description: "Akbar began building Fatehpur Sikri as his new capital", isSignificant: true },
            { year: 1582, description: "Akbar founded Din-i-Ilahi, a syncretic religious movement", isSignificant: true },
            { year: 1605, description: "Akbar died, leaving the Mughal Empire at its zenith", isSignificant: true }
          ]
        },
        
        // Famous Empires
        'Roman Empire': {
          events: [
            { year: -753, description: "Legendary founding of Rome by Romulus and Remus", isSignificant: true },
            { year: -509, description: "Roman Republic established after the overthrow of the monarchy", isSignificant: true },
            { year: -27, description: "Augustus became the first Roman Emperor, ending the Republic", isSignificant: true },
            { year: 117, description: "Roman Empire reached its greatest territorial extent under Emperor Trajan", isSignificant: true },
            { year: 285, description: "Emperor Diocletian divided the empire into Western and Eastern regions", isSignificant: true },
            { year: 313, description: "Emperor Constantine issued the Edict of Milan, legalizing Christianity", isSignificant: true },
            { year: 395, description: "The empire was permanently divided into Eastern and Western Roman Empires", isSignificant: true },
            { year: 476, description: "Fall of the Western Roman Empire when Romulus Augustus was deposed", isSignificant: true }
          ]
        },
        'Byzantine Empire': {
          events: [
            { year: 330, description: "Constantine the Great dedicated Constantinople as the new capital", isSignificant: true },
            { year: 537, description: "Hagia Sophia was completed in Constantinople", isSignificant: true },
            { year: 726, description: "Emperor Leo III banned religious icons, beginning the Iconoclasm period", isSignificant: true },
            { year: 1054, description: "The Great Schism split the Christian church into Eastern Orthodox and Roman Catholic", isSignificant: true },
            { year: 1204, description: "Crusaders sacked Constantinople during the Fourth Crusade", isSignificant: true },
            { year: 1261, description: "The Byzantine Empire was restored by Michael VIII Palaeologus", isSignificant: true },
            { year: 1453, description: "Constantinople fell to the Ottoman Turks, ending the Byzantine Empire", isSignificant: true }
          ]
        },
        'Ottoman Empire': {
          events: [
            { year: 1299, description: "Osman I founded the Ottoman dynasty in Anatolia", isSignificant: true },
            { year: 1453, description: "Mehmed II conquered Constantinople, ending the Byzantine Empire", isSignificant: true },
            { year: 1520, description: "Suleiman the Magnificent began his reign, bringing the empire to its peak", isSignificant: true },
            { year: 1571, description: "Ottoman naval power was checked at the Battle of Lepanto", isSignificant: true },
            { year: 1683, description: "Ottoman forces were defeated at the Battle of Vienna, beginning the empire's decline", isSignificant: true },
            { year: 1915, description: "Armenian Genocide occurred during World War I", isSignificant: true },
            { year: 1922, description: "The Ottoman Empire ended with the abolition of the sultanate by Mustafa Kemal Atatürk", isSignificant: true }
          ]
        },
        'Mongol Empire': {
          events: [
            { year: 1162, description: "Genghis Khan (Temüjin) was born in Mongolia", isSignificant: true },
            { year: 1206, description: "Genghis Khan united the Mongolian tribes, founding the Mongol Empire", isSignificant: true },
            { year: 1227, description: "Genghis Khan died, and the empire was divided among his sons", isSignificant: true },
            { year: 1260, description: "Mamluks defeated the Mongols at Ain Jalut, halting their westward expansion", isSignificant: true },
            { year: 1271, description: "Kublai Khan founded the Yuan Dynasty in China", isSignificant: true },
            { year: 1294, description: "Kublai Khan died, marking the beginning of the empire's gradual dissolution", isSignificant: true },
            { year: 1368, description: "The Ming Dynasty overthrew the Yuan Dynasty in China", isSignificant: true }
          ]
        },
        'Mughal Empire': {
          events: [
            { year: 1526, description: "Babur defeated the Sultan of Delhi at the First Battle of Panipat, founding the Mughal Empire", isSignificant: true },
            { year: 1556, description: "Akbar became emperor and expanded the empire throughout South Asia", isSignificant: true },
            { year: 1631, description: "Shah Jahan began building the Taj Mahal in memory of his wife Mumtaz Mahal", isSignificant: true },
            { year: 1658, description: "Aurangzeb imprisoned his father Shah Jahan and became emperor", isSignificant: true },
            { year: 1707, description: "Aurangzeb died, marking the beginning of the empire's decline", isSignificant: true },
            { year: 1739, description: "Nadir Shah of Persia sacked Delhi and took the Peacock Throne", isSignificant: true },
            { year: 1857, description: "The last Mughal emperor, Bahadur Shah II, was exiled after the Indian Rebellion", isSignificant: true }
          ]
        },
        'British Empire': {
          events: [
            { year: 1583, description: "England established its first colony in Newfoundland", isSignificant: true },
            { year: 1600, description: "The East India Company was founded, marking the beginning of British influence in India", isSignificant: true },
            { year: 1763, description: "Great Britain defeated France in the Seven Years' War, gaining significant global territories", isSignificant: true },
            { year: 1776, description: "American colonies declared independence, beginning the American Revolution", isSignificant: true },
            { year: 1858, description: "British Crown assumed direct rule over India after the Indian Rebellion", isSignificant: true },
            { year: 1901, description: "Queen Victoria died, with the British Empire at its territorial peak", isSignificant: true },
            { year: 1947, description: "India and Pakistan gained independence, accelerating imperial dissolution", isSignificant: true },
            { year: 1997, description: "Hong Kong was handed over to China, symbolically ending the British Empire", isSignificant: true }
          ]
        },
        
        // Historical Personalities
        'Alexander the Great': {
          birth: -356,
          events: [
            { year: -356, description: "Alexander was born to King Philip II of Macedon and Queen Olympias", isSignificant: true },
            { year: -336, description: "Alexander became king of Macedon after his father's assassination", isSignificant: true },
            { year: -334, description: "Alexander began his conquest of the Persian Empire by defeating Darius III at the Battle of Granicus", isSignificant: true },
            { year: -332, description: "Alexander conquered Egypt and founded Alexandria", isSignificant: true },
            { year: -331, description: "Alexander defeated Darius III at the Battle of Gaugamela, effectively ending the Persian Empire", isSignificant: true },
            { year: -326, description: "Alexander reached India and defeated King Porus at the Battle of the Hydaspes", isSignificant: true },
            { year: -323, description: "Alexander died in Babylon at the age of 32, leaving his empire to be divided", isSignificant: true }
          ]
        },
        'Julius Caesar': {
          birth: -100,
          events: [
            { year: -100, description: "Julius Caesar was born to a patrician family in Rome", isSignificant: true },
            { year: -60, description: "Caesar formed the First Triumvirate with Pompey and Crassus", isSignificant: true },
            { year: -58, description: "Caesar began the conquest of Gaul (modern France)", isSignificant: true },
            { year: -49, description: "Caesar crossed the Rubicon River, beginning a civil war in Rome", isSignificant: true },
            { year: -48, description: "Caesar defeated Pompey at the Battle of Pharsalus", isSignificant: true },
            { year: -46, description: "Caesar was appointed dictator of Rome for ten years", isSignificant: true },
            { year: -44, description: "Caesar was assassinated on the Ides of March by a group of senators", isSignificant: true }
          ]
        },
        'Cleopatra': {
          birth: -69,
          events: [
            { year: -69, description: "Cleopatra was born to the Ptolemaic dynasty in Egypt", isSignificant: true },
            { year: -51, description: "Cleopatra became co-ruler of Egypt with her brother Ptolemy XIII", isSignificant: true },
            { year: -48, description: "Cleopatra allied with Julius Caesar against her brother", isSignificant: true },
            { year: -47, description: "Cleopatra gave birth to Ptolemy XV Caesar (Caesarion), supposedly Julius Caesar's son", isSignificant: true },
            { year: -41, description: "Cleopatra met and allied with Mark Antony", isSignificant: true },
            { year: -31, description: "Cleopatra and Antony were defeated by Octavian at the Battle of Actium", isSignificant: true },
            { year: -30, description: "Cleopatra died by suicide, traditionally by asp bite, as Octavian conquered Egypt", isSignificant: true }
          ]
        },
        'Genghis Khan': {
          birth: 1162,
          events: [
            { year: 1162, description: "Temüjin (later Genghis Khan) was born in present-day Mongolia", isSignificant: true },
            { year: 1206, description: "Temüjin united the Mongolian tribes and was proclaimed Genghis Khan", isSignificant: true },
            { year: 1211, description: "Genghis Khan began the conquest of the Jin Dynasty in northern China", isSignificant: true },
            { year: 1219, description: "Genghis Khan invaded the Khwarezmian Empire in Central Asia", isSignificant: true },
            { year: 1221, description: "Mongol armies reached eastern Europe, conquering much of Russia", isSignificant: true },
            { year: 1227, description: "Genghis Khan died during the conquest of the Western Xia", isSignificant: true }
          ]
        },
        'Napoleon Bonaparte': {
          birth: 1769,
          events: [
            { year: 1769, description: "Napoleon was born on the island of Corsica", isSignificant: true },
            { year: 1793, description: "Napoleon distinguished himself at the Siege of Toulon during the French Revolution", isSignificant: true },
            { year: 1799, description: "Napoleon seized power in France through the Coup of 18 Brumaire", isSignificant: true },
            { year: 1804, description: "Napoleon crowned himself Emperor of the French", isSignificant: true },
            { year: 1805, description: "Napoleon defeated the Third Coalition at the Battle of Austerlitz", isSignificant: true },
            { year: 1812, description: "Napoleon's Grande Armée was decimated during the disastrous Russian campaign", isSignificant: true },
            { year: 1815, description: "Napoleon was finally defeated at the Battle of Waterloo", isSignificant: true },
            { year: 1821, description: "Napoleon died in exile on the island of Saint Helena", isSignificant: true }
          ]
        },
        'Leonardo da Vinci': {
          birth: 1452,
          events: [
            { year: 1452, description: "Leonardo da Vinci was born in Vinci, Republic of Florence", isSignificant: true },
            { year: 1472, description: "Leonardo qualified as a master in the Guild of Saint Luke (artists' guild)", isSignificant: true },
            { year: 1482, description: "Leonardo moved to Milan and began working for the Sforza dynasty", isSignificant: true },
            { year: 1495, description: "Leonardo began painting 'The Last Supper' in Milan", isSignificant: true },
            { year: 1503, description: "Leonardo began painting the 'Mona Lisa'", isSignificant: true },
            { year: 1513, description: "Leonardo moved to Rome under the patronage of Giuliano de' Medici", isSignificant: true },
            { year: 1516, description: "Leonardo moved to France at the invitation of King Francis I", isSignificant: true },
            { year: 1519, description: "Leonardo died at Clos Lucé in France", isSignificant: true }
          ]
        },
        'Michelangelo': {
          birth: 1475,
          events: [
            { year: 1475, description: "Michelangelo was born in Caprese, Republic of Florence", isSignificant: true },
            { year: 1496, description: "Michelangelo sculpted the 'Pietà' in Rome", isSignificant: true },
            { year: 1501, description: "Michelangelo began working on the statue of 'David' in Florence", isSignificant: true },
            { year: 1508, description: "Pope Julius II commissioned Michelangelo to paint the Sistine Chapel ceiling", isSignificant: true },
            { year: 1512, description: "Michelangelo completed the Sistine Chapel ceiling", isSignificant: true },
            { year: 1536, description: "Michelangelo began painting 'The Last Judgment' on the altar wall of the Sistine Chapel", isSignificant: true },
            { year: 1547, description: "Michelangelo was appointed chief architect of St. Peter's Basilica", isSignificant: true },
            { year: 1564, description: "Michelangelo died in Rome at the age of 88", isSignificant: true }
          ]
        },
        'Albert Einstein': {
          birth: 1879,
          events: [
            { year: 1879, description: "Albert Einstein was born in Ulm, Germany", isSignificant: true },
            { year: 1905, description: "Einstein published his Special Theory of Relativity and the equation E=mc²", isSignificant: true },
            { year: 1915, description: "Einstein presented his General Theory of Relativity", isSignificant: true },
            { year: 1921, description: "Einstein was awarded the Nobel Prize in Physics for his work on the photoelectric effect", isSignificant: true },
            { year: 1933, description: "Einstein emigrated to the United States to escape Nazi persecution", isSignificant: true },
            { year: 1939, description: "Einstein signed a letter to President Roosevelt warning about the potential of nuclear weapons", isSignificant: true },
            { year: 1955, description: "Einstein died in Princeton, New Jersey", isSignificant: true }
          ]
        },
        'Mahatma Gandhi': {
          birth: 1869,
          events: [
            { year: 1869, description: "Mohandas Karamchand Gandhi was born in Porbandar, India", isSignificant: true },
            { year: 1888, description: "Gandhi went to London to study law", isSignificant: true },
            { year: 1893, description: "Gandhi experienced racial discrimination in South Africa, sparking his activism", isSignificant: true },
            { year: 1915, description: "Gandhi returned to India and joined the Indian independence movement", isSignificant: true },
            { year: 1930, description: "Gandhi led the Salt March in civil disobedience against British salt monopoly", isSignificant: true },
            { year: 1942, description: "Gandhi launched the Quit India Movement demanding immediate independence", isSignificant: true },
            { year: 1947, description: "India gained independence with Gandhi's philosophy of non-violence", isSignificant: true },
            { year: 1948, description: "Gandhi was assassinated by Nathuram Godse in Delhi", isSignificant: true }
          ]
        },
        'Nelson Mandela': {
          birth: 1918,
          events: [
            { year: 1918, description: "Nelson Mandela was born in Mvezo, South Africa", isSignificant: true },
            { year: 1944, description: "Mandela joined the African National Congress (ANC)", isSignificant: true },
            { year: 1956, description: "Mandela was arrested for treason but eventually acquitted in 1961", isSignificant: true },
            { year: 1962, description: "Mandela was arrested again and sentenced to life imprisonment", isSignificant: true },
            { year: 1990, description: "Mandela was released from prison after 27 years", isSignificant: true },
            { year: 1993, description: "Mandela and F.W. de Klerk were jointly awarded the Nobel Peace Prize", isSignificant: true },
            { year: 1994, description: "Mandela was elected as the first black president of South Africa", isSignificant: true },
            { year: 2013, description: "Mandela died in Johannesburg at the age of 95", isSignificant: true }
          ]
        },
        'Chanakya': {
          birth: -371,
          events: [
            { year: -371, description: "Chanakya (also known as Kautilya or Vishnugupta) was born in ancient India", isSignificant: true },
            { year: -340, description: "Chanakya became a teacher at Takshashila University, teaching political science and economics", isSignificant: true },
            { year: -325, description: "After being insulted by King Dhana Nanda of Magadha, Chanakya vowed to overthrow him", isSignificant: true },
            { year: -322, description: "Chanakya discovered Chandragupta Maurya and began training him to become a ruler", isSignificant: true },
            { year: -321, description: "Chanakya helped Chandragupta Maurya overthrow the Nanda dynasty and establish the Maurya Empire", isSignificant: true },
            { year: -320, description: "Chanakya was appointed as the Prime Minister and chief advisor to Emperor Chandragupta", isSignificant: true },
            { year: -317, description: "Chanakya composed the Arthashastra, an ancient Indian treatise on statecraft, economic policy, and military strategy", isSignificant: true },
            { year: -300, description: "Chanakya authored the Nitishastra (or Chanakya Niti), a collection of aphorisms on strategic conduct and ethics", isSignificant: true },
            { year: -298, description: "Chanakya helped in the succession of Bindusara, son of Chandragupta, to the Mauryan throne", isSignificant: true },
            { year: -283, description: "Chanakya died after serving as the mentor and advisor to two powerful Mauryan emperors", isSignificant: true }
          ]
        },
        
        // Sacred Places
        'Jerusalem': {
          events: [
            { year: -1000, description: "King David established Jerusalem as the capital of the United Kingdom of Israel", isSignificant: true },
            { year: -957, description: "Solomon's Temple was completed in Jerusalem", isSignificant: true },
            { year: 70, description: "The Second Temple was destroyed by the Romans", isSignificant: true },
            { year: 691, description: "The Dome of the Rock was built on the Temple Mount", isSignificant: true },
            { year: 1099, description: "Jerusalem was captured by Crusaders who established the Kingdom of Jerusalem", isSignificant: true },
            { year: 1187, description: "Saladin reconquered Jerusalem for Islam", isSignificant: true }
          ]
        },
        'Mecca': {
          events: [
            { year: -2000, description: "According to Islamic tradition, Ibrahim (Abraham) and Ismail built the Kaaba in Mecca", isSignificant: true },
            { year: 570, description: "Prophet Muhammad was born in Mecca", isSignificant: true },
            { year: 610, description: "Muhammad received his first revelation in a cave near Mecca", isSignificant: true },
            { year: 630, description: "Muhammad peacefully conquered Mecca and cleansed the Kaaba of idols", isSignificant: true },
            { year: 632, description: "Muhammad performed his farewell pilgrimage to Mecca", isSignificant: true }
          ]
        },
        'Varanasi': {
          events: [
            { year: -5000, description: "Varanasi was established as one of the oldest continuously inhabited cities in the world", isSignificant: true },
            { year: -1800, description: "Varanasi became a major center of learning and religious activity", isSignificant: true },
            { year: -500, description: "Buddha gave his first sermon near Varanasi at Sarnath", isSignificant: true },
            { year: 1200, description: "Numerous temples were built along the Ganges River in Varanasi", isSignificant: true },
            { year: 1600, description: "Varanasi flourished as a center for arts, music, and Sanskrit education", isSignificant: true }
          ]
        },
        // Add Mahabharata figures
        'Arjuna': {
          birth: -3230,
          events: [
            { year: -3230, description: "Arjuna was born as the third son of Kunti and King Pandu", isSignificant: true },
            { year: -3215, description: "Arjuna began his training in archery under Guru Dronacharya", isSignificant: true },
            { year: -3210, description: "Arjuna vowed to become the greatest archer in the world", isSignificant: true },
            { year: -3205, description: "Arjuna won the hand of Draupadi in her swayamvara by hitting a rotating fish target", isSignificant: true },
            { year: -3200, description: "Arjuna went into exile after breaking a pact with his brothers regarding Draupadi", isSignificant: true },
            { year: -3195, description: "Arjuna married Subhadra, the sister of Lord Krishna", isSignificant: true },
            { year: -3194, description: "Arjuna's son Abhimanyu was born to Subhadra", isSignificant: true },
            { year: -3175, description: "Arjuna performed severe penance to obtain the Pashupata weapon from Lord Shiva", isSignificant: true },
            { year: -3170, description: "Arjuna spent five years in Indra's heaven mastering divine weapons", isSignificant: true },
            { year: -3150, description: "Arjuna helped Agni devour the Khandava forest and saved Maya the architect", isSignificant: true },
            { year: -3140, description: "Arjuna served as the charioteer of Lord Krishna during the Kurukshetra War", isSignificant: true },
            { year: -3139, description: "Arjuna received the Bhagavad Gita from Krishna before the battle", isSignificant: true },
            { year: -3138, description: "Arjuna defeated and killed Karna on the 17th day of the war", isSignificant: true },
            { year: -3137, description: "Arjuna helped Yudhishthira establish the kingdom after the war", isSignificant: true },
            { year: -3102, description: "Arjuna accompanied his brothers on their final journey to the Himalayas", isSignificant: true }
          ]
        },
        'Bhishma': {
          birth: -3379,
          events: [
            { year: -3379, description: "Bhishma was born as Devavrata, son of King Shantanu and Goddess Ganga", isSignificant: true },
            { year: -3363, description: "Devavrata was returned to his father by Ganga after completing his education", isSignificant: true },
            { year: -3350, description: "Devavrata took the terrible vow of lifelong celibacy (Bhishma Pratigya) for his father's happiness", isSignificant: true },
            { year: -3349, description: "Devavrata became known as Bhishma ('the terrible') due to his fearsome vow", isSignificant: true },
            { year: -3340, description: "Bhishma abducted the three princesses of Kashi for his step-brother Vichitravirya", isSignificant: true },
            { year: -3325, description: "Bhishma invited Sage Parashurama for a duel after the Kashi incident", isSignificant: true },
            { year: -3300, description: "Bhishma became the regent of Hastinapura after Vichitravirya's death", isSignificant: true },
            { year: -3290, description: "Bhishma arranged for Sage Vyasa to father children with Vichitravirya's widows", isSignificant: true },
            { year: -3250, description: "Bhishma oversaw the education and training of the Kuru princes", isSignificant: true },
            { year: -3240, description: "Bhishma failed to prevent the dice game that led to the exile of the Pandavas", isSignificant: true },
            { year: -3140, description: "Bhishma became the commander-in-chief of the Kaurava army in the Kurukshetra War", isSignificant: true },
            { year: -3139, description: "Bhishma fell on the 10th day of battle, pierced by Arjuna's arrows", isSignificant: true },
            { year: -3138, description: "Bhishma lay on a bed of arrows, using his boon to choose the time of his death", isSignificant: true },
            { year: -3137, description: "Bhishma gave extensive discourses on dharma, politics, and ethics to Yudhishthira", isSignificant: true },
            { year: -3137, description: "Bhishma left his mortal body on the winter solstice (Uttarayana)", isSignificant: true }
          ]
        },
        'Draupadi': {
          birth: -3225,
          events: [
            { year: -3225, description: "Draupadi emerged from a sacrificial fire as the daughter of King Drupada", isSignificant: true },
            { year: -3205, description: "Draupadi's swayamvara was held where Arjuna won her hand", isSignificant: true },
            { year: -3205, description: "Draupadi became the wife of all five Pandava brothers", isSignificant: true },
            { year: -3200, description: "Draupadi moved to Indraprastha when the Pandavas established their kingdom", isSignificant: true },
            { year: -3190, description: "Draupadi was humiliated in the Kuru court after the Pandavas lost the dice game", isSignificant: true },
            { year: -3190, description: "Lord Krishna miraculously provided endless cloth when Dushasana tried to disrobe Draupadi", isSignificant: true },
            { year: -3189, description: "Draupadi took a vow to leave her hair unbound until it was washed with Dushasana's blood", isSignificant: true },
            { year: -3189, description: "Draupadi accompanied the Pandavas to their 13-year exile", isSignificant: true },
            { year: -3177, description: "Draupadi was harassed by Kichaka during the Pandavas' year in disguise", isSignificant: true },
            { year: -3138, description: "Draupadi's five sons were killed by Ashwatthama after the Kurukshetra War", isSignificant: true },
            { year: -3137, description: "Draupadi washed her hair with Dushasana's blood, fulfilling her vow", isSignificant: true },
            { year: -3137, description: "Draupadi became queen of Hastinapura with Yudhishthira as king", isSignificant: true },
            { year: -3102, description: "Draupadi accompanied the Pandavas on their final journey and was the first to fall", isSignificant: true }
          ]
        },
        'Karna': {
          birth: -3240,
          events: [
            { year: -3240, description: "Karna was born to Kunti before her marriage, through her invocation of the Sun god Surya", isSignificant: true },
            { year: -3240, description: "Kunti set the infant Karna adrift in a basket on the river", isSignificant: true },
            { year: -3240, description: "Karna was found and adopted by Adhiratha, a charioteer, and his wife Radha", isSignificant: true },
            { year: -3220, description: "Karna trained in archery and became extraordinarily skilled", isSignificant: true },
            { year: -3215, description: "Karna was rejected by Dronacharya due to his perceived low birth", isSignificant: true },
            { year: -3214, description: "Karna sought training from Parashurama by presenting himself as a Brahmin", isSignificant: true },
            { year: -3210, description: "Karna was cursed by Parashurama when his true identity was revealed", isSignificant: true },
            { year: -3208, description: "Karna demonstrated his skills at the tournament of the Kuru princes", isSignificant: true },
            { year: -3208, description: "Duryodhana crowned Karna as the king of Anga, making him his close ally", isSignificant: true },
            { year: -3205, description: "Karna was barred from participating in Draupadi's swayamvara due to his supposed low birth", isSignificant: true },
            { year: -3190, description: "Karna supported Duryodhana in the humiliation of the Pandavas during the dice game", isSignificant: true },
            { year: -3140, description: "Kunti revealed to Karna that she was his mother and the Pandavas were his brothers", isSignificant: true },
            { year: -3140, description: "Karna promised Kunti he would spare all Pandavas except Arjuna in battle", isSignificant: true },
            { year: -3139, description: "Karna gave away his divine armor and earrings to Indra, leaving him vulnerable", isSignificant: true },
            { year: -3138, description: "Karna was killed by Arjuna on the 17th day of the Kurukshetra War", isSignificant: true }
          ]
        },
        'Krishna': {
          birth: -3228,
          events: [
            { year: -3228, description: "Krishna was born in Mathura to Devaki and Vasudeva", isSignificant: true },
            { year: -3228, description: "Krishna was taken to Gokul to be raised by Yashoda and Nanda", isSignificant: true },
            { year: -3220, description: "Krishna killed the demoness Putana who tried to poison him", isSignificant: true },
            { year: -3215, description: "Krishna lifted Govardhan Hill to protect villagers from Indra's rains", isSignificant: true },
            { year: -3208, description: "Krishna killed the demon king Kamsa and freed his parents", isSignificant: true },
            { year: -3200, description: "Krishna moved to Dwarka and established his kingdom", isSignificant: true },
            { year: -3195, description: "Krishna married Rukmini after she sent him a letter requesting rescue", isSignificant: true },
            { year: -3190, description: "Krishna married seven other principal queens including Satyabhama", isSignificant: true },
            { year: -3180, description: "Krishna killed Narakasura and freed 16,100 women whom he later married", isSignificant: true },
            { year: -3175, description: "Krishna became allies with the Pandavas after meeting them in Indraprastha", isSignificant: true },
            { year: -3160, description: "Krishna mediated unsuccessfully for peace between the Pandavas and Kauravas", isSignificant: true },
            { year: -3140, description: "Krishna offered his armies to Duryodhana but himself as non-combatant to Arjuna", isSignificant: true },
            { year: -3139, description: "Krishna delivered the Bhagavad Gita to Arjuna before the Kurukshetra War", isSignificant: true },
            { year: -3139, description: "Krishna served as Arjuna's charioteer during the 18-day war", isSignificant: true },
            { year: -3102, description: "Krishna departed from the world after the Yadava clan destroyed itself", isSignificant: true }
          ]
        },
        'Moses': {
          birth: -1391,
          events: [
            { year: -1391, description: "Moses was born to a Hebrew family during Egyptian persecution", isSignificant: true },
            { year: -1391, description: "Moses was placed in a basket on the Nile and found by Pharaoh's daughter", isSignificant: true },
            { year: -1390, description: "Moses was adopted and raised as a prince in the Egyptian royal court", isSignificant: true },
            { year: -1351, description: "Moses killed an Egyptian overseer who was beating a Hebrew slave and fled to Midian", isSignificant: true },
            { year: -1350, description: "Moses married Zipporah, daughter of Jethro, a Midianite priest", isSignificant: true },
            { year: -1311, description: "Moses encountered God in the burning bush at Mount Horeb", isSignificant: true },
            { year: -1311, description: "Moses returned to Egypt to demand that Pharaoh free the Hebrews", isSignificant: true },
            { year: -1311, description: "Moses led the Israelites out of Egypt after the ten plagues", isSignificant: true },
            { year: -1311, description: "Moses parted the Red Sea to allow the Israelites to escape Egyptian pursuit", isSignificant: true },
            { year: -1311, description: "Moses received the Ten Commandments on Mount Sinai", isSignificant: true },
            { year: -1310, description: "Moses led the Israelites through the desert for 40 years", isSignificant: true },
            { year: -1310, description: "Moses struck a rock for water instead of speaking to it as God commanded", isSignificant: true },
            { year: -1271, description: "Moses viewed the Promised Land from Mount Nebo but was not allowed to enter", isSignificant: true },
            { year: -1271, description: "Moses died at the age of 120 and was buried in an unknown location in Moab", isSignificant: true }
          ]
        },
        'Mary': {
          birth: -18,
          events: [
            { year: -18, description: "Mary was born in either Nazareth or Jerusalem to Joachim and Anne", isSignificant: true },
            { year: -4, description: "The angel Gabriel appeared to Mary in the Annunciation", isSignificant: true },
            { year: -4, description: "Mary visited her cousin Elizabeth (the Visitation)", isSignificant: true },
            { year: -4, description: "Mary traveled to Bethlehem with Joseph for the census", isSignificant: true },
            { year: -4, description: "Mary gave birth to Jesus in Bethlehem", isSignificant: true },
            { year: -4, description: "Mary and Joseph presented Jesus at the Temple (the Presentation)", isSignificant: true },
            { year: -3, description: "Mary and Joseph fled to Egypt to escape Herod's massacre of the innocents", isSignificant: true },
            { year: -1, description: "Mary and Joseph returned from Egypt to Nazareth with Jesus", isSignificant: true },
            { year: 12, description: "Mary and Joseph found the twelve-year-old Jesus teaching in the Temple", isSignificant: true },
            { year: 30, description: "Mary prompted Jesus to perform his first miracle at the Wedding at Cana", isSignificant: true },
            { year: 33, description: "Mary stood at the foot of the cross during Jesus's crucifixion", isSignificant: true },
            { year: 33, description: "Jesus entrusted Mary to the care of the disciple John", isSignificant: true },
            { year: 33, description: "Mary was present with the apostles at Pentecost", isSignificant: true },
            { year: 48, description: "According to tradition, Mary was assumed body and soul into heaven", isSignificant: true }
          ]
        },
        'Confucius': {
          birth: -551,
          events: [
            { year: -551, description: "Confucius (Kong Qiu) was born in the state of Lu, now part of Shandong, China", isSignificant: true },
            { year: -535, description: "Confucius's father died when he was a teenager", isSignificant: true },
            { year: -533, description: "Confucius married at the age of 19", isSignificant: true },
            { year: -532, description: "Confucius's son Kong Li was born", isSignificant: true },
            { year: -530, description: "Confucius began his career as a minor official in Lu", isSignificant: true },
            { year: -518, description: "Confucius met Laozi in the Zhou capital, according to some accounts", isSignificant: true },
            { year: -501, description: "Confucius was appointed as the Minister of Justice in Lu", isSignificant: true },
            { year: -497, description: "Confucius left Lu after political disagreements and began traveling", isSignificant: true },
            { year: -496, description: "Confucius began 13 years of travels through Chinese states seeking a ruler to implement his ideas", isSignificant: true },
            { year: -483, description: "Confucius returned to Lu and focused on teaching and compiling texts", isSignificant: true },
            { year: -480, description: "Confucius completed his work on the Spring and Autumn Annals", isSignificant: true },
            { year: -479, description: "Confucius died at the age of 72 in Lu", isSignificant: true },
            { year: -400, description: "Confucius's disciples compiled the Analects (Lunyu), containing his sayings", isSignificant: true },
            { year: -200, description: "Confucianism was established as the official state philosophy during the Han Dynasty", isSignificant: true }
          ]
        },
        'Lao Tzu': {
          birth: -600,
          events: [
            { year: -600, description: "Lao Tzu (Laozi) was traditionally believed to be born in the state of Chu", isSignificant: true },
            { year: -575, description: "Lao Tzu became an archivist and scholar at the royal court of Zhou", isSignificant: true },
            { year: -518, description: "Lao Tzu reportedly met Confucius and discussed rituals and ceremonies", isSignificant: true },
            { year: -500, description: "Lao Tzu became disillusioned with the moral decay of the Zhou court", isSignificant: true },
            { year: -500, description: "Lao Tzu decided to leave China and travel westward into the desert", isSignificant: true },
            { year: -500, description: "At the western gate, the gatekeeper asked Lao Tzu to write down his wisdom", isSignificant: true },
            { year: -500, description: "Lao Tzu wrote the Tao Te Ching (Daodejing), the foundational text of Taoism", isSignificant: true },
            { year: -500, description: "Lao Tzu departed into the western wilderness, never to be seen again", isSignificant: true },
            { year: -300, description: "The philosophy of Taoism based on Lao Tzu's teachings began to spread in China", isSignificant: true },
            { year: -100, description: "Lao Tzu was deified and worshipped as a deity in religious Taoism", isSignificant: true }
          ]
        },
        'Saint Peter': {
          birth: -1,
          events: [
            { year: -1, description: "Simon (later called Peter) was born in Bethsaida, Galilee", isSignificant: true },
            { year: 20, description: "Peter worked as a fisherman on the Sea of Galilee", isSignificant: true },
            { year: 27, description: "Peter was called by Jesus to be his disciple while fishing", isSignificant: true },
            { year: 27, description: "Jesus gave Simon the name Cephas (Peter), meaning 'rock'", isSignificant: true },
            { year: 28, description: "Peter was named as one of the twelve apostles of Jesus", isSignificant: true },
            { year: 29, description: "Peter witnessed Jesus' Transfiguration on the mountain", isSignificant: true },
            { year: 30, description: "Peter declared Jesus as 'the Christ, the Son of the living God'", isSignificant: true },
            { year: 33, description: "Peter denied knowing Jesus three times on the night of his arrest", isSignificant: true },
            { year: 33, description: "Peter witnessed the empty tomb after Jesus' resurrection", isSignificant: true },
            { year: 33, description: "The resurrected Jesus instructed Peter to 'feed my sheep'", isSignificant: true },
            { year: 33, description: "Peter became the leader of the early Christians after Pentecost", isSignificant: true },
            { year: 44, description: "Peter was miraculously freed from prison by an angel", isSignificant: true },
            { year: 50, description: "Peter advocated for the acceptance of Gentile converts at the Council of Jerusalem", isSignificant: true },
            { year: 64, description: "Peter was martyred in Rome during Nero's persecution, crucified upside down", isSignificant: true }
          ]
        },
        
        // Add detailed entries for Subhash Chandra Bose
        'Subhash Chandra Bose': {
          birth: 1897,
          events: [
            { year: 1897, description: "Subhash Chandra Bose was born in Cuttack, Orissa Division, Bengal Province", isSignificant: true },
            { year: 1919, description: "Bose graduated from Scottish Church College and went to England to prepare for Indian Civil Service", isSignificant: true },
            { year: 1921, description: "Bose resigned from the prestigious Indian Civil Service to join India's independence movement", isSignificant: true },
            { year: 1923, description: "Bose was elected President of the All India Youth Congress and Secretary of Bengal State Congress", isSignificant: true },
            { year: 1924, description: "Bose became Chief Executive Officer of Calcutta Municipal Corporation with Das as Mayor", isSignificant: true },
            { year: 1925, description: "Bose was arrested and sent to prison in Mandalay for nationalist activities", isSignificant: true },
            { year: 1927, description: "After release, Bose became General Secretary of Congress party and worked with Jawaharlal Nehru", isSignificant: true },
            { year: 1930, description: "Bose was imprisoned during Civil Disobedience Movement", isSignificant: true },
            { year: 1937, description: "Bose was elected President of the Indian National Congress", isSignificant: true },
            { year: 1938, description: "Bose was re-elected Congress President but resigned due to differences with Gandhi", isSignificant: true },
            { year: 1939, description: "Bose formed the Forward Bloc within the Indian National Congress", isSignificant: true },
            { year: 1941, description: "Bose escaped from British surveillance from his Calcutta house and fled to Germany", isSignificant: true },
            { year: 1942, description: "In Berlin, Bose organized the Indian Legion, consisting of Indian prisoners of war", isSignificant: true },
            { year: 1943, description: "Bose traveled to Japan and took leadership of the Indian National Army (INA)", isSignificant: true },
            { year: 1943, description: "Bose established the Provisional Government of Free India (Azad Hind) in Singapore", isSignificant: true },
            { year: 1944, description: "INA under Bose's leadership fought alongside Japanese forces against the British in Imphal-Kohima", isSignificant: true },
            { year: 1945, description: "Bose reportedly died in a plane crash in Taiwan on August 18, though controversies surround his death", isSignificant: true },
            { year: 1956, description: "The Shah Nawaz Committee, set up by the Indian government, concluded that Bose died in the plane crash", isSignificant: true },
            { year: 1992, description: "The Justice Mukherjee Commission was set up to probe Bose's death", isSignificant: true },
            { year: 2015, description: "Indian government began declassifying files related to Bose", isSignificant: true },
            { year: 2018, description: "Bose's statue was unveiled at India Gate in Delhi", isSignificant: true },
            { year: 2022, description: "A 28-foot-tall hologram statue of Bose was installed at India Gate before permanent granite statue", isSignificant: true },
            { year: 2023, description: "Prime Minister Modi inaugurated the permanent granite statue of Bose at India Gate", isSignificant: true },
            { year: 2024, description: "Commemorations continued across India honoring Bose's 127th birth anniversary", isSignificant: true }
          ]
        },
        
        // Add comprehensive timeline for India's independence
        'India Independence': {
          events: [
            { year: 1600, description: "East India Company established, marking the beginning of British commercial interests in India", isSignificant: true },
            { year: 1757, description: "Battle of Plassey: Robert Clive led the East India Company to victory, establishing British dominance in Bengal", isSignificant: true },
            { year: 1857, description: "The First War of Indian Independence (Sepoy Mutiny) erupted against British rule", isSignificant: true },
            { year: 1858, description: "British Crown took direct control of India from the East India Company", isSignificant: true },
            { year: 1885, description: "Indian National Congress was founded, becoming India's first modern nationalist movement", isSignificant: true },
            { year: 1905, description: "Partition of Bengal by Lord Curzon triggered the Swadeshi Movement", isSignificant: true },
            { year: 1906, description: "All-India Muslim League was founded in Dhaka", isSignificant: true },
            { year: 1915, description: "Mahatma Gandhi returned to India from South Africa", isSignificant: true },
            { year: 1919, description: "Jallianwala Bagh Massacre in Amritsar shocked the nation", isSignificant: true },
            { year: 1920, description: "Non-Cooperation Movement launched under Gandhi's leadership", isSignificant: true },
            { year: 1930, description: "Gandhi led the Civil Disobedience Movement, beginning with the Salt March to Dandi", isSignificant: true },
            { year: 1935, description: "Government of India Act provided for provincial autonomy and a federal structure", isSignificant: true },
            { year: 1942, description: "Quit India Movement launched by Gandhi demanding immediate independence", isSignificant: true },
            { year: 1943, description: "Subhash Chandra Bose formed the Azad Hind Government and reorganized the Indian National Army", isSignificant: true },
            { year: 1946, description: "Royal Indian Navy Mutiny erupted, displaying widespread anti-British sentiment", isSignificant: true },
            { year: 1946, description: "Cabinet Mission proposed a federal structure for an independent India", isSignificant: true },
            { year: 1947, description: "Lord Mountbatten announced the Partition Plan on June 3", isSignificant: true },
            { year: 1947, description: "Indian Independence Act was passed by the British Parliament in July", isSignificant: true },
            { year: 1947, description: "India gained independence on August 15; Jawaharlal Nehru became the first Prime Minister", isSignificant: true },
            { year: 1947, description: "Partition of India led to massive population exchange and communal violence", isSignificant: true },
            { year: 1948, description: "Mahatma Gandhi was assassinated on January 30", isSignificant: true },
            { year: 1950, description: "India adopted its Constitution and became a Republic on January 26", isSignificant: true },
            { year: 1951, description: "First general elections held in independent India", isSignificant: true },
            { year: 1962, description: "Indo-China War resulted in a defeat for India", isSignificant: true },
            { year: 1965, description: "Indo-Pakistan War ended in a stalemate", isSignificant: true },
            { year: 1971, description: "Indo-Pakistan War led to the creation of Bangladesh", isSignificant: true },
            { year: 1975, description: "Emergency was declared by Prime Minister Indira Gandhi, suspending civil liberties", isSignificant: true },
            { year: 1977, description: "Janata Party formed the first non-Congress government at the center", isSignificant: true },
            { year: 1984, description: "Operation Blue Star at Golden Temple followed by assassination of Indira Gandhi", isSignificant: true },
            { year: 1991, description: "Economic liberalization began under P.V. Narasimha Rao government", isSignificant: true },
            { year: 1998, description: "India conducted nuclear tests, declaring itself a nuclear power", isSignificant: true },
            { year: 1999, description: "Kargil War with Pakistan ended with India regaining control of occupied territories", isSignificant: true },
            { year: 2000, description: "India's population crossed 1 billion", isSignificant: true },
            { year: 2014, description: "Narendra Modi became Prime Minister, leading BJP to the first single-party majority since 1984", isSignificant: true },
            { year: 2019, description: "Article 370 was abrogated, revoking the special status of Jammu and Kashmir", isSignificant: true },
            { year: 2020, description: "India faced the COVID-19 pandemic with nationwide lockdowns", isSignificant: true },
            { year: 2022, description: "India celebrated 75 years of independence with the 'Azadi Ka Amrit Mahotsav' initiative", isSignificant: true },
            { year: 2023, description: "India assumed G20 presidency and hosted the summit in New Delhi", isSignificant: true },
            { year: 2023, description: "Chandrayaan-3 successfully landed on the Moon's south pole, making India the fourth country to land on the Moon", isSignificant: true },
            { year: 2024, description: "India held its 18th general election, the largest democratic exercise in world history", isSignificant: true }
          ]
        }
      };
      
      // Special handling for political figures
      const politicalFigures = {
        'Narendra Modi': {
          birth: 1950,
          events: [
            { year: 1950, description: "Narendra Modi was born in Vadnagar, Gujarat", isSignificant: true },
            { year: 2001, description: "Modi became Chief Minister of Gujarat", isSignificant: true },
            { year: 2014, description: "Modi became the 14th Prime Minister of India", isSignificant: true },
            { year: 2019, description: "Modi won a second term as Prime Minister of India", isSignificant: true }
          ]
        },
        'Subhash Chandra Bose': {
          birth: 1897,
          events: [
            { year: 1897, description: "Subhash Chandra Bose was born in Cuttack, Orissa Division, Bengal Province", isSignificant: true },
            { year: 1919, description: "Bose passed the Indian Civil Service examination, but resigned to join the independence movement", isSignificant: true },
            { year: 1921, description: "Bose joined the Indian National Congress and worked under Chittaranjan Das", isSignificant: true },
            { year: 1923, description: "Bose was elected President of All India Youth Congress", isSignificant: true },
            { year: 1924, description: "Bose was appointed as the CEO of Calcutta Municipal Corporation", isSignificant: true },
            { year: 1925, description: "Bose was arrested and sent to prison in Mandalay, Burma", isSignificant: true },
            { year: 1927, description: "Bose was released from prison and became General Secretary of the Congress party", isSignificant: true },
            { year: 1928, description: "Bose founded the Independence League and demanded complete independence", isSignificant: true },
            { year: 1930, description: "Bose was arrested during the Civil Disobedience Movement", isSignificant: true },
            { year: 1937, description: "Bose was elected President of the Indian National Congress", isSignificant: true },
            { year: 1939, description: "Bose was re-elected as Congress President, but resigned due to differences with Gandhi", isSignificant: true },
            { year: 1939, description: "Bose formed the Forward Bloc within the Indian National Congress", isSignificant: true },
            { year: 1940, description: "Bose was arrested for organizing protests, but went on hunger strike and was released", isSignificant: true },
            { year: 1941, description: "Bose escaped from house arrest in Calcutta and made his way to Germany via Afghanistan", isSignificant: true },
            { year: 1942, description: "Bose met Adolf Hitler in Germany and established the Free India Center and Indian Legion", isSignificant: true },
            { year: 1943, description: "Bose traveled to Japan by submarine and took leadership of the Indian National Army (INA)", isSignificant: true },
            { year: 1943, description: "Bose established the Provisional Government of Free India (Azad Hind) on October 21", isSignificant: true },
            { year: 1943, description: "Bose gave his famous slogan 'Give me blood, and I shall give you freedom'", isSignificant: true },
            { year: 1944, description: "INA under Bose's leadership advanced into India and hoisted the Indian flag in Moirang, Manipur", isSignificant: true },
            { year: 1944, description: "Bose established the women's regiment in INA called the Rani of Jhansi Regiment", isSignificant: true },
            { year: 1945, description: "Bose reportedly died in a plane crash in Taiwan on August 18, though controversies surround his death", isSignificant: true },
            { year: 1946, description: "The British held public trials of INA officers at the Red Fort, which increased sympathy for independence", isSignificant: true },
            { year: 1952, description: "The first inquiry commission (Shah Nawaz Committee) was set up to investigate Bose's death", isSignificant: true },
            { year: 1956, description: "The Shah Nawaz Committee concluded that Bose died in the plane crash", isSignificant: true },
            { year: 1970, description: "The G.D. Khosla Commission reaffirmed the conclusion that Bose died in the plane crash", isSignificant: true },
            { year: 1992, description: "The Justice Mukherjee Commission was set up to probe Bose's death", isSignificant: true },
            { year: 2005, description: "The Mukherjee Commission concluded that Bose did not die in the plane crash", isSignificant: true },
            { year: 2006, description: "The Government of India rejected the findings of the Mukherjee Commission", isSignificant: true },
            { year: 2015, description: "Prime Minister Narendra Modi met Bose's family members and announced declassification of Netaji files", isSignificant: true },
            { year: 2016, description: "The Indian government began releasing classified files related to Bose", isSignificant: true },
            { year: 2018, description: "Bose's statue was unveiled at India Gate in Delhi", isSignificant: true },
            { year: 2019, description: "Government of India celebrated Bose's 122nd birth anniversary at the Red Fort", isSignificant: true },
            { year: 2022, description: "A 28-foot-tall hologram statue of Bose was installed at India Gate", isSignificant: true },
            { year: 2023, description: "Prime Minister Modi inaugurated the permanent granite statue of Bose at India Gate", isSignificant: true },
            { year: 2024, description: "Government designated January 23 (Bose's birthday) as 'Parakram Diwas' to honor his legacy", isSignificant: true }
          ]
        }
      };
      
      // Handle alternative spellings/names
      const titleMapping = {
        'ramayana': 'Ramayana',
        'ramayan': 'Ramayana',
        'mahabharat': 'Mahabharata',
        'narendra modi': 'Narendra Modi',
        'modi': 'Narendra Modi',
        'subhash chandra bose': 'Subhash Chandra Bose',
        'netaji': 'Subhash Chandra Bose',
        'netaji bose': 'Subhash Chandra Bose',
        'subhash bose': 'Subhash Chandra Bose'
      };
      
      // Check if we need to map the title
      const normalizedTitle = titleMapping[title.toLowerCase()] || title;
      
      // Check if this is a religious figure we have special data for
      const specialFigureData = religiousFigures[normalizedTitle] || politicalFigures[normalizedTitle];
      if (specialFigureData) {
        console.log(`Using special figure data for ${normalizedTitle}`);
        
        let description, extract;
        if (religiousFigures[normalizedTitle]) {
          // Check if it's an epic
          if (normalizedTitle === 'Ramayana') {
            description = "The Ramayana is one of the major Sanskrit epics of ancient India.";
            extract = "The Ramayana is one of the largest ancient epics in world literature, consisting of nearly 24,000 verses and attributed to the Hindu sage Valmiki.";
          } else if (normalizedTitle === 'Mahabharata') {
            description = "The Mahabharata is one of the two major Sanskrit epics of ancient India.";
            extract = "The Mahabharata is one of the longest epic poems ever written, consisting of over 100,000 verses, and is attributed to the sage Vyasa.";
          } else {
            description = `${normalizedTitle} is a major deity in Hinduism.`;
            extract = `${normalizedTitle} is one of the most important deities in Hindu tradition. According to Hindu scriptures, ${normalizedTitle} is considered to be an avatar (incarnation) of Lord Vishnu, the preserver of the universe.`;
          }
        } else {
          description = `${normalizedTitle} is a political figure.`;
          extract = `${normalizedTitle} is a notable political figure.`;
        }
        
        return {
          title: normalizedTitle,
          description: description,
          extract: extract,
          thumbnail: null, // We'll let the API try to find an image
          bioEvents: specialFigureData.events.map(event => ({
            ...event,
            eventType: 'people'
          }))
        };
      }
      
      // Encode the title for use in the URL
      const encodedTitle = encodeURIComponent(title);
      
      // Fetch summary data
      const summaryUrl = `${WIKIPEDIA_REST_API_URL}/page/summary/${encodedTitle}`;
      const summaryResponse = await axios.get(summaryUrl);
      
      if (!summaryResponse.data) {
        return null;
      }
      
      // Extract key biographical events
      const bioEvents = [];
      
      // For people, add birth and death events if available
      const description = summaryResponse.data.description || '';
      const extract = summaryResponse.data.extract || '';
      
      // Try to extract birth year - checking multiple patterns
      const birthYearRegexes = [
        /\bborn\s+(?:on\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})\b/i,
        /\bborn\s+(?:in\s+)?(\d{4})\b/i,
        /\b(\d{4})(?:\s*[-–]\s*\d{4})?\b/,
        /\bborn\s+(?:on\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})\b/i,
        /\bborn\s+(?:on\s+)?(?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+(\d{4}))\b/i
      ];
      
      // Try to extract death year - checking multiple patterns
      const deathYearRegexes = [
        /\bdied\s+(?:on\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})\b/i,
        /\bdied\s+(?:in\s+)?(\d{4})\b/i,
        /\b\d{4}\s*[-–]\s*(\d{4})\b/,
        /\bdeath\s+(?:in\s+)?(\d{4})\b/i,
        /\bdeath\s+(?:on\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})\b/i,
        /\bdied\s+(?:on\s+)?(?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+(\d{4}))\b/i
      ];
      
      // Extract birth year using multiple patterns
      let birthYear = null;
      for (const regex of birthYearRegexes) {
        const match = extract.match(regex) || description.match(regex);
        if (match && match[1]) {
          // If it's a numerical value, process it
          if (!isNaN(parseInt(match[1], 10))) {
            birthYear = parseInt(match[1], 10);
            break;
          }
        }
      }
      
      // Extract death year using multiple patterns
      let deathYear = null;
      for (const regex of deathYearRegexes) {
        const match = extract.match(regex) || description.match(regex);
        if (match && match[1]) {
          // If it's a numerical value, process it
          if (!isNaN(parseInt(match[1], 10))) {
            deathYear = parseInt(match[1], 10);
            break;
          }
        }
      }
      
      // Add birth event if found
      if (birthYear) {
        bioEvents.push({
          year: birthYear,
          description: `${title} was born${birthYear < 0 ? ' (BCE)' : ''}`,
          eventType: 'people',
          isSignificant: true
        });
      }
      
      // Add death event if found
      if (deathYear) {
        bioEvents.push({
          year: deathYear,
          description: `${title} passed away${deathYear < 0 ? ' (BCE)' : ''}`,
          eventType: 'people',
          isSignificant: true
        });
      }
      
      // Check if this is a religious or mythological figure
      const religiousTerms = ['deity', 'god', 'goddess', 'divine', 'worship', 'mythological', 
                            'incarnation', 'avatar', 'religion', 'hinduism', 'scripture'];
      const isReligiousFigure = religiousTerms.some(term => 
        (description.toLowerCase().includes(term) || extract.toLowerCase().includes(term))
      );
      
      // For religious figures where we don't have exact birth/death dates,
      // add a general time period or first historical mention
      if (isReligiousFigure && bioEvents.length === 0) {
        if (extract.toLowerCase().includes('hindu')) {
          bioEvents.push({
            year: -1500, // Approximate time for early Hindu texts
            description: `${title} appears in Hindu scriptures dating back to ancient times`,
            eventType: 'people',
            isSignificant: true
          });
        } else if (extract.toLowerCase().includes('ancient')) {
          bioEvents.push({
            year: -1000, // Generic ancient time
            description: `${title} is mentioned in ancient texts and tradition`,
            eventType: 'people',
            isSignificant: true
          });
        }
      }
      
      // Attempt to get more info about key events from the main extract
      const originalUrl = `${WIKIPEDIA_REST_API_URL}/page/mobile-sections/${encodedTitle}`;
      const originalResponse = await axios.get(originalUrl);
      
      // Use main API to extract detailed biographical info if possible
      try {
        // Get full page content to extract more biographical details
        const wikiApiUrl = `${WIKIPEDIA_API_URL}?action=parse&page=${encodedTitle}&format=json&prop=text&section=0&origin=*`;
        const fullPageData = await axios.get(wikiApiUrl);
        
        if (fullPageData.data && fullPageData.data.parse && fullPageData.data.parse.text) {
          const pageHtml = fullPageData.data.parse.text['*'];
          
          // Create a temporary DOM element to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = pageHtml;
          
          // Extract text content to search for achievements
          const textContent = tempDiv.textContent || '';
          
          // Find achievements, roles, awards and other significant life events
          const achievementPatterns = [
            { regex: /\b(in|by|during|from)\s+(\d{4})[^\.]+(?:became|elected|appointed|chosen|named|served as)[^\.]+/gi, type: 'role' },
            { regex: /\b(in|by|during|from)\s+(\d{4})[^\.]+(?:awarded|received|won|honored|honoured|given)[^\.]+/gi, type: 'award' },
            { regex: /\b(in|by|during|from)\s+(\d{4})[^\.]+(?:published|wrote|composed|created|directed|produced)[^\.]+/gi, type: 'creation' },
            { regex: /\b(in|by|during|from)\s+(\d{4})[^\.]+(?:graduated|studied|earned|received|completed)[^\.]+(?:degree|education|university|college)[^\.]+/gi, type: 'education' },
            { regex: /\b(in|by|during|from)\s+(\d{4})[^\.]+(?:founded|established|started|launched|created)[^\.]+/gi, type: 'founding' }
          ];
          
          // Process each achievement pattern
          for (const pattern of achievementPatterns) {
            let match;
            while ((match = pattern.regex.exec(textContent)) !== null) {
              if (match[2]) {
                const year = parseInt(match[2], 10);
                
                // Validate the year (reasonable range)
                if (year >= (birthYear || 0) && year <= (deathYear || new Date().getFullYear())) {
                  // Get the full sentence containing this achievement
                  const startPos = Math.max(0, textContent.lastIndexOf('.', match.index) + 1);
                  const endPos = textContent.indexOf('.', match.index) + 1;
                  if (endPos > 0) {
                    const sentence = textContent.substring(startPos, endPos).trim();
                    
                    bioEvents.push({
                      year: year,
                      description: sentence,
                      eventType: 'people',
                      achievementType: pattern.type,
                      isSignificant: true
                    });
                  }
                }
              }
            }
          }
        }
      } catch (fullPageError) {
        console.error('Error fetching full page data:', fullPageError);
      }
      
      // Get additional content from mobile sections API
      if (originalResponse.data && originalResponse.data.remaining && originalResponse.data.remaining.sections) {
        const allSections = originalResponse.data.remaining.sections;
        const mainText = allSections.map(section => section.text).join('\n');
        
        // Look for important years and events in the subject's life - extended patterns
        const yearPatterns = [
          { regex: /\b(?:in|by|during|from)\s+(\d{4})\b/gi, importance: 'medium' },
          { regex: /\b(\d{4})[^\.\n]*?(founded|established|formed|joined|led|wrote|published|became|elected|appointed|awarded|received|won|discovered|invented|developed|graduated|married|moved|visited|created|performed|directed|produced)[^\.\n]*?\./gi, importance: 'high' },
          { regex: /\bfrom\s+(\d{4})\s+to\s+(\d{4})\b[^\.\n]*?\./gi, importance: 'medium', isRange: true },
          { regex: /\bbetween\s+(\d{4})\s+and\s+(\d{4})\b[^\.\n]*?\./gi, importance: 'medium', isRange: true }
        ];
        
        // Process each year pattern
        for (const pattern of yearPatterns) {
          let match;
          while ((match = pattern.regex.exec(mainText)) !== null) {
            // Extract year(s)
            if (pattern.isRange) {
              // Handle date ranges (from X to Y)
              const startYear = parseInt(match[1], 10);
              const endYear = parseInt(match[2], 10);
              
              // Create event for start of range
              if (!isNaN(startYear) && startYear >= (birthYear || 0) && 
                  startYear <= (deathYear || new Date().getFullYear())) {
                // Get context for the event
                const startPos = Math.max(0, mainText.lastIndexOf('.', match.index) + 1);
                const endPos = mainText.indexOf('.', match.index) + 1;
                
                if (endPos > 0) {
                  const eventDesc = mainText.substring(startPos, endPos).trim();
                  
                  bioEvents.push({
                    year: startYear,
                    description: `${eventDesc} (began)`,
                    eventType: 'people',
                    isSignificant: pattern.importance === 'high'
                  });
                }
              }
              
              // Create event for end of range
              if (!isNaN(endYear) && endYear >= (birthYear || 0) && 
                  endYear <= (deathYear || new Date().getFullYear())) {
                // Get context for the event
                const startPos = Math.max(0, mainText.lastIndexOf('.', match.index) + 1);
                const endPos = mainText.indexOf('.', match.index) + 1;
                
                if (endPos > 0) {
                  const eventDesc = mainText.substring(startPos, endPos).trim();
                  
                  bioEvents.push({
                    year: endYear,
                    description: `${eventDesc} (completed)`,
                    eventType: 'people',
                    isSignificant: pattern.importance === 'high'
                  });
                }
              }
            } else {
              // Handle single year references
              const year = parseInt(match[1], 10);
              
              // Validate the year is within the person's lifespan or reasonable range
              if (!isNaN(year) && year >= (birthYear || 0) && 
                  year <= (deathYear || new Date().getFullYear())) {
                // Get surrounding text for context
                const startPos = Math.max(0, mainText.lastIndexOf('.', match.index) + 1);
                const endPos = mainText.indexOf('.', match.index) + 1;
                
                if (endPos > 0) {
                  const eventDesc = mainText.substring(startPos, endPos).trim();
                  
                  bioEvents.push({
                    year: year,
                    description: eventDesc,
                    eventType: 'people',
                    isSignificant: pattern.importance === 'high'
                  });
                }
              }
            }
          }
        }
      }
      
      // Look for key sections that suggest more events
      const sectionTitles = originalResponse.data?.remaining?.sections?.map(s => s.line) || [];
      const keyBioSections = ['Career', 'Education', 'Life', 'Biography', 'Early life', 'Personal life', 'Works', 'Achievements', 'Awards'];
      
      // Find indices of important sections
      const bioSectionIndices = [];
      for (let i = 0; i < sectionTitles.length; i++) {
        const title = sectionTitles[i];
        if (keyBioSections.some(section => title.includes(section))) {
          bioSectionIndices.push(i);
        }
      }
      
      // Get content from these sections for additional processing
      if (bioSectionIndices.length > 0 && originalResponse.data?.remaining?.sections) {
        for (const idx of bioSectionIndices) {
          const section = originalResponse.data.remaining.sections[idx];
          if (section && section.text) {
            // Create a temp div to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = section.text;
            const sectionText = tempDiv.textContent || '';
            
            // Look for dates and achievements in these sections
            const yearRegex = /\b(in|by|during)\s+(\d{4})\b/gi;
            let match;
            
            while ((match = yearRegex.exec(sectionText)) !== null) {
              const year = parseInt(match[2], 10);
              
              // Check if the year is valid for this person
              if (!isNaN(year) && year >= (birthYear || 0) && 
                  year <= (deathYear || new Date().getFullYear())) {
                // Get the sentence containing this year
                const sentenceStart = Math.max(0, sectionText.lastIndexOf('.', match.index) + 1);
                const sentenceEnd = sectionText.indexOf('.', match.index) + 1;
                
                if (sentenceEnd > 0) {
                  const sentence = sectionText.substring(sentenceStart, sentenceEnd).trim();
                  
                  // Add to bio events if it's a unique event
                  if (!bioEvents.some(event => 
                      event.year === year && 
                      stringSimilarity.compareTwoStrings(event.description, sentence) > 0.6)) {
                    bioEvents.push({
                      year: year,
                      description: sentence,
                      eventType: 'people',
                      isSignificant: true,
                      source: section.line // Which section this came from
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      // Sort bio events chronologically and remove duplicates
      const uniqueBioEvents = bioEvents
        .sort((a, b) => a.year - b.year)
        .filter((event, index, self) => 
          index === self.findIndex(e => 
            e.year === event.year && 
            stringSimilarity.compareTwoStrings(e.description, event.description) > 0.7
          )
        );
      
      return {
        title: summaryResponse.data.title,
        description: summaryResponse.data.description,
        extract: summaryResponse.data.extract,
        thumbnail: summaryResponse.data.thumbnail?.source,
        birthYear, 
        deathYear,
        bioEvents: uniqueBioEvents.length > 0 ? uniqueBioEvents : null
      };
    } catch (error) {
      console.error('Error fetching biographical data:', error);
      return null;
    }
  }, []);

  // Process search results from Wikipedia
  const processSearchResults = useCallback(async (data, query, cacheKey) => {
    try {
      if (!data || !data.query || !data.query.search) {
        console.error('Invalid search response structure:', data);
        setLoading(false);
        setEvents([]);
        return;
      }
      
      const searchResults = data.query.search;
      
      if (searchResults.length === 0) {
        console.log('No search results found');
        setLoading(false);
        setEvents([]);
        return;
      }
      
      // Calculate relevance scores
      const scoredResults = searchResults.map(result => {
        let score = 0;
        
        // Check if title contains year
        const yearMatch = result.title.match(/\b\d{3,4}\b/);
        if (yearMatch) score += 3;
        
        // Check if title contains query terms
        if (result.title.toLowerCase().includes(query.toLowerCase())) score += 2;
        
        // Check for keywords in snippet
        if (keyEventIndicators.some(keyword => 
          result.snippet.toLowerCase().includes(keyword)
        )) {
          score += 2;
        }
        
        return {
          ...result,
          relevanceScore: score
        };
      });
      
      // Sort by relevance score
      const sortedResults = scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      console.log('Sorted results by relevance:', sortedResults);
      
      // Special handling for biographical searches and epics
      // Check if it's a potential person name, political figure, or epic
      const lowerQuery = query.toLowerCase();
      const isPotentialPersonName = 
        query.split(' ').length >= 2 || // Has at least two words (first and last name)
        lowerQuery.includes('modi') ||
        lowerQuery.includes('rama') || 
        lowerQuery.includes('krishna') ||
        lowerQuery.includes('mahabharata') || 
        lowerQuery.includes('ramayana');
      
      let additionalBioEvents = [];
      
      // If it looks like a person's name or epic, try the REST API first
      if (isPotentialPersonName) {
        try {
          console.log('Treating as biographical/epic search, fetching from REST API:', query);
          const bioData = await fetchBiographicalData(query);
          
          if (bioData && bioData.bioEvents && bioData.bioEvents.length > 0) {
            console.log('Found biographical/epic events:', bioData.bioEvents.length);
            additionalBioEvents = bioData.bioEvents.map(event => ({
              year: event.year,
              description: event.description,
              fullDescription: event.description,
              source: bioData.title,
              title: bioData.title,
              thumbnail: bioData.thumbnail,
              preciseDate: null,
              isSignificant: true,
              eventType: event.eventType || 'people'
            }));
          }
        } catch (bioError) {
          console.error('Error fetching biographical data from REST API:', bioError);
        }
      }
      
      // Process each result
      const allPageData = [];
      let processedCount = 0;
      
      for (const result of sortedResults.slice(0, 10)) {
        console.log(`Processing page ID: ${result.pageid}, Title: ${result.title}`);
        
        try {
          const pageData = await fetchPageData(result.pageid, result.title);
          
          if (pageData) {
            // Add events from page data
            if (pageData.years && pageData.years.length > 0) {
              console.log(`Found ${pageData.years.length} year references in: ${result.title}`);
              allPageData.push(pageData);
              processedCount++;
            } else {
              console.log(`No valid year data found in: ${result.title}`);
            }
            
            // Check for biographical data
            if (pageData.biographicalData && pageData.biographicalData.bioEvents) {
              const bioEvents = pageData.biographicalData.bioEvents;
              console.log(`Found ${bioEvents.length} biographical events in: ${result.title}`);
              
              // Add these events directly 
              additionalBioEvents = [
                ...additionalBioEvents,
                ...bioEvents.map(event => ({
                  year: event.year,
                  description: event.description,
                  fullDescription: event.description,
                  source: pageData.title,
                  title: pageData.title,
                  thumbnail: pageData.thumbnail,
                  preciseDate: null,
                  isSignificant: true,
                  eventType: 'people'
                }))
              ];
            }
          }
        } catch (pageError) {
          console.error(`Error processing page ${result.title}:`, pageError);
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Processed ${processedCount} pages with valid year data`);
      
      // If we have no standard data but have biographical data, use that
      if (allPageData.length === 0 && additionalBioEvents.length === 0) {
        console.log('No pages with valid historical data found');
        setLoading(false);
        setEvents([]);
        return;
      }
      
      // Process all page data into timeline events
      let processedEvents = [];
      
      for (const page of allPageData) {
        if (!page.years || !page.extract) continue;
        
        for (const year of page.years) {
          const yearNum = parseInt(year, 10);
          
          try {
            // Create context around the year in the text
            const eventData = extractEventDataFromText(page.extract, year.toString(), page.title, page.thumbnail);
            
            if (eventData) {
              const event = {
                year: yearNum,
                description: eventData.description,
                fullDescription: eventData.fullContext,
                source: page.title,
                title: page.title,
                thumbnail: page.thumbnail,
                preciseDate: extractPreciseDate(eventData.fullContext),
                isSignificant: isSignificantEvent(eventData.description),
                eventType: detectEventType(eventData.description)
              };
              
              console.log(`Created event for year ${yearNum}: ${event.description.substring(0, 50)}...`);
              processedEvents.push(event);
            }
          } catch (eventError) {
            console.error(`Error creating event for year ${year}:`, eventError);
          }
        }
      }
      
      // Add biographical events 
      if (additionalBioEvents.length > 0) {
        processedEvents = [...processedEvents, ...additionalBioEvents];
        console.log(`Added ${additionalBioEvents.length} biographical events`);
      }
      
      // Remove duplicates by checking for similar descriptions
      const uniqueEvents = processedEvents.filter((event, index, self) => 
        index === self.findIndex(e => 
          Math.abs(e.year - event.year) < 2 && 
          (stringSimilarity.compareTwoStrings(e.description, event.description) > 0.7)
        )
      );
      
      console.log(`Final processed events: ${uniqueEvents.length} (from ${processedEvents.length} total)`);
      
      if (uniqueEvents.length === 0) {
        console.log('No valid events extracted from search results');
        setLoading(false);
        setEvents([]);
        return;
      }
      
      // Cache the results
      await localforage.setItem(cacheKey, {
        events: uniqueEvents,
        timestamp: Date.now()
      });
      
      setEvents(uniqueEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error processing search results:', error);
      setLoading(false);
      setEvents([]);
    }
  }, [keyEventIndicators, isSignificantEvent, detectEventType, fetchPageData, fetchBiographicalData]);

  // Fetch Wikipedia data
  const fetchWikipediaData = useCallback(async (query) => {
    if (!query.trim()) return;
    
    // Clean and standardize the query
    const cleanedQuery = cleanSearchQuery(query);
    
    setLoading(true);
    setHasSearched(true);
    console.log('Starting search for:', cleanedQuery);
    
    try {
      // Check cache first
      const cacheKey = `wiki_${cleanedQuery.toLowerCase()}`;
      const cachedData = await localforage.getItem(cacheKey);
      
      if (cachedData && cachedData.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
        console.log('Using cached data');
        setEvents(cachedData.events);
        setLoading(false);
        return;
      }
      
      console.log('No cache found, fetching from Wikipedia API');
      
      // Use axios with proper CORS parameters for Wikipedia
      try {
        const searchResponse = await axios.get(WIKIPEDIA_API_URL, {
          params: {
            action: 'query',
            list: 'search',
            srsearch: cleanedQuery,
            format: 'json',
            origin: '*', // This is critical for CORS
            srlimit: 20,
            srqiprofile: 'classic_noboostlinks'
          }
        });
        
        console.log('Search results received:', searchResponse.data);
        processSearchResults(searchResponse.data, cleanedQuery, cacheKey);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        setLoading(false);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error in search process:', error);
      setLoading(false);
      setEvents([]);
    }
  }, [processSearchResults, cleanSearchQuery]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchWikipediaData(searchQuery);
  };

  // Handle clicking on a timeline event
  const handleTimelineEventClick = (event) => {
    setSelectedEvent(event);
    setIsInfoVisible(true);
  };

  // Close the info window
  const handleCloseInfo = () => {
    setIsInfoVisible(false);
  };

  // Handle category filter change with animation
  const handleCategoryChange = (category) => {
    if (category === categoryFilter) return;
    
    setPrevCategory(categoryFilter);
    setIsTopicChanging(true);
    
    setTimeout(() => {
      setCategoryFilter(category);
      setIsTopicChanging(false);
    }, 1000); // Increased from 600ms to 1000ms for smoother transition
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    switch(category) {
      case 'all': return 'All Events';
      case 'people': return 'Historical Figures';
      case 'events': return 'Historical Events';
      case 'innovations': return 'Innovations & Discoveries';
      default: return 'All Events';
    }
  };

  // Filter events by category
  const filteredEvents = events.filter(event => {
    if (categoryFilter === 'all') return true;
    return event.eventType === categoryFilter;
  });

  // Define animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="App">
      {showOpening && (
        <motion.div 
          className="opening-animation"
          initial={{ opacity: 1 }}
          animate={{ opacity: showOpening ? 1 : 0 }}
          exit={{ opacity: 0 }}
        >
          <div className="opener-content">
            <h1>KaalChitra</h1>
            <div className="opener-line"></div>
            <p>Travel through the corridors of time</p>
          </div>
        </motion.div>
      )}
      
      <motion.header 
        className="App-header"
        initial={{ height: '60vh' }}
        animate={{ 
          height: showOpening ? '60vh' : '250px',
          transition: { duration: 0.8, ease: 'easeInOut', delay: 0.3 }
        }}
      >
        <div className="header-bg-image"></div>
        <motion.div 
          className="title-container"
          initial={{ y: 50, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.6, delay: showOpening ? 0.7 : 0 }
          }}
        >
          <h1 
            className="main-title" 
            onMouseEnter={() => setTitleHovered(true)} 
            onMouseLeave={() => setTitleHovered(false)}
          >
            KaalChitra
            <div 
              className="title-accent" 
              style={{ 
                width: titleHovered ? '100%' : '20%',
              }}
            ></div>
          </h1>
          <p className="tagline">Travel through the corridors of time</p>
        </motion.div>
      </motion.header>
      
      <motion.div 
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: showOpening ? 0 : 1, 
          y: showOpening ? 20 : 0,
          transition: { delay: 0.2, duration: 0.6 }
        }}
      >
        <motion.div 
          className="search-container"
          initial={{ y: -20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.5, delay: 0.4 }
          }}
          whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(52, 152, 219, 0.3)' }}
        >
          <form onSubmit={handleSearch}>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search for a historical topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <motion.button 
              type="submit" 
              className="search-button"
              whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 15px rgba(52, 152, 219, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              Search
            </motion.button>
          </form>
        </motion.div>
        
        {loading ? (
          <motion.div 
            className="loader-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ClipLoader color="#3498db" size={60} />
            <p>Searching through history...</p>
          </motion.div>
        ) : (
          <>
            {events.length > 0 ? (
              <>
                <motion.div 
                  className="category-filter"
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.5, delay: 0.2 }
                  }}
                >
                  <p>Explore by Category</p>
                  <div className="filter-buttons">
                    <motion.button 
                      className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => handleCategoryChange('all')}
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      All
                    </motion.button>
                    <motion.button 
                      className={`filter-btn ${categoryFilter === 'events' ? 'active' : ''}`}
                      onClick={() => handleCategoryChange('events')}
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Events
                    </motion.button>
                    <motion.button 
                      className={`filter-btn ${categoryFilter === 'people' ? 'active' : ''}`}
                      onClick={() => handleCategoryChange('people')}
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      People
                    </motion.button>
                    <motion.button 
                      className={`filter-btn ${categoryFilter === 'innovations' ? 'active' : ''}`}
                      onClick={() => handleCategoryChange('innovations')}
                      whileHover={{ y: -3, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Innovations
                    </motion.button>
                  </div>
                </motion.div>
              
                <AnimatePresence mode="wait">
                  {isTopicChanging ? (
                    <motion.div 
                      className="topic-transition"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="transition"
                    >
                      <motion.div 
                        className="topic-transition-content"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                      >
                        <h2 className="topic-transition-title">
                          {getCategoryDisplayName(categoryFilter)}
                        </h2>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="timeline"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <TimelineGraph 
                        events={filteredEvents} 
                        onEventClick={handleTimelineEventClick} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              hasSearched && searchQuery && !loading && (
                <motion.div 
                  className="no-results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="no-results-content">
                    <h3>No historical events found</h3>
                    <p>We couldn't find any relevant historical data for "{searchQuery}".</p>
                    <p>Try a different search term like "World War II", "Ancient Rome", or "Industrial Revolution".</p>
                  </div>
                </motion.div>
              )
            )}
          </>
        )}
        
        <AnimatePresence>
          {isInfoVisible && selectedEvent && (
            <motion.div 
              className="info-window"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="info-content">
                <motion.button 
                  className="close-button" 
                  onClick={handleCloseInfo}
                  whileHover={{ backgroundColor: 'rgba(46, 204, 113, 0.7)', rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
                <motion.h3
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {selectedEvent.year}{selectedEvent.preciseDate ? ` - ${selectedEvent.preciseDate}` : ''}
                </motion.h3>
                <motion.p 
                  className="event-full-description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {selectedEvent.fullDescription}
                </motion.p>
                <motion.p 
                  className="event-source"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Source: {selectedEvent.title}
                </motion.p>
                {selectedEvent.thumbnail && (
                  <motion.div 
                    className="event-thumbnail"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <img src={selectedEvent.thumbnail} alt={selectedEvent.title} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Timeline Graph Component
function TimelineGraph({ events, onEventClick }) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showSourceWarning, setShowSourceWarning] = useState(false);
  const [questionableSource, setQuestionableSource] = useState(null);
  const containerRef = useRef(null);
  
  // Only show events if there are any
  if (!events || events.length === 0) {
    return null;
  }

  // Sort events by year (chronologically)
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);
  
  // Filter to show at least 5 significant events
  const getImportantEvents = () => {
    // First, try to get all significant events
    const significantEvents = sortedEvents.filter(event => event.isSignificant);
    
    // If we have too few significant events, add some more based on relevance
    if (significantEvents.length < 5) {
      // Add events until we have at least 5 or run out of events
      const remainingEvents = sortedEvents.filter(event => !event.isSignificant);
      const additionalEvents = remainingEvents.slice(0, 5 - significantEvents.length);
      return [...significantEvents, ...additionalEvents];
    }
    
    // If we have too many significant events, ensure we include the most recent ones
    if (significantEvents.length > 10) {
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Find events from recent years (last decade)
      const recentEvents = significantEvents.filter(event => 
        event.year >= currentYear - 10 && event.year <= currentYear
      );
      
      // Ensure we have a mix of historical and recent events
      const historicalEvents = significantEvents
        .filter(event => event.year < currentYear - 10)
        .sort((a, b) => b.isSignificant - a.isSignificant);
      
      // Add recent events first, then fill with historical ones
      const selectedEvents = [...recentEvents];
      
      // Choose events distributed across the timeline for historical events
      if (historicalEvents.length > 0) {
        const step = Math.floor(historicalEvents.length / (10 - recentEvents.length));
        for (let i = 0; i < historicalEvents.length; i += step) {
          selectedEvents.push(historicalEvents[i]);
          if (selectedEvents.length >= 10) break;
        }
      }
      
      return selectedEvents;
    }
    
    return significantEvents;
  };

  // Determine if a year needs era designation
  const needsEraDesignation = (year) => {
    // Only show BCE for years before 0
    // Only show CE for years before 1000 (ancient history)
    return year < 0 || (year > 0 && year < 1000);
  };
  
  // Check if a source might be unreliable
  const checkSourceReliability = (event) => {
    // Sources that might be problematic
    const questionableSources = [
      { name: 'narendra modi', minYear: 1950 },
      { name: 'donald trump', minYear: 1946 }
      // Add more as needed
    ];
    
    const lowerSource = (event.source || '').toLowerCase();
    const lowerTitle = (event.title || '').toLowerCase();
    
    for (const source of questionableSources) {
      if ((lowerSource.includes(source.name) || lowerTitle.includes(source.name)) && event.year < source.minYear) {
        return false; // Unreliable
      }
    }
    
    // Check for year 0 (doesn't exist in calendar)
    if (event.year === 0) {
      return false;
    }
    
    return true; // Reliable
  };
  
  // Handle clicking on an event with questionable source
  const handleEventWithQuestionableSource = (event) => {
    setQuestionableSource(event);
    setShowSourceWarning(true);
  };
  
  // Handle source warning confirmation
  const handleSourceWarningConfirm = () => {
    setShowSourceWarning(false);
    if (questionableSource) {
      onEventClick(questionableSource);
    }
  };
  
  // Handle source warning dismiss
  const handleSourceWarningDismiss = () => {
    setShowSourceWarning(false);
    setQuestionableSource(null);
  };
  
  const importantEvents = getImportantEvents();
  // Ensure strict chronological order
  const displayEvents = (showAllEvents ? sortedEvents : importantEvents).sort((a, b) => a.year - b.year);
  
  // Format precise date for better display
  const formatPreciseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Try to parse and format the date if it's a standard format
      const dateObj = new Date(dateString);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      
      // If it's not a standard format, return the original string
      return dateString;
    } catch (e) {
      return dateString;
    }
  };
  
  // Assign icons based on event type and content
  const getEventIcon = (event) => {
    const description = event.description.toLowerCase();
    
    // Check for category first
    if (event.eventType === 'people') {
      return '👤'; // Person icon
    }
    
    if (event.eventType === 'innovations') {
      return '💡'; // Light bulb for innovations
    }
    
    // Check for specific keywords for events
    if (description.includes('war') || description.includes('battle')) {
      return '⚔️'; // Swords for wars/battles
    }
    
    if (description.includes('treaty') || description.includes('agreement')) {
      return '📜'; // Scroll for treaties
    }
    
    if (description.includes('revolution') || description.includes('uprising')) {
      return '✊'; // Raised fist for revolutions
    }
    
    if (description.includes('discovery') || description.includes('found')) {
      return '🔍'; // Magnifying glass for discoveries 
    }
    
    if (description.includes('founded') || description.includes('established')) {
      return '🏛️'; // Building for foundations
    }
    
    if (description.includes('pandemic') || description.includes('disease')) {
      return '🦠'; // Virus for pandemics
    }
    
    if (description.includes('invention') || description.includes('invented')) {
      return '⚙️'; // Gear for inventions
    }
    
    if (description.includes('art') || description.includes('music') || description.includes('literature')) {
      return '🎨'; // Palette for arts
    }
    
    // Default icon for other events
    return '📅'; // Calendar as default
  };
  
  // Get segment colors for the snake timeline
  const getSegmentColor = (index) => {
    const colors = [
      'var(--primary-color)',
      'var(--secondary-color)',
      'var(--accent-color)',
      '#e74c3c',
      '#9b59b6',
      '#1abc9c'
    ];
    
    return colors[index % colors.length];
  };

  // Handle showing all events
  const handleViewAllEvents = () => {
    setShowAllEvents(true);
    // Scroll back to top of container when showing all events
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }, 100);
  };
  
  // Scroll back to top
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <motion.div 
      className="chronological-timeline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="timeline-header">
        <h3>Events in Chronological Order</h3>
        <div className="timeline-legend">
          <div className="legend-item">
            <div className="legend-color legend-ancient"></div>
            <span>Ancient Era</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-medieval"></div>
            <span>Medieval Era</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-modern"></div>
            <span>Modern Era</span>
          </div>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className={`chronological-timeline-container ${showAllEvents ? 'full-view' : ''}`}
      >
        <div className="timeline-center-line"></div>
        
        {displayEvents.map((event, index) => {
          const formattedDate = formatPreciseDate(event.preciseDate);
          const icon = getEventIcon(event);
          const segmentColor = getSegmentColor(index);
          const isReliableSource = checkSourceReliability(event);
          
          // Determine era for styling
          let eraClass = '';
          if (event.year < 500) eraClass = 'ancient-era';
          else if (event.year < 1500) eraClass = 'medieval-era';
          else eraClass = 'modern-era';
          
          // For performance, only animate items that are visible initially
          const shouldAnimate = !showAllEvents || index < 15;
          
          return (
            <motion.div 
              key={`${event.year}-${index}`}
              className={`chronological-event ${eraClass} ${!isReliableSource ? 'questionable-source' : ''}`}
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 1.5) }}
            >
              <div className="event-year-marker">
                <div className="year-bubble" style={{ background: segmentColor }}>
                  {event.year < 0 ? Math.abs(event.year) : event.year}
                  {event.year < 0 && <span className="era-label">BCE</span>}
                </div>
              </div>
              
              <motion.div 
                className={`chronological-event-card ${!isReliableSource ? 'questionable-source-card' : ''}`}
                whileHover={{ scale: 1.03, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.4)' }}
                onClick={() => isReliableSource ? onEventClick(event) : handleEventWithQuestionableSource(event)}
                style={{
                  borderLeftColor: segmentColor
                }}
              >
                {!isReliableSource && (
                  <div className="source-warning-icon" title="Questionable source or date">⚠️</div>
                )}
                
                <div className="event-icon" role="img" aria-label="Event icon">
                  {icon}
                </div>
                
                <div className="chronological-event-content">
                  <div className="chronological-event-date">
                    <div className="chronological-event-year">
                      {event.year < 0 
                        ? `${Math.abs(event.year)} BCE` 
                        : needsEraDesignation(event.year) ? `${event.year} CE` : `${event.year}`}
                    </div>
                    {formattedDate && (
                      <div className="chronological-event-precise-date">{formattedDate}</div>
                    )}
                  </div>
                  
                  <p className="chronological-event-description">{event.description}</p>
                  <div className="chronological-event-source">Source: {event.title}</div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
        
        {showAllEvents && displayEvents.length > 10 && (
          <button className="back-to-top" onClick={scrollToTop}>
            Back to Top
          </button>
        )}
      </div>
      
      {!showAllEvents && (
        <div className="timeline-read-more">
          <motion.button 
            className="timeline-full-article-btn"
            whileHover={{ 
              y: -5, 
              scale: 1.05,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(52, 152, 219, 0.4)' 
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAllEvents}
          >
            View Complete Timeline
          </motion.button>
        </div>
      )}
      
      {showAllEvents && (
        <div className="timeline-read-more">
          <motion.button 
            className="timeline-full-article-btn"
            whileHover={{ 
              y: -5, 
              scale: 1.05,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(52, 152, 219, 0.4)' 
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllEvents(false)}
          >
            Show Less
          </motion.button>
        </div>
      )}
      
      {showSourceWarning && (
        <div className="source-warning-modal">
          <div className="source-warning-content">
            <h4>⚠️ Questionable Source or Date</h4>
            <p>This event's source or date may be historically inaccurate:</p>
            <p className="source-warning-details">
              Year: <strong>{questionableSource?.year}</strong><br/>
              Source: <strong>{questionableSource?.title}</strong>
            </p>
            <p>Historical figures cannot be associated with events before they existed.</p>
            <div className="source-warning-buttons">
              <button onClick={handleSourceWarningDismiss}>Dismiss</button>
              <button onClick={handleSourceWarningConfirm}>View Anyway</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Function to extract event data from text
const extractEventDataFromText = (fullText, yearStr, source, thumbnail) => {
  try {
    if (!fullText || !yearStr) return null;
    
    // Convert to string to ensure we have a string type
    const text = String(fullText);
    const year = String(yearStr);
    
    // Find the position of the year in the text
    const yearPos = text.indexOf(year);
    if (yearPos === -1) return null;
    
    // Get context before and after the year
    const startPos = Math.max(0, yearPos - 150);
    const endPos = Math.min(text.length, yearPos + 250);
    
    // Extract full context
    let fullContext = text.substring(startPos, endPos);
    
    // If we started in the middle of a sentence, trim to start at a sensible point
    if (startPos > 0) {
      const firstSentenceStart = fullContext.search(/[.!?]\s+[A-Z]/);
      if (firstSentenceStart !== -1) {
        fullContext = fullContext.substring(firstSentenceStart + 2);
      }
    }
    
    // Ensure we end at a sentence boundary
    const lastSentenceEnd = fullContext.lastIndexOf('.');
    if (lastSentenceEnd !== -1) {
      fullContext = fullContext.substring(0, lastSentenceEnd + 1);
    }
    
    // Create a more concise description (around 25 words)
    const words = fullContext.split(/\s+/);
    const descWords = words.slice(0, 25);
    let description = descWords.join(' ');
    
    // Add ellipsis if we truncated
    if (words.length > 25) {
      description += '...';
    }
    
    return {
      year: parseInt(year, 10),
      description,
      fullContext,
      source,
      thumbnail
    };
  } catch (error) {
    console.error('Error extracting event data:', error);
    return null;
  }
};

// Function to clean up text for consistency
const cleanupText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\([^)]*\)/g, '') // Remove content in parentheses
    .replace(/\[[^\]]*\]/g, '') // Remove content in square brackets
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

// Function to extract precise dates using regex
const extractPreciseDates = (text) => {
  if (!text) return [];
  
  const patterns = [
    // Full date patterns
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{3,4}\b/gi,
    // Day-month-year patterns
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{3,4}\b/gi,
    // Year ranges
    /\b\d{3,4}(?:\s*-\s*\d{2,4})\b/g,
    // Century references
    /\b(?:\d{1,2})(?:st|nd|rd|th)?\s+century\b/gi
  ];
  
  let allDates = [];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    allDates = [...allDates, ...matches];
  }
  
  return allDates;
};

// Calculate significance score for content
const calculateSignificanceScore = (text, title) => {
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Keywords indicating significance
  const significanceKeywords = [
    { term: 'significant', weight: 3 },
    { term: 'important', weight: 3 },
    { term: 'major', weight: 2 },
    { term: 'famous', weight: 2 },
    { term: 'revolutionary', weight: 3 },
    { term: 'groundbreaking', weight: 3 },
    { term: 'historic', weight: 2 },
    { term: 'renowned', weight: 2 },
    { term: 'pivotal', weight: 3 },
    { term: 'influential', weight: 2 },
    { term: 'discovery', weight: 2 },
    { term: 'invention', weight: 2 },
    { term: 'founded', weight: 1 },
    { term: 'established', weight: 1 },
    { term: 'created', weight: 1 }
  ];
  
  // Check for significance keywords
  for (const keyword of significanceKeywords) {
    if (lowerText.includes(keyword.term)) {
      score += keyword.weight;
    }
  }
  
  // Check title relevance - usually if the page is specifically about a year
  // it's more likely to contain significant events
  if (/^\d{3,4}$/.test(title.trim())) {
    score += 3;
  }
  
  // Length can be an indicator of significance
  if (text.length > 1000) {
    score += 1;
  }
  
  return score;
};

// Determine content type from text
const determineContentType = (text, title) => {
  if (!text) return 'unknown';
  
  const lowerText = text.toLowerCase();
  
  // Person indicators
  const personPatterns = [
    'born', 'died', 'birth', 'death', 'biography', 'was a',
    'philosopher', 'scientist', 'inventor', 'leader', 'king', 'queen',
    'emperor', 'president', 'prime minister', 'artist', 'musician', 'writer'
  ];
  
  // Event indicators
  const eventPatterns = [
    'occurred', 'happened', 'took place', 'battle', 'war', 'treaty',
    'revolution', 'uprising', 'movement', 'disaster', 'earthquake', 'flood',
    'signed', 'declared', 'began', 'ended', 'founded', 'established'
  ];
  
  // Innovation indicators
  const innovationPatterns = [
    'invented', 'discovered', 'innovation', 'technology', 'developed',
    'created', 'designed', 'patented', 'breakthrough', 'advancement',
    'first', 'new', 'novel', 'pioneering'
  ];
  
  // Count occurrences
  let personCount = 0;
  let eventCount = 0;
  let innovationCount = 0;
  
  // Check person patterns
  for (const pattern of personPatterns) {
    if (lowerText.includes(pattern)) personCount++;
  }
  
  // Check event patterns
  for (const pattern of eventPatterns) {
    if (lowerText.includes(pattern)) eventCount++;
  }
  
  // Check innovation patterns
  for (const pattern of innovationPatterns) {
    if (lowerText.includes(pattern)) innovationCount++;
  }
  
  // Determine dominant type
  if (personCount > eventCount && personCount > innovationCount) {
    return 'people';
  } else if (eventCount > personCount && eventCount > innovationCount) {
    return 'events';
  } else if (innovationCount > personCount && innovationCount > eventCount) {
    return 'innovations';
  }
  
  // Check title as fallback
  const lowerTitle = title.toLowerCase();
  if (personPatterns.some(p => lowerTitle.includes(p))) {
    return 'people';
  } else if (eventPatterns.some(p => lowerTitle.includes(p))) {
    return 'events';
  } else if (innovationPatterns.some(p => lowerTitle.includes(p))) {
    return 'innovations';
  }
  
  // Default
  return 'events';
};

export default App;