import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "https://final-hackathon-server.vercel.app";

export default axios;