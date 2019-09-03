import { settings } from './settings.js';
import App from './components/App.js';



const app = new App(settings.db);
app.init();

