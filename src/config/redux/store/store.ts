"use client"

import { configureStore } from '@reduxjs/toolkit';
import tokenReducer from '../reducers/tokenSlice';
import userReducer from "../reducers/userSlice";

const store = configureStore({
    reducer: {
        token: tokenReducer,
        user: userReducer,
    },
});

export default store;