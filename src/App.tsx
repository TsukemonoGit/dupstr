
import { Dup } from "./components/Dup"
import "./App.css"

function App() {
  return (
    <>
      <h1>Nostr Note Duplicater</h1>
      <Dup />
      <hr color="#cccccc" />
      <footer>
        
        github:<a href="https://github.com/TsukemonoGit/dupstr" target="_blank" rel="noopener noreferrer" >TsukemonoGit/dupstr</a><br/>
        Author:<a
          href="https://nostr.com/npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
          target="_blank"
          rel="noopener noreferrer"
        >mono(Nostr)</a
        >
      </footer>
    </>
  );
}

export default App;
