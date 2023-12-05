import '../stylings/RecentUsers.css';
import { useState, useEffect } from 'react';

function RecentUser(props) {
    const [region, setRegion] = useState('OCE');
    const [pfp, setPfp] = useState('');
    const [currentPlayerName, setCurrentPlayerName] = useState('');
    const [currentPlayerRank, setCurrentPlayerRank] = useState('');
    const [currentPlayerLevel, setCurrentPlayerLevel] = useState('');
    const playerName = props.playerInfo[0];
    const playerPfpID = props.playerInfo[1][1].pfpid;
    const playerApperanceCount = props.playerInfo[1][0].appearanceCount;

    return (
        <ul className="recent-player">
            <div className="recent-info-container">
            <img className="recent-pfp" src={require(`../imgs/profileIcons/${playerPfpID}.webp`)} alt="pfp is brokie :(" />
            <div className="recent-info">
            <li className="recent-icon-name">{playerName}</li>
            <li className="recent-icon-apperance">Games played: {playerApperanceCount}</li>
            </div>
            </div>
        </ul>
    );
}

export default RecentUser;