# League-of-Legends-API-Project

This project aims to provide deep analysis and statistics on a player specilizing on duos and party play. Utilies League of Legends API provided by riot games: https://developer.riotgames.com/

Deployed via:
* The back-end node server and Docker image deployed on an EC2 instance.
* React front-end source code hosted on an S3.
  * Match history of the player
  * Most played with friends of the player.
  * Days in which they played
  * Hours of a day played for a specific date

![image](https://github.com/Twouloo/League-of-Legends-API-Project/assets/150364814/010c98b0-6719-4661-baed-25875613a228)

**After Searching:**

![image](https://github.com/Twouloo/League-of-Legends-API-Project/assets/150364814/71b53609-e395-4236-abcc-14c3edb7d1c6)

The project currently uses Developer API keys (Rate limited). Some constraints are enforced such as forced rate limiting within the server when fetching data:
```
 const sliceSize = Math.floor(totalMatches / 5); // Divide the total matches into 6 equal parts
```
```
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
```
