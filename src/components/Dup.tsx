import { For, Show, createSignal } from "solid-js";
import { nip19, relayInit, type Event } from 'nostr-tools'
import { createRxNostr } from "rx-nostr";

export function Dup() {
    const iniEvent: Event = { kind: 1, tags: [], content: "", created_at: 0, pubkey: "", id: "", sig: "" };
    const [noteId, setNoteId] = createSignal("");
    const [relayFrom, setRelayFrom] = createSignal("");
    const [relayTo, setRelayTo] = createSignal("");
    const [event, setEvent] = createSignal(iniEvent);

    const [debugLogs,setDebugLogs]=createSignal<string[]>([]);

    const addDebugLog = (log: string) => {
        setDebugLogs(logs => [...logs, log]);
    };
    const clearDebugLogs = () => {
        setDebugLogs([]);
    };
    const checkNoteId = (id: string) => {
        if (id.startsWith('nostr:')) {
            id = id.slice(6);
        }
        if (id.startsWith('note1')) {
            try {
                return nip19.decode(id).data;

            } catch (error) {
                throw error;
            }
        } else if (id.startsWith('nevent')) {
            return nip19.decode(id).data.id;
        } else {
            return id;
        }
    }
    let  id:string; 
    const getNote = async () => {
        clearDebugLogs();
        id = checkNoteId(noteId());
        addDebugLog(`ID: ${id}`);
        try {
            const relay = relayInit(relayFrom());
            relay.on('connect', () => {
                addDebugLog(`Connected to ${relay.url}`);
            });
            relay.on('error', () => {
                addDebugLog(`Failed to connect to ${relay.url}`);
            });

            await relay.connect();

            let event: Event | null = await relay.get({
                ids: [id]
            });
            if (event) {
                setEvent(event);
                addDebugLog(`Event: ${JSON.stringify(event,null,2)}`);
            }else{
                addDebugLog(`イベントの取得に失敗しました`);
            }

            relay.close();
        } catch (error) {
            console.log(error);
        }
    }

    const dupNote = async () => {
        let isSuccess:boolean=false;
        const rxNostr = createRxNostr();
        rxNostr.createConnectionStateObservable().subscribe((ev) => {
            addDebugLog(`${ev.from}: ${ev.state}`);
            console.log(ev.state, ev.from);
            if(ev.state==="ongoing"){
                rxNostr
                .send(event())
                .subscribe({
                  next: ({ from }) => {
                      isSuccess=true;
                      addDebugLog(`"OK", ${from}`);
                    console.log("OK", from);
                  },
                  complete: () => {
                      if(!isSuccess){
                      addDebugLog("failed to Duplicate");}
                    console.log("Send completed");
                  },
                });
            }
          });
        await rxNostr.switchRelays([
           relayTo()
          ]);
          console.log(relayTo());
          console.log(event());
         
        // try {
        //     const relay = relayInit(relayTo());
        //     relay.on('connect', () => {
        //         addDebugLog(`Connected to ${relay.url}`);
        //     });
        //     relay.on('error', () => {
        //         addDebugLog(`Failed to connect to ${relay.url}`);
        //     });

        //     await relay.connect();
            
        //     try{
        //         await relay.publish(event());
        //         addDebugLog(`多分成功した`);
        //         let events: Event | null = await relay.get({
        //             ids: [id]
        //         });
        //         if (events) {
        //             setEvent(events);
        //             addDebugLog(`Event: ${JSON.stringify(events,null,2)}`);
        //         }else{
        //             addDebugLog(`失敗してたかも`);
        //         }
        //         relay.close();
        //     }catch(error){
        //         addDebugLog(`失敗しました`);
        //         console.log(error);
        //     }
           
        // } catch (error) {
        //     console.log(error);
        // }
    }

    return (
        <>
            <div>
                <label for="noteId">NoteID</label>
                <input type="text" id="noteId" placeholder="note..." value={noteId()} onInput={(e) => {
                    setNoteId(e.currentTarget.value);
                }} />
            </div>
            <div>
                <label for="from">RelayURL from</label>
                <input type="text" id="from" placeholder="wss://..." value={relayFrom()} onInput={(e) => {
                    setRelayFrom(e.currentTarget.value);
                }} />
                <button type="button" onClick={getNote}>Get note</button>
            </div>
            <div>
                <label for="to">RelayURL to</label>
                <input type="text" id="to" placeholder="wss://..." value={relayTo()} onInput={(e) => {
                    setRelayTo(e.currentTarget.value);
                }} />
                <button type="button" onClick={dupNote}>Duplicate note</button>
            </div>
            {/* <Show 
            when={event().sig!==""}
            fallback={
                <></>
            }
            >
                <pre>{JSON.stringify(event(), null, 2)}</pre>
            </Show> */}
            <For each={debugLogs()}>
                {(log)=>{
                    return(
                        <li>
                            <pre>{log}</pre>
                        </li>
                    )
                }}
                </For>
        </>
    );
}