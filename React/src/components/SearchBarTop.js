import '../stylings/SearchBarTop.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBarTop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState('🌐');
  const navigate = useNavigate();
  const [isQueryNotEmpty, setIsQueryNotEmpty] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchIsClicked, setSearchIsClicked] = useState(false);
  const [isRegionMenuActive, setIsRegionMenuActive] = useState(false);
  const searchBarRef = useRef(null);
  const regionMenuRef = useRef(null);

  const options = [
    { value: 'OCE', label: 'Oceania' },
    { value: 'NA', label: 'North America' },
    { value: 'EW', label: 'Europe West' },
    { value: 'EA', label: 'Europe Nordic & East' },
    { value: 'KR', label: 'Korea' },
    { value: 'JPN', label: 'Japan' },
    { value: 'BRL', label: 'Brazil' },
    { value: 'LAS', label: 'LAS' },
    { value: 'LAN', label: 'LAN' },
    { value: 'RSA', label: 'Russia' },
    { value: 'TRK', label: 'Turkiye' },
    { value: 'SG', label: 'Singapore' },
    { value: 'PH', label: 'Philippines' },
    { value: 'TWN', label: 'Taiwan' },
    { value: 'VT', label: 'Vietnam' },
    { value: 'TL', label: 'Thailand' },
  ];

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const clickedElement = event.target;

      if(searchBarRef.current && searchBarRef.current.contains(clickedElement)) {
        setSearchIsClicked(true);
        setIsRegionMenuActive(false);
        return;
      }

      if(regionMenuRef.current && regionMenuRef.current.contains(clickedElement)) {
        setIsRegionMenuActive((prevIsRegionMenuActive) => !prevIsRegionMenuActive);
        setSearchIsClicked(false); 
        return;
      }
      setSearchIsClicked(false); 
      setIsRegionMenuActive(false);
    }

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isRegionMenuActive])

  useEffect(() => {
    handleRegionChange();
  })


  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (selectedOption === '🌐') {
        navigate(`/summoners/OCE/${searchQuery}`);
      } else {
        navigate(`/summoners/${selectedOption}/${searchQuery}`);
      }
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsQueryNotEmpty(value.trim() !== '');
    setIsTyping(true);
  };


  const handleRegionChange = () => {
      var element = document.getElementById("slide");

      if(isRegionMenuActive) element.style.height = '26vh';
      else element.style.height = '0vh';
  }

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchInputChange}
        placeholder="Search for person"
        onKeyDown={handleKeyDown}
        className="searchbarTop"
        spellCheck="false"
        ref={searchBarRef}
      />
      <label className="regionMenu">
        <span ref={regionMenuRef}>{selectedOption}</span>
      </label>


      <ul className={"slide"} id="slide">
        {options.map((option) => (
          <li key={option.value} onClick={() => setSelectedOption(option.value)}>
            {option.label}
          </li>
        ))}
      </ul>
      
    </div>
  );
}

export default SearchBarTop;