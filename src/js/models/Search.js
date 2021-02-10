import axios from 'axios';
import { url, proxy } from '../config';

// we really can't use fetch because it doesn't work in all browser (older versions) so we use axios so it work in older browsers also

export default class Search {
    constructor(query) {
        this.query = query;
    }

    async getresult() {
        try {
            // const proxy = 'https://cors-anywhere.herokuapp.com/';
            const res = await axios(`${proxy}${url}search?q=${this.query}`);
            this.result = res.data.recipes;
            // console.log(this.result);
        } catch (error) {
            alert(error);
        }
    }
}