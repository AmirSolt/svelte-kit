import type { SearchResult } from "../clients/customTypes";


export function scoreSearchResults(searchResults:SearchResult[]):ScoredProduct[]{

    return []
}


function searchResultToProduct(searchResult:SearchResult):Product{
    return {
        title:searchResult.title,
        asin:searchResult.asin,
        link:searchResult.link,
        image:searchResult.image,
        is_prime:searchResult.is_prime,
        rating:searchResult.rating,
        ratings_total:searchResult.ratings_total,
        priceSymbol:searchResult.price.symbol,
        priceValue:searchResult.price.value,
    }
}


