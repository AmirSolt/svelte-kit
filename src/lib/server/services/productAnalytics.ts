import type { Config } from "@prisma/client";
import type { SearchResult, ScoredSearchResult } from "../../customTypes";





interface ChannelsScore {
    quality: number
    rating: number
    ratingTotal: number
    price: number
}


export function scoreSearchResults(config: Config, searchResults: SearchResult[]): ScoredSearchResult[] {

    const ratingWeight = config.rating_weight
    const ratingTotalWeight = config.total_ratings_weight
    const priceWeight = config.price_weight


    const cleanedResults = searchResults.filter(sr => {
        return sr.rating != null && sr.ratings_total != null && sr.price != null && sr.price.value != null;
    });

    const { std: ratingSTD, mean: ratingMean } = getStdMean(cleanedResults.map(sr => sr.rating!));
    const { std: ratingTotalSTD, mean: ratingTotalMean } = getStdMean(cleanedResults.map(sr => sr.ratings_total!));
    const { std: priceSTD, mean: priceMean } = getStdMean(cleanedResults.map(sr => sr.price!.value));


    const scores: ChannelsScore[] = cleanedResults.map(sr => {
        const ratingScore = zScore(ratingSTD, ratingMean, sr.rating ?? -1) * ratingWeight
        const ratingTotalScore = sigmoid(zScore(ratingTotalSTD, ratingTotalMean, sr.ratings_total ?? -1)) * ratingTotalWeight
        const priceScore = zScore(priceSTD, priceMean, sr.price.value) * priceWeight
        
        return {
            quality: ratingScore + ratingTotalScore + priceScore,
            rating: ratingScore,
            ratingTotal: ratingTotalScore,
            price: priceScore,
        }
    })

    const maxQualityScore = Math.max(...scores.map(s=>s.quality))
    const minQualityScore = Math.min(...scores.map(s=>s.quality))

    const maxPriceScore = Math.max(...scores.map(s=>s.price))
    const minPriceScore = Math.min(...scores.map(s=>s.price))

    let scoredSearchResults = cleanedResults.map((sr, i) => {
        const qualityScoreNormalized = (scores[i].quality - minQualityScore) / (maxQualityScore - minQualityScore)
        const priceScoreNormalized = (scores[i].price - minPriceScore) / (maxPriceScore - minPriceScore)

        return {
            searchResult: sr,
            quality: qualityScoreNormalized,
            value: qualityScoreNormalized / (priceScoreNormalized + 1)
        }
    })

    // const smallestScore = Math.min(...scoredSearchResults.map(r=>r.quality))
    // scoredSearchResults.forEach(r=>{
    //     r.quality += (x - min) / (max - min)
    //     r.qualityPrice = (r.quality/r.searchResult.price.value)
    // })

    return scoredSearchResults

}




function getStdMean(lst: number[]) {
    const mean = lst.reduce((a, b) => a + b, 0) / lst.length;
    const variance = lst.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (lst.length - 1);
    const std = Math.sqrt(variance);
    return { std, mean }
}


function zScore(std: number, mean: number, elementValue: number): number {
    return (elementValue - mean) / std;
}

function sigmoid(z: number): number {
    const c0 = 0
    const c1 = 4
    return 1 / (1 + Math.exp(-(c0+(c1*z))));
}

