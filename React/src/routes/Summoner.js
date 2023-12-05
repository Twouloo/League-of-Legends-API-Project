import { useEffect } from 'react';
import '../stylings/Summoner.css';
import { useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SearchBarTop from '../components/SearchBarTop';
import RecentUser from '../components/RecentUser';
import Calendar from '../components/Calendar';
import Graph from '../components/Graph';
import Match from '../components/Match';

function Summoner() {
  let { region, summoner } = useParams();
  let location = useLocation();

  const [scrollPosition, setScrollPosition] = useState(0);

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
  const [currentPlayerInfo, setCurrentPlayerInfo] = useState({});
  const [allGames, setAllGames] = useState([]);

  function setTimeForGraph(player, allRecentPlayers) {
    const timesForGraph = {};
    const timesForGraphArray = [];

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

  useEffect(() => {

    const getSummoner = async () => {
      try {
        const summonerResponse = await fetch('http://localhost:3001/api/getPlayer', {
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
          setSelectedPlayerHasLoaded(false);
          setRecentPlayersHasLoaded(false);
          setUpdateAPI(false);
          setServiceDown(false);
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
        const recentPlayersResponse = await fetch('http://localhost:3001/api/getMatchHistory', {
          method: 'POST',
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({ summonerName: summoner, region: region })
        });
        const recentPlayersData = await recentPlayersResponse.json();
        if (recentPlayersData.status === 200) {
          const recentPlayers = recentPlayersData.result;
          setCurrentPlayerGraphTime(setTimeForGraph(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].playername, recentPlayers));
          setRecentPlayersHasLoaded(true);
          setAllRecentPlayers(recentPlayersData.result); // Sort recent players by appearance count
          setCurrentRecentPlayer(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].playername);
          setCurrentRecentPlayerPfpID(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].pfpid);
          setCurrentRecentPlayerRank(recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].rank != null ?
            recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].rank :
            recentPlayersData.result[Object.keys(recentPlayersData.result)[0]][1].level);
          setCurrentPlayerInfo(recentPlayersData.currentPlayer);
          setAllGames(recentPlayersData.allGames);
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

    getSummoner();
    getRecentPlayers();
  }, [location]);

  // Log fetch error
  useEffect(() => {
    console.log(serviceDown);
  }, [serviceDown]);

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
    <div className="container">
      <div className="top-bar">
        <div className="summonerSearchBar">
          <div className="dashboard">
            <span id="dashboard">Dashboard</span>
          </div>
          <SearchBarTop />
        </div>
      </div>

      <div className='first-container'>
        {!selectedPlayerHasLoaded ? (<div className="current-player">Loading !</div>) : (
          notFound === false && updateAPI === false && serviceDown === false && pfp != null ? (

            <div className="current-player">
              <img className="current-player-pfp" src={require(`../imgs/profileIcons/${pfp}.webp`)} alt="pfp is brokie :(" />
              <div className="current-player-info">
                <li className="current-player-name">{currentPlayerName}</li>
                <li className="current-player-rank">{currentPlayerRank != null ? currentPlayerRank : currentPlayerLevel}</li>
              </div>
              <div className='current-player-stats'>

              </div>
            </div>

          ) : (<p></p>))}
      </div>
      <div className='second-container'>
        {(!recentPlayersHasLoaded) ? (<div className="recent-container">Loading Recent Players !</div>) :
          (serviceDown === false) ? (
            <div className='recent-container'>
              <p className='recent-title'>Most played with friends</p>
              <div className="recent-icons">
                {
                  Object.entries(allRecentPlayers).sort(function (a, b) { return b[1][0].appearanceCount - a[1][0].appearanceCount }).map((player) =>
                    // Sort all recent players by most times played with, and create a recent player component for each player.

                    <div key={player} onClick={() => handleRecentUserClick(player[0], player[1][1].pfpid, player[1][1].rank != null ? player[1][1].rank : player[1][1].level)}>
                      <RecentUser playerInfo={player} />
                    </div>
                  )
                }
              </div>
            </div>
          ) : <div className="service-down">
            League of Legends API service is currently down, please try again later 💀
          </div>}

        {allGames.length !== 0 && selectedPlayerHasLoaded && recentPlayersHasLoaded && (
          <div className='match-container'>
            {
              Object.entries(allGames).sort(function (a, b) { return b[1].gameCreation - a[1].gameCreation }).splice(0, 6).map((singleMatch) =>
                <div key={singleMatch.gameCreation}>
                  <Match match={singleMatch[1]} currentPlayer={currentPlayerName} />
                </div>
              )
            }
          </div>
        )}

        {recentPlayersHasLoaded && currentRecentPlayerGraphTime.length > 0 &&
          <div className="stats-container">
            <div className='calendar-container'>
              <p className="calendar-title">Dates played</p>
              <Calendar playerTimes={Object.keys(currentPlayerInfo.datesPlayed)} setChosenDayArr={setChosenDayArr} />
            </div>

            <div className='graph-container'>
            <p className="graph-title">Hours of the day played</p>
              <div className="graph">
                <Graph graphTimes={currentRecentPlayerGraphTime} />
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}

export default Summoner