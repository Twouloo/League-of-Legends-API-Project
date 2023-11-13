import { useEffect } from 'react';
import '../stylings/Summoner.css';
import { useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SearchBarTop from '../components/SearchBarTop';
import RecentUser from '../components/RecentUser';
import Calendar from '../components/Calendar';
import Graph from '../components/Graph';
import { fetchConfig } from '../components/fetchConfig';

function Summoner() {
  let { region, summoner } = useParams();
  let location = useLocation();
  const [notFound, setNotFound] = useState(false);
  const [updateAPI, setUpdateAPI] = useState(false);
  const [selectedPlayerHasLoaded, setSelectedPlayerHasLoaded] = useState(false);
  const [recentPlayersHasLoaded, setRecentPlayersHasLoaded] = useState(false);
  const [serviceDown, setServiceDown] = useState(false);
  const [pfp, setPfp] = useState('');
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [currentPlayerRank, setCurrentPlayerRank] = useState('');
  const [currentPlayerLevel, setCurrentPlayerLevel] = useState('');
  const [allRecentPlayers, setAllRecentPlayers] = useState({});
  const [currentRecentPlayer, setCurrentRecentPlayer] = useState('');
  const [currentRecentPlayerPfpID, setCurrentRecentPlayerPfpID] = useState('');
  const [currentRecentPlayerRank, setCurrentRecentPlayerRank] = useState('');
  const [currentRecentPlayerGraphTime, setCurrentPlayerGraphTime] = useState([]);
  const [chosenDayArr, setChosenDayArr] = useState({});
  const [randomUser, setRandomUser] = useState('Username...');
  const [siteCount, setSiteCount] = useState('...');

  function setTimeForGraph(player, allRecentPlayers) {
    const timesForGraph = {};
    const timesForGraphArray = [];

    console.log(player);
    console.log(allRecentPlayers);
    Object.keys(allRecentPlayers[player][0].datesPlayed).map((date) => {
      const time = roundToNearest30Minutes(new Date(date));
      if (timesForGraph[time]) {
        timesForGraph[time].y += 1;
      }
      else timesForGraph[time] = { y: 1 };
    });

    Object.keys(timesForGraph).map((key) => {
      timesForGraphArray.push({ x: key, y: timesForGraph[key].y })
    });

    timesForGraphArray.sort(sortByTime);
    console.log(timesForGraphArray);
    return timesForGraphArray;
  }

  function setSingleDayForGraph(arr) {

    const timesForGraph = {};
    const timesForGraphArray = [];

    arr.map((date) => {
      const time = roundToNearest30Minutes(new Date(date));
      if (timesForGraph[time]) {
        timesForGraph[time].y += 1;
      }
      else timesForGraph[time] = { y: 1 };
    })

    Object.keys(timesForGraph).map((key) => {
      timesForGraphArray.push({ x: key, y: timesForGraph[key].y })
    });

    timesForGraphArray.sort(sortByTime);

    return timesForGraphArray;
  }

  function sortByTime(a, b) {
    const timeA = new Date('1970-01-01 ' + a.x);
    const timeB = new Date('1970-01-01 ' + b.x);
    return timeA - timeB;
  }

  const handleRecentUserClick = (player, pfpid, rank) => {
    console.log('Test: ', player);
    setCurrentPlayerGraphTime(setTimeForGraph(player, allRecentPlayers));
    setCurrentRecentPlayer(player);
    setCurrentRecentPlayerPfpID(pfpid);
    setCurrentRecentPlayerRank(rank);
  };

  const getRandomUserName = async () => {
    setRandomUser('Loading...');
    const backendURL = await fetchConfig();
    const randomUserResponse = await fetch(`${backendURL}/api/getRandomUser`, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ region: region })
    });
    const randomUserResponseData = await randomUserResponse.json();
    setRandomUser(randomUserResponseData.name);
  }

  useEffect(() => {
    const getSummoner = async () => {
      try {
        const backendURL = await fetchConfig();
        const summonerResponse = await fetch(`${backendURL}/api/getPlayer`, {
          method: 'POST',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({ summonerName: summoner, region: region })
        });
        const summonerResponseData = await summonerResponse.json();
        if (summonerResponseData.status === 200) {
          setPfp(summonerResponseData.pfpid);
          setCurrentPlayerName(summonerResponseData.playername);
          setCurrentPlayerRank(summonerResponseData.rank);
          setCurrentPlayerLevel(summonerResponseData.level);
          setNotFound(false);
          setUpdateAPI(false);
          setSelectedPlayerHasLoaded(true);
        }
        if (summonerResponseData.status === 404) {
          setNotFound(true);
          setUpdateAPI(false);
          setServiceDown(false);
          setCurrentRecentPlayer('');
          console.log("404");
        }
        else if (summonerResponseData.status === 503) {
          setServiceDown(true);
          setNotFound(false);
          setUpdateAPI(false);
          setSelectedPlayerHasLoaded(true);
          setRecentPlayersHasLoaded(true);
          console.log("503");
        }
        else if (summonerResponseData.status === 400) {
          setUpdateAPI(true);
          setNotFound(false);
          setServiceDown(false);
          console.log("400");
        }
        else {
          console.log(summonerResponseData.status);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getRecentPlayers = async () => {
      try {
        const backendURL = await fetchConfig();
        const recentPlayersResponse = await fetch(`${backendURL}/api/getMatchHistory`, {
          method: 'POST',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({ summonerName: summoner, region: region })
        });
        const recentPlayersData = await recentPlayersResponse.json();
        if (recentPlayersData.status === 200) {
          const recentPlayers = recentPlayersData.result;
          console.log(recentPlayersData.result);
          setCurrentPlayerGraphTime(setTimeForGraph(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].playername, recentPlayers));
          setRecentPlayersHasLoaded(true);
          setAllRecentPlayers(recentPlayersData.result);
          setCurrentRecentPlayer(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].playername);
          setCurrentRecentPlayerPfpID(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].pfpid);
          setCurrentRecentPlayerRank(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].rank != null ?
            recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].rank :
            recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].level);
        }
        if (recentPlayersData.status === 404) {
          console.log(recentPlayersData.status);
        }
        else if (recentPlayersData.status === 400) {
          console.log(recentPlayersData.status);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const getCount = async () => {
      try {
        const backendURL = await fetchConfig();
        const siteCountResponse = await fetch(`${backendURL}/api/getCount`);
        const siteCountResponseData = await siteCountResponse.json();
        console.log(siteCountResponseData);
        setSiteCount(siteCountResponseData.count);
      } catch (error) { console.log(error); }
    }

    getCount();
    getSummoner();
    getRecentPlayers();
  }, [location]);

  // UseEffect for when calendar cell is clicked on
  useEffect(() => {
    console.log(chosenDayArr);
    if (chosenDayArr.length > 0)
      setCurrentPlayerGraphTime(setSingleDayForGraph(chosenDayArr));
  }, [chosenDayArr]);


  function roundToNearest30Minutes(date) {
    const minutes = date.getMinutes();
    const roundedDate = new Date(date);
    if (30 - minutes <= -15) {
      roundedDate.setHours(roundedDate.getHours() + 1);
      roundedDate.setMinutes(0);
      roundedDate.setSeconds(0);
    } else if (30 - minutes <= 15) {
      roundedDate.setMinutes(30);
      roundedDate.setSeconds(0);
    } else {
      roundedDate.setMinutes(0);
      roundedDate.setSeconds(0);
    }

    const hours = roundedDate.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const minutesStr = String(roundedDate.getMinutes()).padStart(2, '0');
    const formattedTime = `${formattedHours}:${minutesStr} ${ampm}`;
    return formattedTime;
  }

  return (
    <div className="Summoners" >
      <div className="container">
        <div className="top-bar">
          <div className="summonerSearchBar">
            <div className="dashboard">
              <span id="dashboard">Dashboard</span>
            </div>
            <SearchBarTop />
            <p className="site-count">Num. visits: {siteCount}  </p>
          </div>
        </div>

        <div className="inner-summoner-container">
          {!selectedPlayerHasLoaded ? (<div className="current-player">Loading !</div>) : (
            notFound === false && updateAPI === false && serviceDown === false && pfp != null ? (

              <div className="current-player">
                <img className="current-player-pfp" src={require(`../imgs/profileIcons/${pfp}.webp`)} alt="pfp is brokie :(" />
                <div className="current-player-info">
                  <li className="current-player-name">{currentPlayerName}</li>
                  <li className="current-player-rank">{currentPlayerRank != null ? currentPlayerRank : currentPlayerLevel}</li>
                </div>
              </div>
            ) : (<p></p>))}

          {(!recentPlayersHasLoaded) ? (<div className="recent-container">Loading Recent Players !</div>) :
            ((serviceDown === false) && (notFound === false)) ? (

              <div className="recent-icons">
                {
                  Object.entries(allRecentPlayers).map((player) =>
                    <div key={player} onClick={() => handleRecentUserClick(player[0], player[1][1].pfpid, player[1][1].rank != null ? player[1][1].rank : player[1][1].level)}>
                      <RecentUser playerInfo={player} />
                    </div>
                  )
                }
              </div>
            ) : <p></p>}
        </div>
        {notFound &&
          <div className="not-found">
            <p>Sorry user could not be found, please try again ☠️</p>
          </div>}

        {updateAPI &&
          <div className="updateAPI">
            <p>The api key is expired</p>
          </div>}
        {recentPlayersHasLoaded && currentRecentPlayer !== '' && (
          <div className="recent-container">
            <div className="recent-player-card">
              <img className="recent-player-pfp" src={require(`../imgs/profileIcons/${currentRecentPlayerPfpID}.webp`)} alt="pfp is brokie :(" />
              <div className="recent-player-info">
                <li className="recent-player-title">{currentRecentPlayer} </li>
                <li className="recent-player-rank">{currentRecentPlayerRank}</li>
              </div>
            </div>

            <div className="public-holidays-container">
              <p className="best-holiday-label">Best suited holiday to play: </p>
              <li className="best-holiday-answer">{allRecentPlayers[currentRecentPlayer][0].bestHoliday.name} : {allRecentPlayers[currentRecentPlayer][0].bestHoliday.date}</li>
              <p className="next-holiday-label">Next upcoming holiday: </p>
              <li className='next-holiday-answer'>{allRecentPlayers[currentRecentPlayer][0].nextMostHoliday.name} : {allRecentPlayers[currentRecentPlayer][0].nextMostHoliday.date}</li>
            </div>

            <div className="get-random-username">
              <div className="random-username-tag">
                <p className="random-username-label" onClick={() => getRandomUserName()}>Generate random username</p>
                <p className="random-username-result">{randomUser}</p>
              </div>
            </div>
          </div>
        )}

        {recentPlayersHasLoaded && currentRecentPlayer !== '' && currentRecentPlayerGraphTime.length > 0 &&
          <div className="stats-container">
            <Calendar playerTimes={Object.keys(allRecentPlayers[currentRecentPlayer][0].datesPlayed)} setChosenDayArr={setChosenDayArr} />
            <div className="graph">
              <Graph graphTimes={currentRecentPlayerGraphTime} />
            </div>


          </div>
        }

      </div>
    </div>

  )
}

export default Summoner