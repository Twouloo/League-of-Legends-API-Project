import '../stylings/App.css'
import rengarUlt from '../imgs/rengarUlt.webp';
import SearchBar from '../components/SearchBar';

function App() {
  return (
    <div className="App">
    <div className="nav">
    <span id="login">Login</span>
    <span id="divider">|</span>
    <span id="signup">Sign Up</span>
    </div>
      <div className="container">
      <h1 id="title">Predator</h1>
        <div className="image-container">
          <img id="rengarBG" src={rengarUlt} alt="Rengar is  brokie :(" />
        </div>
        <div className="search-container">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}

export default App;
