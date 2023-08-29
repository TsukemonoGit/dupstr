import { createSignal ,createEffect} from "solid-js";

export function Counter(){
    const [count,setCount] = createSignal(0);

    const increment=()=>{
        setCount(count()+1);
    }
    createEffect(()=>{
        console.log(count());
    })
    return <div>Current count: {count()}
    <button onClick={increment}>Increment</button></div>
}