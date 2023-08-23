import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import StarRating from "./components/StarRating";
library.add(faCalendar);

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const myApiKey = "5dae1c6";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState("");

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController instance to abort fetch request (Browser Api)

    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        if (searchQuery.length < 3) {
          setMovies([]);
          setIsLoading(false);
          setIsError(false);
          return;
        }
        const res = await fetch(
          `https://www.omdbapi.com/?s=${searchQuery}&apikey=${myApiKey}`,
          {
            signal: controller.signal,
          }
        );
        const data = await res.json();

        if (data.Response === "False") {
          throw new Error("No Results Found");
        }

        setMovies(data.Search);
        setIsLoading(false);
      } catch (err) {
        setIsError(true);
        setIsLoading(false);
        setMovies([]);
      }
    };

    setSelectedMovie("");
    fetchMovies();

    return () => {
      controller.abort();
    }; // Cleanup function to abort fetch request when the component unmount
  }, [searchQuery]);

  // Get Watched movies from the local storage at the first render of the App
  useEffect(() => {
    const savedWatchedMovies = JSON.parse(
      localStorage.getItem("watchedMovies")
    );
    if (savedWatchedMovies) {
      setWatchedMovies(savedWatchedMovies);
    }
  }, []);

  const handleSetWatchedMovies = (movieData) => {
    setWatchedMovies([...watchedMovies, movieData]);
    // Save Watched movies to the local storage
    localStorage.setItem(
      "watchedMovies",
      JSON.stringify([...watchedMovies, movieData])
    );
  };

  const handleRemoveFromWatched = (id) => {
    const newWatchedMovies = watchedMovies.filter((m) => m.imdbID !== id);
    setWatchedMovies(newWatchedMovies);
    // Save new Watched movies to the local storage
    localStorage.setItem(
      "watchedMovies",
      JSON.stringify([...newWatchedMovies])
    );
  };

  const getMovieById = async (id) => {
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?i=${id}&apikey=${myApiKey}`
      );
      const data = await res.json();

      if (data.Response === "False") {
        throw new Error("No Results Found");
      }

      setSelectedMovie(data);
    } catch (err) {}
  };

  return (
    <>
      <Navbar>
        <Logo />
        <SearchInput searchQuery={searchQuery} onSearchQuery={setSearchQuery} />
        <NumberOfResults movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {isLoading ? (
            <Loader />
          ) : isError ? (
            <Error />
          ) : (
            <MoviesList movies={movies} onSelectedMovie={getMovieById} />
          )}
        </Box>
        <Box>
          {selectedMovie ? (
            <MovieDetails
              movieData={selectedMovie}
              onCloseDetails={() => setSelectedMovie("")}
              handleSetWatchedMovies={handleSetWatchedMovies}
              updateWatchedMovies={handleRemoveFromWatched}
              watchedMovies={watchedMovies}
            />
          ) : (
            <WatchedMoviesList
              watchedMovies={watchedMovies}
              updateWatchedMovies={handleRemoveFromWatched}
            />
          )}
        </Box>
      </Main>
    </>
  );
}

function Navbar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <img src="logo.png" alt="popcorn icon" />
      <h1>Popcorn</h1>
    </div>
  );
}

function SearchInput({ searchQuery, onSearchQuery }) {
  const inputEl = useRef(null);

  // focus the search input when the component mounts
  // Handling Enter key press evebt to focus the search input
  useEffect(() => {
    inputEl.current.focus();

    const handleEnter = (e) => {
      if (document.activeElement === inputEl.current) return; // Prevent deleting query when the user is typing in the search input

      if (e.key === "Enter") {
        inputEl.current.focus();
        onSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleEnter);

    return () => {
      window.removeEventListener("keydown", handleEnter);
    };
  }, [onSearchQuery]);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={searchQuery}
      onChange={(e) => onSearchQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumberOfResults({ movies }) {
  const numResults = movies.length;
  return (
    <p className="num-results">
      {numResults === 0 ? (
        <span>🤷‍♂️ No Results Found</span>
      ) : (
        <span>
          Found <strong>{numResults}</strong> results
        </span>
      )}
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "-" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MoviesList({ movies, onSelectedMovie }) {
  return (
    <ul className="list list-movies">
      {movies.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onSelectedMovie={onSelectedMovie}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectedMovie }) {
  return (
    <li onClick={() => onSelectedMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title}-poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>
            <FontAwesomeIcon icon={faCalendar} style={{ color: "#dee2e6" }} />
          </span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedMoviesList({ watchedMovies, updateWatchedMovies }) {
  return (
    <>
      <WatchedSummary watchedMovies={watchedMovies} />
      <ul className="list">
        {watchedMovies.map((movie) => (
          <WatchedMovie
            movie={movie}
            key={movie.imdbID}
            updateWatchedMovies={updateWatchedMovies}
          />
        ))}
      </ul>
    </>
  );
}

function WatchedSummary({ watchedMovies }) {
  // Calculate the average rating of the movies
  const avgImdbRating = Number(
    average(watchedMovies.map((movie) => movie.imdbRating))
  ).toFixed(1);
  const avgUserRating = Number(
    average(watchedMovies.map((movie) => movie.userRating))
  ).toFixed(1);
  const avgRuntime = Number(
    average(watchedMovies.map((movie) => movie.Runtime))
  ).toFixed(0);

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watchedMovies.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovie({ movie, updateWatchedMovies }) {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title}-poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.Runtime} min</span>
        </p>
      </div>
      <button
        className="btn-delete"
        onClick={() => updateWatchedMovies(movie.imdbID)}
      >
        x
      </button>
    </li>
  );
}

function MovieDetails({
  movieData,
  onCloseDetails,
  handleSetWatchedMovies,
  watchedMovies,
  updateWatchedMovies,
}) {
  const [userRating, setUserRating] = useState("");

  // Check if the movie is already in the watched list
  const isAdded = watchedMovies.some((movie) => {
    return movieData.imdbID === movie.imdbID;
  });

  // get user rating from the watched list
  const currentMovie = watchedMovies.find((movie) => {
    return movieData.imdbID === movie.imdbID;
  });

  // Add the movie to the watched list
  const handleAddToWatched = () => {
    const newWatchedMovie = {
      imdbID: movieData.imdbID,
      Title: movieData.Title,
      Year: movieData.Year,
      Poster: movieData.Poster,
      Runtime: Number(movieData.Runtime.replace(" min", "")),
      imdbRating: Number(movieData.imdbRating),
      userRating: userRating,
    };
    handleSetWatchedMovies(newWatchedMovie);
    onCloseDetails();
  };

  // Display Movie Name on the Page Title at the Browser Tab
  useEffect(() => {
    document.title = `${movieData.Title} ${
      userRating && `( Rated ${userRating} 🌟)`
    }`;
    return () => {
      document.title = "Popcorn App"; // Clenup function to reset the page title to the default
    };
  }, [movieData, userRating]);

  // Handling Escape key press event to close the movie details
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onCloseDetails();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onCloseDetails]);

  return (
    <div className="details">
      <button className="btn-back" onClick={onCloseDetails}>
        X
      </button>
      <header>
        <img
          src={`${movieData.Poster}`}
          alt={`${movieData.Title} - poster`}
        ></img>
        <div className="details-overview">
          <h2>{movieData.Title}</h2>
          <p>
            {movieData.Released} &bull; {movieData.Runtime}
          </p>
          <p>{movieData.Genre}</p>
          <p>
            <span>⭐️</span> {movieData.imdbRating} IMDb rating
          </p>
        </div>
      </header>
      <section>
        {isAdded ? (
          <div className="rating">
            <span>
              You already rated this movie with {currentMovie.userRating} 🌟
            </span>
            <button
              className="btn-remove"
              onClick={() => {
                updateWatchedMovies(movieData.imdbID);
                onCloseDetails();
              }}
            >
              Remove From List
            </button>
          </div>
        ) : (
          <div className="rating">
            <StarRating
              maxRating={10}
              color={"#fcc419"}
              onChangeRating={setUserRating}
            />
            {userRating > 0 && (
              <button className="btn-add" onClick={handleAddToWatched}>
                + Add To List
              </button>
            )}
          </div>
        )}

        <p>
          <em>{movieData.Plot}</em>
        </p>
        <p>Starring {movieData.Actors}</p>
        <p>Directed by {movieData.Director}</p>
      </section>
    </div>
  );
}

function Loader() {
  return (
    <div className="loader-wrapper">
      <div className="loader"></div>
    </div>
  );
}

function Error() {
  return (
    <div className="error">
      <span>⚠️</span>
      <p>Somthing Went Wrong, Please Try Again 😁</p>
    </div>
  );
}
