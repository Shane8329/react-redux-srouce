import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import VisibilityFilters from "./components/VisibilityFilters";
import "./styles.css";

export default function TodoApp() {
  const A = TodoList
  return (
    <div style={{width:"800px",margin:"120px auto"}}>
      <h1>Todo List</h1>
      <AddTodo currentCompName='AddTodo' />
      <VisibilityFilters currentCompName='VisibilityFilters' />
      <TodoList currentCompName='TodoList'/>
    </div>
  );
}
