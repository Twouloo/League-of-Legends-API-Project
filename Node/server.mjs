import express from 'express';
import { config } from 'dotenv'; // npm install dotenv Remove when done
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';
import AWS from "aws-sdk";
const regionTags = { 'OCE': 'oc1', 'NA': 'na1', 'EW': 'euw1', 'EA': 'eun1', 'KR': 'kr', 'JPN': 'jp1', 'BRL': 'br1', 'LAS': 'la2', 'LAN': 'la1', 'RSA': 'ru', 'TRK': 'tr1', 'SG': 'sg2', 'PH': 'ph2', 'TWN': 'tw2', 'VT': 'vn', 'TL': 'th2' };
const regionRouting = {
    'NA': 'AMERICAS', 'BR': 'AMERICAS', 'LAN': 'AMERICAS', 'LAS': 'AMERICAS', 'KR': 'ASIA', 'JP': 'ASIA',
    'EUNE': 'EUROPE', 'EUW': 'EUROPE', 'TR': 'EUROPE', 'RU': 'EUROPE', 'OCE': 'SEA', 'PH2': 'SEA', 'SG2': 'SEA',
    'TH2': 'SEA', 'VN2': 'SEA'
}

config();
const app = express();
const apiKey = process.env.REACT_APP_API_KEY;

// Configure AWS SDK (replace with your own credentials from the AWS console)
// These credentials expire after approx 6 hours, so you will need to refresh them
// It is recommended to put these credentials in an env file and use process.env to retrieve them
// On EC2, you can assign the ec2SSMCab432 IAM role to the instance and the SDK will automatically retrieve the credentials. This will also work from inside a Docker container.
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "ap-southeast-2",
});

// Create an S3 client
const s3 = new AWS.S3();

// Specify the S3 bucket and object key
const bucketName = "tooloo";
const objectKey = "text.json";

// JSON data to be written to S3
const jsonData = {
  count: "0",
};

async function createS3bucket() {

    const params = {
        Bucket: bucketName,
        Key: objectKey,
        Body: JSON.stringify(jsonData), // Convert JSON to string
        ContentType: "application/json", // Set content type
      };
  try {
    await s3.createBucket( { Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
    await s3.putObject(params).promise();
    console.log("JSON file uploaded successfully.");
  } catch(err) {
    if (err.statusCode === 409) {
      console.log(`Bucket already exists: ${bucketName}`);
    } else {
      console.log(`Error creating bucket: ${err}`);
    }
  }
}


// Retrieve the object from S3
async function getObjectFromS3() {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };
  
    try {
      const data = await s3.getObject(params).promise();
      // Parse JSON content
      const parsedData = JSON.parse(data.Body.toString("utf-8"));
      console.log("Parsed JSON data:", parsedData);
      var count = parseInt(parsedData.count);
      count += 1;
  
      return count.toString();
    } catch (err) {
      console.error("Error:", err);
    }
  }

// Upload the JSON data to S3
async function uploadJsonToS3() {
  const currentCount = await getObjectFromS3(); 
  const jsonData = {
    count: currentCount,
  }
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Body: JSON.stringify(jsonData), // Convert JSON to string
    ContentType: "application/json", // Set content type
  };

  try {
    await s3.putObject(params).promise();
    console.log("JSON file uploaded successfully.");
    return currentCount;
  } catch (err) {
    console.error("Error uploading JSON file:", err);
  }
}

// Call the upload and get functions
(async () => {
  await createS3bucket();
})();


app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const getPuuid = async (summonerName, region, apiKey) => {
    console.log()
    const puuidResponse = await fetch(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${apiKey}`);
    if (puuidResponse.status != 200) { console.log("Error - puuid status: " + puuidResponse.status) };
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
            res.send({ status: 200, playername, level, ranksolo, pfpid });

        }
        else if (PlayerResponse.status === 404) {
            res.send({ status: 404 });
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
        const playerResult = result.rows;
        res.send({ success: true, playerResult });
    } catch (error) {
        console.log(error);
        res.send({ success: false, error: 'Failed to retrieve player' });
    }
})


async function getAllParticipants(arr) {
    const participantGameTypeAndCount = {};
    const totalMatches = arr.length;
    const sliceSize = Math.floor(totalMatches / 5); // Divide the total matches into 6 equal parts
    console.log(arr);
    const fetchMatchDatas = async (start, end) => {

        const splitData = await Promise.all(
            arr.slice(start, end).map((match) => getMatchDetails(match, apiKey))
        );
        console.log(splitData.length);
        //console.log(splitData[0].participants.length);
        splitData.map((singleMatch) => {
            singleMatch.participants.map((participant) => {
                var matchDate = new Date(singleMatch.gameCreation);
                //var matchDate = singleMatch.gameCreation;
                if (participantGameTypeAndCount[participant.summonerName]) {
                    participantGameTypeAndCount[participant.summonerName].appearanceCount += 1;
                    participantGameTypeAndCount[participant.summonerName].datesPlayed[matchDate] = [singleMatch.gameMode, participant.teamPosition];
                    participantGameTypeAndCount[participant.summonerName].playedDays[matchDate.getDay()] += 1;
                } else participantGameTypeAndCount[participant.summonerName] = { appearanceCount: 1, datesPlayed: { [matchDate]: [singleMatch.gameMode, participant.teamPosition] }, playedDays: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } };
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

    // Additional match history participants
    //await addDelay(); // Delay before fetching additional participants
    //await fetchMatchDatas(5 * sliceSize, totalMatches);
    //await addDelay();
    return participantGameTypeAndCount;

}

app.post("/api/getRandomUser", async (req, res) => {
    const randomUserData = await fetch(`https://randomuser.me/api/`);
    const randomUserDataJson = await randomUserData.json();
    var region = regionRouting[req.body.region];
    var name = await randomUserDataJson.results[0].location.street.name;

    async function GetRandomName() {

        while (name.length > 16) {
            var getRandomUserAgain = await fetch(`https://randomuser.me/api/`);
            var getRandomUserAgainJson = await getRandomUserAgain.json();
            name = getRandomUserAgainJson.results[0].location.street.name;
        }

        var checkNameAvailable = await fetch(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${apiKey}`)

        while (checkNameAvailable.status === 200 && name.length < 16) {
            name = name + Math.floor((Math.random() * 10));
            checkNameAvailable = await fetch(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${apiKey}`);
        }
        if (checkNameAvailable.status === 200) GetRandomName();
        console.log(name);
        res.send({ name: name });
    }

    GetRandomName();

})

