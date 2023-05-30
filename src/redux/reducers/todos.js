import { ADD_TODO, TOGGLE_TODO } from "../actionTypes";

const initialState = {
  allIds: [0],
  byIds: {
    0: {
      content: "222",
      completed: false,
    },
  },
  // allIds: [],
  // byIds: {},
  test: 'test'
};

export default function (state = initialState, action) {
  switch (action.type) {
    case ADD_TODO: {
      const { id, content } = action.payload;
      const temp = {
        ...state,
        allIds: [...state.allIds, id],
        byIds: {
          ...state.byIds,
          [id]: {
            content,
            completed: false,
          },
        },
      };
      return temp;
    }
    case TOGGLE_TODO: {
      const { id } = action.payload;
      return {
        ...state,
        byIds: {
          ...state.byIds,
          [id]: {
            ...state.byIds[id],
            completed: !state.byIds[id].completed,
          },
        },
      };
    }
    default:
      return state;
  }
}
