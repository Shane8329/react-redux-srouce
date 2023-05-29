import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

let nextId = 0;
let todos = [{ id: nextId++, text: 'Todo #1' }];
let listeners = [];

 const todosStore = {
  addTodo() {
    todos = [...todos, { id: nextId++, text: 'Todo #' + nextId }]
    emitChange();
  },
   subscribe(listener) {
    console.log('subscribe')
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getSnapshot() {
    return todos;
  }
};

function emitChange() {
  for (let listener of listeners) {
    listener();
  }
}

export default function UseSyncExternalStoreDemo() {
  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);
  useLayoutEffect(() => {
    console.log('useLayoutEffect');
  }, [])

  useEffect(() => {
    console.log('effect');
  },[])
  

  return (
    <>
      <button onClick={() => todosStore.addTodo()}>Add todo</button>
      <hr />
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </>
  );
}


