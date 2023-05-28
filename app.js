const express = require("express");
const app = express();
module.exports = app;
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000/....");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//GET ALL
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details
    ORDER BY player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//GET INDIVIDUAL
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//PUT
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName, jerseyNumber, role } = request.body;
  const playerUpdateQuery = `UPDATE player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_Id = ${playerId};`;
  const player = await db.run(playerUpdateQuery);
  response.send("Player Details Updated");
});

//GET INDIVIDUAL
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject(match));
});

//GET ALL FROM TWO TABLES
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT match_details.match_id, match_details.match, match_details.year
     FROM match_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId};`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//GET ALL FROM TWO TABLES
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const getMatchQueryResponse = await db.get(getMatchPlayersQuery);
  response.send(getMatchQueryResponse);
});

//GET ALL FROM TWO TABLES
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(player_match_score.score) AS totalScore,
            SUM(player_match_score.fours) AS totalFours,
            SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score ON
    player_match_score.player_id = player_details.player_id
    WHERE player_details.player_id = ${playerId};`;
  const playersArray = await db.get(getPlayersQuery);
  response.send(playersArray);
});
