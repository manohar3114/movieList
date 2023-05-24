const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
let db = null;
const dbPath = path.join(__dirname, "moviesData.db");
app.use(express.json());

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Successfully running the Server");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbServer();

app.get("/movies/", async (request, response) => {
  const moviesList = `
        SELECT
            *
        FROM
            movie
    `;
  const dbList = await db.all(moviesList);
  const convertDbToCamelcase = (dbResponse) => {
    return {
      movieId: dbResponse.movie_id,
      directorId: dbResponse.director_id,
      movieName: dbResponse.movie_name,
      leadActor: dbResponse.lead_actor,
    };
  };
  response.send(dbList.map((each) => convertDbToCamelcase(each)));
});

app.post("/movies/", async (request, response) => {
  const addMovie = request.body;
  const { directorId, movieName, leadActor } = addMovie;
  const addToDb = `
        INSERT INTO
            movie (director_id, movie_name, lead_actor)
        VALUES
            (
                ${directorId},
                "${movieName}",
                "${leadActor}"
            )
    `;
  const dbResponse = await db.run(addToDb);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const dbQuery = `
        SELECT
            *
        FROM
            movie
        WHERE
            movie_id = ${movieId}`;
  const dbMovieList = await db.get(dbQuery);
  const convertDbToCamelcase = (dbResponse) => {
    return {
      movieId: dbResponse.movie_id,
      directorId: dbResponse.director_id,
      movieName: dbResponse.movie_name,
      leadActor: dbResponse.lead_actor,
    };
  };
  response.send(convertDbToCamelcase(dbMovieList));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const replaceMovie = request.body;
  const { directorId, movieName, leadActor } = replaceMovie;
  const dbReplaceMovie = `
        UPDATE
            movie
        SET
            director_id = ${directorId},
            movie_name = "${movieName}",
            lead_actor = "${leadActor}"
        WHERE
            movie_id = ${movieId}
    `;
  const dbResponse = await db.run(dbReplaceMovie);
  response.send("Movie Details Updated");
});

app.delete("movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const dbMovieId = `
        DELETE FROM
            movie
        WHERE
            movie_id = ${movieId}
    `;
  await db.run(dbMovieId);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const directorList = `
        SELECT
            *
        FROM
            director
    `;
  const dbList = await db.all(directorList);
  const convertToCamelCase = (dbResponse) => {
    return {
      directorId: dbResponse.director_id,
      directorName: dbResponse.director_name,
    };
  };
  response.send(dbList.map((each) => convertToCamelCase(each)));
});

app.get("/directors/:directorId/movies", async (request, response) => {
  const { directorId } = request.params;
  const dbQuery = `
        SELECT
            movie.movie_name
        FROM
            director INNER JOIN movie ON director.director_id = movie.director_id
        WHERE director.director_id = ${directorId}
    `;
  const dbResponse = await db.all(dbQuery);
  const converToCamelCase = (db) => {
    return {
      movieName: db.movie_name,
    };
  };
  response.send(dbResponse);
});

module.exports = app;
