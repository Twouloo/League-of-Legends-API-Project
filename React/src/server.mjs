import express from 'express';
import { config } from 'dotenv';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';
import pkg from 'pg';

const allowedRegions = ['Oceania', 'North America', 'Europe West', 'Europe Nordic & East', 'Korea', 'Japan',
    'Brazil', 'LAS', 'LAN', 'Russia', 'Turkiye', 'Singapore', 'Philippines', 'Taiwan', 'Vietnam', 'Thailand'];

const regionTags = { 'OCE': 'oc1', 'NA': 'na1', 'EW': 'euw1', 'EA': 'eun1', 'KR': 'kr', 'JPN': 'jp1', 'BRL': 'br1', 'LAS': 'la2', 'LAN': 'la1', 'RSA': 'ru', 'TRK': 'tr1', 'SG': 'sg2', 'PH': 'ph2', 'TWN': 'tw2', 'VT': 'vn', 'TL': 'th2' };
const regionRouting = {
    'NA': 'AMERICAS', 'BR': 'AMERICAS', 'LAN': 'AMERICAS', 'LAS': 'AMERICAS', 'KR': 'ASIA', 'JP': 'ASIA',
    'EUNE': 'EUROPE', 'EUW': 'EUROPE', 'TR': 'EUROPE', 'RU': 'EUROPE', 'OCE': 'SEA', 'PH2': 'SEA', 'SG2': 'SEA',
    'TH2': 'SEA', 'VN2': 'SEA'
}

const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Players',
    password: 'TuLe9817',
    port: '3002',
});

config();
const app = express();
const apiKey = process.env.REACT_APP_API_KEY;


app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const getPuuid = async (summonerName, region, apiKey) => {
    const puuidResponse = await fetch(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${apiKey}`);
    if (puuidResponse.status != 200) { console.log("Error - puuid status: " + puuidResponse.status)};
    const puuidData = await puuidResponse.json();
    return {
        puuid: puuidData.puuid,
        status: puuidResponse.status
    };
}

const getMatchDetails = async (matchID, apiKey) => {
    const participantsReponse = await fetch(`https://sea.api.riotgames.com/lol/match/v5/matches/${matchID}?api_key=${apiKey}`);
    if (participantsReponse.status != 200) { console.log("Error - Participants status: " + participantsReponse.status); };
    const participantsData = await participantsReponse.json();
    return participantsData.info;
}

const getRecentPlayerInfo = async (playerName, region) => {
    const recentPlayerResponse = await fetch("http://localhost:3001/api/getPlayer", {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ summonerName: playerName, region })
    });
    const recentPlayerResponseData = await recentPlayerResponse.json();
    return recentPlayerResponseData;
}

app.post('/api/getRecommendedUsers', async (req, res) => {
    try {
        var player = req.body.player;
        var region = req.body.region;
        console.log(req.body);
        if (!Object.keys(regionTags).includes(region)) {
            res.send({ success: false, error: 'Invalid region' })
            return;
        }
        const query = `SELECT * FROM ${region} WHERE playername ILIKE '%${player}%' ORDER BY CASE 
                        WHEN playername = '${player}' THEN 1
                        WHEN playername ILIKE '${player}%' THEN 2
                        WHEN playername ILIKE '%${player}' THEN 3
                        END
                        LIMIT 3`;

        const result = await pool.query(query);
        const players = result.rows;
        res.send({ success: true, players });
    } catch (error) {
        console.log(error);
        res.send({ success: false, error: 'Failed to retrieve players' });
    }
});

app.get('/api/insertplayer', async (req, res) => {
    try {
        //const { playername, rank, pfpid } = req.body;
        const playername = "Plz Hab Mercy"; const rank = "Platinum IV - 33 LP"; const pfpid = "1";
        const query = 'INSERT INTO OCEANIA (playername, rank, pfpid) VALUES ($1, $2, $3)';
        await pool.query(query, [playername, rank, pfpid]);
        res.send({ success: true, message: 'Player inserted successfully' });
    } catch (error) {
        console.log(error);
        res.send({ success: false, error: 'Failed to insert player' });
    }
});


