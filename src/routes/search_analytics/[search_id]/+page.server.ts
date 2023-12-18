import type { SearchResult } from '$lib/customTypes.js';
import { getSearch } from '$lib/server/services/db.js';
import { error } from '@sveltejs/kit';
import { scoreSearchResults } from '$lib/server/services/productAnalytics.js';


export const load = async ({params}) => {
    const searchId:string|null|undefined = params.search_id

    if(typeof searchId != "string"){
        throw error(404, "Url is broken")
    }

    const search = await getSearch(searchId)
    if(search == null){
        throw error(400, "Could not find the search")
    }

    const searchResults:SearchResult[] = JSON.parse(search.search_results as string)
    let scoredSearchResults = scoreSearchResults(searchResults)
    scoredSearchResults = scoredSearchResults.sort((a,b)=>{return a.qualityPrice-b.qualityPrice}).slice(-10).reverse()

    return {
        scoredSearchResults,
        search_url:search.search_url
    }

};