app.get("/api/getCount", async(req, res) => {
    try{
        const count = await uploadJsonToS3();
        console.log(count);
        res.send({count: count});
    } catch(error) {console.log(error)}
});


app.post("/api/getMatchHistory", async (req, res) => {
    try {
        // var puuid = "M99oI3OQcfHE0n5WcQVUf6Kc0W4PjjBG1cKNZiTvg201kG1ckXMKj88P0B9TWW3r1qlFgPusF7nxkQ";
        var numberOfMatches = 30;
        var summonerName = req.body.summonerName;
        var region = req.body.region;
        var regionRoute = regionRouting[region];
        const puuid = await getPuuid(summonerName, regionTags[region], apiKey);

        // Handle errors for getting puuid
        if (puuid.status != 200) {
            if (puuid.status === 503) { res.send({ status: 503, result: {} }); return; };
        }
        const matchHistoryResponse = await fetch(`https://${regionRoute}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid.puuid}/ids?&start=0&count=${numberOfMatches}&api_key=${apiKey}`);
        const matchHistoryData = await matchHistoryResponse.json();
        const matchHistoryParticipants = await getAllParticipants(matchHistoryData);
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

        const matchHistoryParticipantsSorted = heapSort(matchHistoryParticipantsArray).slice(1, 6);

        const publicHolidays = await fetch(`https://date.nager.at/api/v3/publicholidays/2023/AU`);
        const publicHolidaysData = await publicHolidays.json();

        var futureRange = 0;
        while(new Date(publicHolidaysData[futureRange].date) < Date.now()) futureRange += 1;

        // Find highest frequency days played
        for (var i = 0; i < matchHistoryParticipantsSorted.length; i++) {

            matchHistoryParticipants[matchHistoryParticipantsSorted[i]].nextMostHoliday = publicHolidaysData[futureRange];

            var frequentestDay = 0;
            for (var j = 1; j < Object.keys(matchHistoryParticipants[matchHistoryParticipantsSorted[i]].playedDays).length; j++) {
                if (matchHistoryParticipants[matchHistoryParticipantsSorted[i]].playedDays[j] > matchHistoryParticipants[matchHistoryParticipantsSorted[i]].playedDays[frequentestDay]) {
                    frequentestDay = j;
                }
            }
            matchHistoryParticipants[matchHistoryParticipantsSorted[i]].mostPlayedDay = frequentestDay;

            // Create an array to store the differences and their corresponding indices
            var differencesWithIndices = [];
            for (var k = 0; k < publicHolidaysData.length; k++) {
                var difference = Math.abs(new Date(publicHolidaysData[k].date).getDay() - matchHistoryParticipants[matchHistoryParticipantsSorted[i]].mostPlayedDay);
                if(new Date(publicHolidaysData[k].date) > Date.now()) differencesWithIndices.push({ index: k, difference: difference });
            }

            // Sort the array based on the differences
            differencesWithIndices.sort(function (a, b) {
                return a.difference - b.difference;
            });

            var range = 0;
            while(differencesWithIndices[range].difference <= differencesWithIndices[0].difference) range += 1;
            differencesWithIndices.splice(range, differencesWithIndices.length - range);

            /*  Sort dates, uncomment if it is not inherently sorted.
            differencesWithIndices.sort(function(a, b) {
                return a.date - b.date;
            })
            */
            matchHistoryParticipants[matchHistoryParticipantsSorted[i]].bestHoliday = publicHolidaysData[differencesWithIndices[0].index];
        }

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

        res.send({ status: 200, result });

    } catch (error) { console.log(error); res.send({ status: 400 }) }
}
);

app.listen(3001, () => {
    console.log(`Server listening on port 3001`);
});