app.post("/api/getPlayer", async (req, res) => {
    try {
        var summonerName = req.body.summonerName;
        var region = req.body.region;
        const PlayerResponse = await fetch(`https://${regionTags[region]}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${apiKey}`);
        const PlayerData = await PlayerResponse.json();
        if (PlayerResponse.status === 200) {
            const PlayerRankedResponse = await fetch(`https://${regionTags[region]}.api.riotgames.com/lol/league/v4/entries/by-summoner/${PlayerData.id}?api_key=${apiKey}`);
            const PlayerRankedData = await PlayerRankedResponse.json();

            const playername = PlayerData.name;
            const level = "Level " + String(PlayerData.summonerLevel);
            const pfpid = String(PlayerData.profileIconId);
            var rank = null;
            var ranksolo = null;
            var rankflex = null;
            var ranktft = null;
            var rankcherry = null;

            if (Object.keys(PlayerRankedData).length != 0) {
                PlayerRankedData.map((gameMode) => {
                    if (gameMode.queueType == "RANKED_SOLO_5x5") {
                        rank = gameMode.tier.charAt(0) + gameMode.tier.slice(1).toLowerCase() + " " + gameMode.rank + " - " + gameMode.leaguePoints + "LP";
                        ranksolo = gameMode.tier.charAt(0) + gameMode.tier.slice(1).toLowerCase() + " " + gameMode.rank + " - " + gameMode.leaguePoints + "LP";
                    }
                    else if (gameMode.queueType == "RANKED_FLEX_SR") {
                        rankflex = gameMode.tier.charAt(0) + gameMode.tier.slice(1).toLowerCase() + " " + gameMode.rank + " - " + gameMode.leaguePoints + "LP";
                    }
                    else if (gameMode.queueType == "RANKED_FLEX_SR") {
                        ranktft = gameMode.tier.charAt(0) + gameMode.tier.slice(1).toLowerCase() + " " + gameMode.rank + " - " + gameMode.leaguePoints + "LP";
                    }
                    else if (gameMode.queueType == "CHERRY") {
                        //rankcherry = gameMode.tier.charAt(0) + gameMode.tier.slice(1).toLowerCase() + " " + gameMode.rank + " - " + gameMode.leaguePoints + "LP";
                    }
                    console.log(gameMode.queueType);
                });
            }

            const query = `INSERT INTO ${region} (playername, rank, pfpid, ranksolo, rankflex, ranktft, rankcherry, level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                               ON CONFLICT (playername) DO UPDATE SET playername = EXCLUDED.playername, rank = EXCLUDED.rank, pfpid = EXCLUDED.pfpid, ranksolo = EXCLUDED.ranksolo
                                , rankflex = EXCLUDED.rankflex, ranktft = EXCLUDED.ranktft, level = EXCLUDED.level`;

            res.send({ status: 200, playername, level, ranksolo, pfpid });
            await pool.query(query, [playername, rank, pfpid, ranksolo, rankflex, ranktft, rankcherry, level]);
       
        }
        else if (PlayerResponse.status === 404) {
            res.send({ status: 404 });
            try {
                await pool.query(`DELETE FROM ${region} WHERE playername = ${summonerName}`)
            } catch { }
        }
        else res.send({ status: PlayerResponse.status });
    } catch (error) {
        console.log(error);
        res.send({ status: PlayerResponse.status });
    }
});

app.post("api/getRecentPlayer", async (req, res) => {
    try {
        var player = req.body.player;
        var region = req.body.region;
        console.log(req.body);
        if (!Object.keys(regionTags).includes(region)) {
            res.send({ success: false, error: 'Invalid region' })
            return;
        }
        const query = `SELECT * FROM ${region} WHERE playername LIKE '%${player}%' `;
        const result = await pool.query(query);
        const playerResult = result.rows;
        res.send({ success: true, playerResult });
    } catch (error) {
        console.log(error);
        res.send({ success: false, error: 'Failed to retrieve player' });
    }
})

