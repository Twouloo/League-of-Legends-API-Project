import '../stylings/SearchBar.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState('🌐');
  const navigate = useNavigate();
  const [isQueryNotEmpty, setIsQueryNotEmpty] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
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
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 250);
    return () => {
      clearTimeout(typingTimer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (isQueryNotEmpty && !isTyping) {
      fetchRecommendedUsers();
    }
  }, [isQueryNotEmpty, isTyping]);

  useEffect(() => {
    console.log("Result: ");
    console.log(recommendedUsers);
  }, [recommendedUsers]);

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

  const fetchRecommendedUsers = async () => {
    try {
      const region = selectedOption === '🌐' ? 'OCE' : selectedOption;
      const response = await fetch('http://localhost:3001/api/getRecommendedUsers', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ player: searchQuery, region })
      });
      const data = await response.json();
      setRecommendedUsers(data.players);

    } catch (error) {
      console.error('Error:', error);
    }
  }

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

  const handlePlayerClick = async (event) => {
    if (selectedOption === '🌐') {
      await navigate(`/summoners/OCE/${event}`);
    } else {
      await navigate(`/summoners/${selectedOption}/${event}`);
    }
  }

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
        placeholder="Start the hunt"
        onKeyDown={handleKeyDown}
        className="searchbar"
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
      

      {searchQuery.length > 0 && recommendedUsers.length > 0 && searchIsClicked &&
        <ul className="recommended-users">
          {recommendedUsers.map((player) => (
            <ul className="playerContainer">
              <div className="player" onClick={() => handlePlayerClick(player.playername)}>
                <img className="pfp" src={require(`../imgs/profileIcons/${player.pfpid}.webp`)} alt="pfp is brokie :(" />
                <div className="playerInfo">
                  <li key={player.playername} className="playerName">{player.playername}</li>
                  <li key={player.rank} className="playerRank">{player.rank != null ? player.rank : player.level}</li>
                </div>
              </div>
            </ul>
          ))}
        </ul>
      }
    </div>
  );
}

export default SearchBar;