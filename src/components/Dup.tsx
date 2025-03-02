import { For, Show, createSignal } from "solid-js";
import { nip19, Relay, type Event } from "nostr-tools";

import "./Dup.css";

export function Dup() {
  const iniEvent: Event = {
    kind: 1,
    tags: [],
    content: "",
    created_at: 0,
    pubkey: "",
    id: "",
    sig: "",
  };
  const [noteId, setNoteId] = createSignal("");
  const [relayFrom, setRelayFrom] = createSignal("");
  const [relayTo, setRelayTo] = createSignal("");
  const [event, setEvent] = createSignal(iniEvent);

  const [debugLogs, setDebugLogs] = createSignal<string[]>([]);

  // 現在のURLのクエリ文字列を取得
  const queryString = window.location.search;
  // クエリ文字列から?を除去してパラメータ部分を取得
  const queryParamsString = queryString.slice(1);
  // クエリ文字列をパースしてオブジェクトに変換
  const queryParams: { [x: string]: string } = {};
  queryParamsString.split("&").forEach((param) => {
    const [key, value] = param.split("=");
    queryParams[key] = decodeURIComponent(value);
  });
  console.log(queryString);
  const initialNoteId = queryParams["noteID"] || "";
  const initialFrom = queryParams["from"] || "";
  const initialTo = queryParams["to"] || "";
  setNoteId(initialNoteId);
  setRelayFrom(initialFrom);
  setRelayTo(initialTo);

  const addDebugLog = (log: string) => {
    setDebugLogs((logs) => [...logs, log]);
  };
  const clearDebugLogs = () => {
    setDebugLogs([]);
  };
  const checkNoteId = (id: string) => {
    if (id.length < 10) {
      addDebugLog(`noteIDを確認してください`);
      return "";
    }
    if (id.startsWith("nostr:")) {
      id = id.slice(6);
    }
    if (id.startsWith("note1")) {
      try {
        return nip19.decode(id).data as string;
      } catch (error) {
        return "";
      }
    } else if (id.startsWith("nevent")) {
      const data = nip19.decode(id).data as nip19.EventPointer;
      return data.id;
    } else {
      return id;
    }
  };

  const timeoutDuration = 10000;
  let id: string = "";

  const getNote = async () => {
    setEvent(iniEvent);
    if (noteId() === "") {
      addDebugLog("noteIDを入力してください");
      return;
    }
    if (relayFrom() === "") {
      addDebugLog("relayURLを入力してください");
      return;
    }
    clearDebugLogs();
    id = checkNoteId(noteId());
    addDebugLog(`ID: ${id}`);
    if (id === "") {
      addDebugLog("noteIDを入力してください");
      return;
    }
    try {

      const relay = await Relay.connect(relayFrom())
      addDebugLog(`Connecting...`);

      const sub = relay.subscribe([
        {
          ids: [id],
        },
      ], {
        onevent(event) {
          console.log('we got the event we wanted:', event)
          setEvent(event);
          addDebugLog(`Event: ${JSON.stringify(event, null, 2)}`);

        },
        oneose() {
          addDebugLog(`end of stored events`);
          sub.close()
        },
      })


      // // タイムアウト用の処理
      // const connectTimeoutHandler = setTimeout(() => {
      //   addDebugLog(`接続がタイムアウトしました`);
      //   relay.close(); // タイムアウトした場合は接続を閉じる
      // }, timeoutDuration);

      // relay.on("connect", () => {
      //   clearTimeout(connectTimeoutHandler); // 接続完了したらタイムアウト処理をクリア
      //   addDebugLog(`Connected to ${relay.url}`);
      // });
      // relay.on("error", () => {
      //   clearTimeout(connectTimeoutHandler); // タイムアウトクリア
      //   addDebugLog(`Failed to connect to ${relay.url}`);
      // });

      // await relay.connect();

      // let event: Event | null = await relay.get({
      //   ids: [id],
      // });
      // if (event) {
      //   setEvent(event);
      //   addDebugLog(`Event: ${JSON.stringify(event, null, 2)}`);
      // } else {
      //   addDebugLog(`イベントの取得に失敗しました`);
      // }

      // relay.close();
    } catch (error) {
      console.log(error);
    }
  };

  const dupNote = async () => {
    if (event().sig === "") {
      addDebugLog(
        `Get noteを押してイベントを取得してからからDuplicate noteをクリックしてください`
      );
      return;
    }
    if (relayTo() === "") {
      addDebugLog("relayURLを入力してください");
      return;
    }
    addDebugLog(`Connecting...`);
    const ws = new WebSocket(relayTo());

    // タイムアウト用の処理
    const timeoutHandler = setTimeout(() => {
      addDebugLog(`接続がタイムアウトしました`);
      ws.close(); // タイムアウトした場合は接続を閉じる
    }, timeoutDuration);

    ws.onopen = () => {
      clearTimeout(timeoutHandler); // 接続完了したらタイムアウト処理をクリア
      addDebugLog(`Connected to ${relayTo()}`);

      ws.send(JSON.stringify(["EVENT", event()]));
    };
    ws.onerror = () => {
      clearTimeout(timeoutHandler); // タイムアウトクリア
      addDebugLog(`Failed to connect to ${relayTo()}`);
    };

    ws.onmessage = (e) => {
      console.log(e);
      const msg = JSON.parse(e.data);

      addDebugLog(`relay message: ${e.data}`);
      if (msg[2]) {
        addDebugLog("成功しました");
      } else {
        addDebugLog("失敗しました");
      }
      ws.close();
    };
  };

  return (
    <>
      <h3>Duplicate(Broadcasts) a note from relay to relay</h3>
      <div style="padding:1em">
        <div>
          <label for="noteId">NoteID</label>
          <input
            type="text"
            style="width:20rem"
            id="noteId"
            placeholder="hexID or note... or nevent..."
            value={noteId()}
            onInput={(e) => {
              setNoteId(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label for="from">RelayURL from</label>
          <input
            type="text"
            id="from"
            placeholder="wss://..."
            value={relayFrom()}
            onInput={(e) => {
              setRelayFrom(e.currentTarget.value);
            }}
          />
          <button type="button" onClick={getNote}>
            Get note
          </button>
        </div>
        <div>
          <label for="to">RelayURL to</label>
          <input
            type="text"
            id="to"
            placeholder="wss://..."
            value={relayTo()}
            onInput={(e) => {
              setRelayTo(e.currentTarget.value);
            }}
          />
          <button type="button" onClick={dupNote}>
            Duplicate
          </button>
        </div>

        <For each={debugLogs()}>
          {(log) => {
            return (
              <ul style="margin-left: -1em;">
                <li>
                  <pre id="log">{log}</pre>
                </li>
              </ul>
            );
          }}
        </For>
      </div>
    </>
  );
}