app.post("/api/getMatchHistory", async (req, res) => {
    try {
        //var puuid = "M99oI3OQcfHE0n5WcQVUf6Kc0W4PjjBG1cKNZiTvg201kG1ckXMKj88P0B9TWW3r1qlFgPusF7nxkQ";
        var numberOfMatches = 10;
        var summonerName = req.body.summonerName;
        var region = req.body.region;
        var regionRoute = regionRouting[region];
        const puuid = await getPuuid(summonerName, regionTags[region], apiKey);

        // Handle errors for getting puuid
        if(puuid.status != 200)
        {
            if(puuid.status === 503) { res.send({status: 503, result: {}}); return; };
        }
        const matchHistoryResponse = await fetch(`https://${regionRoute}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid.puuid}/ids?&start=0&count=${numberOfMatches}&api_key=${apiKey}`);
        const matchHistoryData = await matchHistoryResponse.json();

        const participantGameTypeAndCount = {};
        const allGames = [];
        const totalMatches = matchHistoryData.length;
        const sliceSize = Math.floor(totalMatches / 5); // Divide the total matches into 6 equal parts
        console.log(matchHistoryData);
        const fetchMatchDatas = async (start, end) => {
            
            const splitData = await Promise.all(
                matchHistoryData.slice(start, end).map((match) => getMatchDetails(match, apiKey))
            );
            console.log(splitData.length);
            //console.log(splitData[0].participants.length);
            splitData.map((singleMatch) => {
                allGames.push(singleMatch);
                singleMatch.participants.map((participant) => {
                    var matchDate = new Date(singleMatch.gameCreation);
                    //var matchDate = singleMatch.gameCreation;
                    if (participantGameTypeAndCount[participant.summonerName]) {
                        participantGameTypeAndCount[participant.summonerName].appearanceCount += 1;
                        participantGameTypeAndCount[participant.summonerName].datesPlayed[matchDate] = [singleMatch.gameMode, participant.teamPosition];
                    } else participantGameTypeAndCount[participant.summonerName] = { appearanceCount: 1, datesPlayed: { [matchDate]: [singleMatch.gameMode, participant.teamPosition] } };
                })
            })
    
        };
        const addDelay = () => {
            return new Promise((resolve) => {
                setTimeout(resolve, 150); // Delay in milliseconds
            });
        };
    
        for (let i = 0; i < 5; i++) {
            const start = i * sliceSize;
            const end = (i + 1) * sliceSize;
    
            await addDelay(); // Delay before fetching participants
            await fetchMatchDatas(start, end);
        }
    
        const matchHistoryParticipants = participantGameTypeAndCount;
        const matchHistoryParticipantsArray = Object.keys(matchHistoryParticipants);

        function heapSort(arr) {
            // Build the max heap
            buildMaxHeap(arr);

            // Extract the maximum element from the heap one by one
            for (let i = arr.length - 1; i > 0; i--) {
                // Move current root (maximum element) to the end
                swap(arr, 0, i);

                // Call max heapify on the reduced heap
                heapify(arr, i, 0);
            }

            return arr;
        }

        function buildMaxHeap(arr) {
            // Index of the last non-leaf node
            const startIdx = Math.floor(arr.length / 2) - 1;

            // Perform max heapify from the last non-leaf node up to the root
            for (let i = startIdx; i >= 0; i--) {
                heapify(arr, arr.length, i);
            }
        }

        function heapify(arr, size, rootIdx,) {
            let largest = rootIdx; // Initialize the largest as the root
            const leftChildIdx = 2 * rootIdx + 1;
            const rightChildIdx = 2 * rootIdx + 2;

            // If the left child is less than the root
            if (leftChildIdx < size && matchHistoryParticipants[arr[leftChildIdx]].appearanceCount < matchHistoryParticipants[arr[largest]].appearanceCount) {
                largest = leftChildIdx;
            }

            // If the right child is less than the largest so far
            if (rightChildIdx < size && matchHistoryParticipants[arr[rightChildIdx]].appearanceCount < matchHistoryParticipants[arr[largest]].appearanceCount) {
                largest = rightChildIdx;
            }

            // If the largest is not the root, swap it with the largest child
            if (largest !== rootIdx) {
                swap(arr, rootIdx, largest);

                // Recursively heapify the affected sub-tree
                heapify(arr, size, largest);
            }
        }

        function swap(arr, i, j) {
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }

        const matchHistoryParticipantsSortedAll = heapSort(matchHistoryParticipantsArray);
        const matchHistoryParticipantsSorted = matchHistoryParticipantsSortedAll.slice(1, 11); // Top 10 players exlcuding chosen suer
        const currentPlayer = matchHistoryParticipants[matchHistoryParticipantsSortedAll[0]]; // Chosen user info
        const constPlayerData = async () => {
            let result = {}
            await Promise.all(
                matchHistoryParticipantsSorted.map(async (player) => {
                    let PlayerData = await getRecentPlayerInfo(player, region);
                    result[player] = [matchHistoryParticipants[player], PlayerData];
                }))
            return result;
        }

        const result = await constPlayerData();
        allGames.sort((a,b) => a.gameCreation - b.gameCreation);
        console.log(result);
        res.send({ status: 200, result, currentPlayer, allGames});

    } catch (error) { console.log(error); res.send({ status: 400 }) }
}
);

app.listen(3001, () => {
    console.log(`Server listening on port 3001`);
});