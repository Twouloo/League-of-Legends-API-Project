import '../stylings/Match.css';
import { useEffect, useState } from 'react';

function findPlayersTeamSide(playerName) {
    return function (element) {
        return element.summonerName === playerName;
    };
}

function determineTimeElapsed(time) {
    // Get the time difference between game finish and now
    const timeSinceNow = Date.now() - new Date(time);

    // Return Days, hours or seconds passed since the game finish and now
    return timeSinceNow / 86400000 > 1 ? Math.floor(timeSinceNow / 86400000) + " days ago"
        : timeSinceNow / 3600000 > 1 ? Math.floor(timeSinceNow / 3600000) + " hours ago"
            : Math.floor(timeSinceNow / 60000) + " minutes ago"
}

function determineGameDuration(time) {
    return time / 3600000 > 1 ? Match.floor(time / 3600000) + 'h ' + Match.floor((time % 3600000) / 60000) + 'm ' +
        Math.floor((time % (1000 * 60)) / 1000) + 's'
        : Math.floor((time % 3600000) / 60000) + 'm ' + Math.floor((time % (1000 * 60)) / 1000) + 's'
}

function determineTeams(props, setMatchData) {
    const currentPlayerInfo = props.match.participants.find(findPlayersTeamSide(props.currentPlayer));
    console.log(props);
    const teams = props.match.participants.reduce((result, participant) => {
        // Set participant as ally or enemy based on their teamId compared to the current player.
        participant.teamId === currentPlayerInfo.teamId
            ? result.playerTeam.push(participant)
            : result.enemyTeam.push(participant);

        return result;
    }, { playerTeam: [], enemyTeam: [] });

    setMatchData((prevData) => ({
        ...prevData,
        currentPlayerName: currentPlayerInfo.riotIdGameName,
        gameMode: props.match.gameMode,
        gameTimeSincePlayed: determineTimeElapsed(props.match.gameEndTimestamp),
        gameDuration: determineGameDuration(props.match.gameEndTimestamp - props.match.gameStartTimestamp),
        championName: currentPlayerInfo.championName,
        championId: currentPlayerInfo.championId,
        kills: currentPlayerInfo.kills, deaths: currentPlayerInfo.deaths, assists: currentPlayerInfo.assists,
        spell1: currentPlayerInfo.summoner1Id,
        spell2: currentPlayerInfo.summoner2Id,
        primaryRune: currentPlayerInfo.perks.styles[0].selections[0].perk,
        secondaryRune: currentPlayerInfo.perks.styles[1].selections[0].perk,
        items: [currentPlayerInfo.item0, currentPlayerInfo.item1, currentPlayerInfo.item2, currentPlayerInfo.item3, currentPlayerInfo.item4
            , currentPlayerInfo.item5],
        win: currentPlayerInfo.win,
        playerTeam: teams.playerTeam,
        enemyTeam: teams.enemyTeam,
    }));
}


function Match(props) {
    console.log(props);
    const [matchData, setMatchData] = useState({
        currentPlayerName: '',
        gameMode: 'Uknown Game Mode',
        playerTeam: [],
        enemyTeam: [],
        championName: '',
        championId: -1,
        win: false,
        kills: 'null', deaths: 'null', assists: 'null',
        spell1: '54',
        spell2: '54',
        items: [0, 0, 0, 0, 0, 0],
        primaryRune: '8005',
        secondaryRune: '8135'
    });

    useEffect(() => {
        determineTeams(props, setMatchData);
    }, [props.match]);

    const { currentPlayerName, gameMode, gameTimeSincePlayed, gameDuration, championName, championId, spell1, spell2, primaryRune,
        secondaryRune, kills, deaths, assists, items, win, playerTeam, enemyTeam } = matchData;
    const winID = win === true ? 'win' : 'lose';

    return (
        <div id={winID} className='match-card'>
            <div className='match-details'>
                <p className='game-mode'>{gameMode}</p>
                <p className='game-time-since-played'>{gameTimeSincePlayed}</p>
                <p id={winID} className='divider'>.</p>
                <p className='victory'>{winID === 'win' ? "Victory" : "Defeat"}</p>
                <p className='game-duration'> {gameDuration}</p>
            </div>
            <div className='player-character-build'>
                <img className='champion-icon' src={require(`../imgs/championIcons/${championId}.png`)} alt="icon is brokie :(" />
                <div className='summoner-spells-runes'>
                    <div className='summoner-spells'>
                        <img className='spell' src={require(`../imgs/summonerSpellIcons/${spell1}.webp`)} alt="icon is brokie :(" />
                        <img className='spell' src={require(`../imgs/summonerSpellIcons/${spell2}.webp`)} alt="icon is brokie :(" />
                    </div>
                    <div className='summoner-runes'>
                        <img className='primary-rune' src={require(`../imgs/runeIcons/Primary/${primaryRune}.png`)} alt="icon is brokie :(" />
                        <img className='secondary-rune' src={require(`../imgs/runeIcons/Secondary/${secondaryRune}.png`)} alt="icon is brokie :(" />
                    </div>
                </div>
                <div className='kda'>
                    <p className='kills'>{kills}</p><p className='kda-divider'>/</p><p className='deaths'>{deaths}</p><p className='kda-divider'>/</p><p className='assists'>{assists}</p>
                </div>
                <div className='items'>
                    <div className='items-top-row'>
                        {items.slice(0, 3).map((item) => {
                            // Return image of each item, or a blank placeholder if item was not built.
                            return item !== 0 ?
                                (<img className='item' src={require(`../imgs/itemIcons/${item}.png`)} alt="icon is brokie :(" />)
                                : (<div id={winID} className='empty-item'></div>)
                        })}
                    </div>
                    <div className='items-bottom-row'>
                        {items.slice(3, 6).map((item) => {
                            // Return image of each item, or a blank placeholder if item was not built.
                            return item !== 0 ?
                                (<img className='item' src={require(`../imgs/itemIcons/${item}.png`)} alt="icon is brokie :(" />)
                                : (<div id={winID} className='empty-item'><p>.</p></div>)
                        })}
                    </div>
                </div>
                <div className='match-players'>
                    <div className='team-mates'>
                        {playerTeam.map((player) => {
                            let currentPlayerId = player.riotIdGameName === currentPlayerName ? 'current-player-name' : 'other-player-name';
                            return (
                                <div className='match-player'>
                                    <img className='match-player-icon' src={require(`../imgs/championIcons/${player.championId}.png`)}></img>
                                    <p id = {currentPlayerId} className='match-player-name'>{player.riotIdGameName.length < 11 ? player.riotIdGameName :
                                        (player.riotIdGameName.substring(0, 7) + "...")}</p>
                                </div>)
                        })}
                    </div>
                    <div className='team-enemies'>
                        {enemyTeam.map((player) => {
                            return (
                                <div className='match-player'>
                                    <img className='match-player-icon' src={require(`../imgs/championIcons/${player.championId}.png`)}></img>
                                    <p id = 'other-player-name' className='match-player-name'>{player.riotIdGameName.length < 11 ? player.riotIdGameName :
                                        (player.riotIdGameName.substring(0, 7) + "...")}</p>
                                </div>)
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Match;