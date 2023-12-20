import type { Config } from "@prisma/client";
import type { SearchResult, ScoredSearchResult } from "../../customTypes";





interface ChannelsScore {
    qualityScore: number
    ratingScore: number
    ratingTotalScore: number
    priceScore: number
    priceZScore: number
}


export function scoreSearchResults(config: Config, searchResults: SearchResult[]): ScoredSearchResult[] {

    const ratingWeight = config.rating_weight
    const ratingTotalWeight = config.total_ratings_weight
    const priceWeight = config.price_weight

    const sigmoidRatingC1 = config.sigmoid_rating_c1
    const sigmoidRatingTotalC1 = config.sigmoid_total_ratings_c1
    const sigmoidPriceC1 = config.sigmoid_price_c1


    const cleanedResults = searchResults.filter(sr => {
        return sr.rating != null && sr.ratings_total != null && sr.price != null && sr.price.value != null;
    });

    const { std: ratingSTD, mean: ratingMean } = getStdMean(cleanedResults.map(sr => sr.rating!));
    const { std: ratingTotalSTD, mean: ratingTotalMean } = getStdMean(cleanedResults.map(sr => sr.ratings_total!));
    const { std: priceSTD, mean: priceMean } = getStdMean(cleanedResults.map(sr => sr.price!.value));


    const scores: ChannelsScore[] = cleanedResults.map(sr => {
        const ratingZScore = zScore(ratingSTD, ratingMean, sr.rating?? -1)
        const totalRatingsZScore = zScore(ratingTotalSTD, ratingTotalMean, sr.ratings_total?? -1)
        const priceZScore = zScore(priceSTD, priceMean, sr.price.value)

        const ratingScore = sigmoid(ratingZScore, sigmoidRatingC1) * ratingWeight
        const ratingTotalScore = sigmoid(totalRatingsZScore, sigmoidRatingTotalC1) * ratingTotalWeight
        const priceScore = sigmoid(priceZScore, sigmoidPriceC1) * priceWeight
        

        return {
            qualityScore: ratingScore + ratingTotalScore + priceScore,
            ratingScore: ratingScore,
            ratingTotalScore: ratingTotalScore,
            priceScore: priceScore,
            priceZScore:priceZScore
        }
    })

    const maxQualityScore = Math.max(...scores.map(s=>s.qualityScore))
    const minQualityScore = Math.min(...scores.map(s=>s.qualityScore))

    const maxPriceScore = Math.max(...scores.map(s=>s.priceZScore))
    const minPriceScore = Math.min(...scores.map(s=>s.priceZScore))

    let scoredSearchResults = cleanedResults.map((sr, i) => {
        const qualityScoreNormalized = (scores[i].qualityScore - minQualityScore) / (maxQualityScore - minQualityScore)
        const priceScoreNormalized = (scores[i].priceZScore - minPriceScore) / (maxPriceScore - minPriceScore)

        return {
            searchResult: sr,
            quality: qualityScoreNormalized,
            priceScoreNormalized:priceScoreNormalized,
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

function sigmoid(z: number, c1:number, c0:number=0): number {
    return 1 / (1 + Math.exp(-(c0+(c1*z))));
}

