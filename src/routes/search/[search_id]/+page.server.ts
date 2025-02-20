import { getSearch } from '$lib/server/services/db.js';
import { error } from '@sveltejs/kit';
import { updateProductStats } from '$lib/server/services/productAnalytics.js';
import type { Config } from '@prisma/client';


export const load = async ({params, locals}) => {
    const searchId:string|null|undefined = params.search_id
    const config:Config = locals.config

    if(typeof searchId != "string"){
        throw error(404, "Url is broken")
    }

    const search = await getSearch(searchId)
    if(search == null){
        throw error(400, "Could not find the search")
    }

    let products:Product[] = JSON.parse(search.search_results as string)

    products = products.slice(0, config.top_products_count+10)
    updateProductStats(config, products)

    return {
        products,
        search_url:search.search_url,
        topProductsCount:config.top_products_count,
    }

};