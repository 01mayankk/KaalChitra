import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TimelineGraph.css';

// Modern cosmic/scientific icons and colors for timeline nodes
const ICONS = [
  '📜', // ancient history
  '🏛️', // classical era
  '⚔️', // medieval period
  '🧭', // age of exploration
  '🔬', // scientific revolution
  '🏭', // industrial revolution
  '✈️', // modern era
  '💻', // digital age
  '🚀', // space age
  '🧬', // contemporary era
];

const COLORS = [
  '#5e60ce', // periwinkle
  '#f28482', // pink
  '#5390d9', // blue
  '#f8961e', // orange
  '#90be6d', // green
  '#43aa8b', // teal
  '#577590', // slate blue
  '#f9c74f', // yellow
  '#4cc9f0', // sky blue
  '#ff9770'  // coral
];

// Time period classification with enhanced information
const getTimePeriod = (year) => {
  const yearNum = parseInt(year);
  if (yearNum < 500) return { 
    name: "Ancient Era", 
    icon: '📜',
    description: "The foundation of human civilization spanning from the earliest written records to the fall of the Western Roman Empire."
  };
  if (yearNum < 1400) return { 
    name: "Medieval Period", 
    icon: '⚔️',
    description: "The period between ancient and modern times, characterized by feudalism, the rise of kingdoms, and the influence of the Church."
  };
  if (yearNum < 1700) return { 
    name: "Renaissance Era", 
    icon: '🧭',
    description: "A period of cultural, artistic, political, and economic 'rebirth' marking the transition from the Middle Ages to modernity."
  };
  if (yearNum < 1800) return { 
    name: "Age of Enlightenment", 
    icon: '🔬',
    description: "An intellectual and philosophical movement that dominated the world of ideas in Europe, emphasizing reason and individualism."
  };
  if (yearNum < 1900) return { 
    name: "Industrial Era", 
    icon: '🏭',
    description: "A period of rapid industrial growth with far-reaching impacts on daily life, economy, and the environment."
  };
  if (yearNum < 1945) return { 
    name: "Modern Era", 
    icon: '✈️',
    description: "A period marked by technological advancements, global conflicts, and significant social changes."
  };
  if (yearNum < 1990) return { 
    name: "Atomic Age", 
    icon: '☢️',
    description: "The period beginning with the development of nuclear weapons and nuclear power, coinciding with the Cold War."
  };
  if (yearNum < 2010) return { 
    name: "Digital Age", 
    icon: '💻',
    description: "The rise of personal computers, internet, and digital technologies that transformed how we communicate and access information."
  };
  return { 
    name: "Information Age", 
    icon: '📱',
    description: "Our current era of rapid information exchange, where data has become a primary economic resource."
  };
};

// Enhanced quotes for timeline endings that are more inspirational and impactful
const ENDING_QUOTES = [
  "The future belongs to those who learn from the past to create a better tomorrow.",
  "History teaches us not just what happened, but what is possible.",
  "Those who cannot remember the past are condemned to repeat it. — George Santayana",
  "A people without the knowledge of their past history, origin and culture is like a tree without roots. — Marcus Garvey",
  "The farther backward you can look, the farther forward you are likely to see. — Winston Churchill",
  "The more you know about the past, the better prepared you are for the future. — Theodore Roosevelt",
  "The past is never dead. It's not even past. — William Faulkner",
  "History is not just what happened in the past, but a roadmap to the future."
];

// API endpoints for fetching additional information about historical events
const HISTORY_API_ENDPOINTS = {
  WIKI_API: "https://en.wikipedia.org/w/api.php",
  WIKIDATA: "https://www.wikidata.org/w/api.php"
};

const TimelineGraph = ({ data, title, onEventClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState("");

  // Select a random quote from ENDING_QUOTES
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * ENDING_QUOTES.length);
    setSelectedQuote(ENDING_QUOTES[randomIndex]);
  }, []);

  useEffect(() => {
    if (data) {
      setLoading(true);
      setTimeout(() => {
        setEvents(data);
        setLoading(false);
      }, 800);
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [data]);

  // Function to get icon based on year and apply appropriate color
  const getIconForYear = (year) => {
    const period = getTimePeriod(year);
    return period.icon;
  };

  // Get color for timeline node based on index
  const getColorForIndex = (index) => {
    return COLORS[index % COLORS.length];
  };

  // Function to fetch additional information from Wikipedia API (simulated)
  const fetchAdditionalInfo = async (eventTitle) => {
    console.log(`Fetching additional info for: ${eventTitle} from ${HISTORY_API_ENDPOINTS.WIKI_API}`);
    // In a real implementation, this would make an API call
    return `Additional information would be fetched from Wikipedia API for: ${eventTitle}`;
  };

  // Handle event click with additional information
  const handleEventClick = async (event, e) => {
    // Simulate fetching additional information
    const additionalInfo = await fetchAdditionalInfo(event.description);
    
    // Enhance the event with additional information
    const enhancedEvent = {
      ...event,
      additionalInfo,
      timePeriod: getTimePeriod(event.year)
    };
    
    if (onEventClick) {
      onEventClick(enhancedEvent, e);
    }
  };

  if (!events || events.length === 0) {
    return null;
  }

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);
  
  // Create segments based on time periods (e.g., every 10 years)
  const timeSegments = [
    { id: "start", label: "START", color: "#546279" },
    { id: "0", label: "0", color: "#f0c14b" }, // Starting marker
    { id: "100", label: "100", color: "#3498db" } // Ending marker
  ];
  
  // Add path colors to match second image style
  const pathColors = ["#f0c14b", "#f17c67", "#da70d6", "#5dade2"];
  
  return (
    <div className="timeline-container">
      <h2 className="timeline-title">{title || "Historical Timeline"}</h2>
      
      {loading ? (
        <motion.div 
          className="timeline-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="loading-spinner"></div>
          <p>Exploring the annals of history...</p>
        </motion.div>
      ) : events.length === 0 ? (
        <div className="timeline-empty">
          <p>No historical events found. Try searching for a different keyword.</p>
        </div>
      ) : (
        <div className="timeline-content">
          <div className="timeline-track">
            <div className="timeline-line"></div>
            
            <AnimatePresence>
              {sortedEvents.map((event, index) => {
                const isLeft = index % 2 === 0;
                const pathColor = pathColors[index % pathColors.length];
                
                return (
                  <motion.div 
                    key={`${event.year}-${index}`}
                    className={`zigzag-event-card ${isLeft ? 'left' : 'right'}`}
                    style={{ '--path-color': pathColor }}
                  >
                    {/* Event marker */}
                    <div className="event-year-marker">
                      {event.year}
                    </div>
                    
                    {/* Event content with exact date */}
                    <div className="zigzag-event-content">
                      <div className="zigzag-date-container">
                        <div className="zigzag-event-year">{event.year}</div>
                        {event.preciseDate && (
                          <div className="zigzag-event-date">{event.preciseDate}</div>
                        )}
                      </div>
                      <div className="zigzag-event-info">
                        <h4>{event.description}</h4>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Timeline ending with quote */}
            {events.length > 0 && (
              <motion.div 
                className="timeline-ending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: events.length * 0.1 + 0.5, duration: 1 }}
              >
                <div className="ending-icon">🏁</div>
                <div className="ending-quote">{selectedQuote}</div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineGraph; 