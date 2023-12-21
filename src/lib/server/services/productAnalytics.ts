import type { Config } from "@prisma/client";
import type { SearchResult, ScoredSearchResult } from "../../customTypes";





interface ChannelsScore {
    qualityScore: number
    ratingScore: number
    ratingTotalScore: number
    priceOrgScore: number
    priceCurrZScore:number
    priceOrgZScore:number
}


export function scoreSearchResults(config: Config, searchResults: SearchResult[]): ScoredSearchResult[] {

    const ratingWeight = config.rating_weight
    const ratingTotalWeight = config.total_ratings_weight
    const priceWeight = config.price_weight

    const sigmoidRatingC1 = config.sigmoid_rating_c1
    const sigmoidRatingTotalC1 = config.sigmoid_total_ratings_c1
    const sigmoidPriceC1 = config.sigmoid_price_c1


    const cleanedResults = searchResults.filter(sr => {
        return sr.rating != null && sr.ratings_total != null && getCurrentPrice(sr)!=null;
    });

    const { std: ratingSTD, mean: ratingMean } = getStdMean(cleanedResults.map(sr => sr.rating!));
    const { std: ratingTotalSTD, mean: ratingTotalMean } = getStdMean(cleanedResults.map(sr => sr.ratings_total!));
    const { std: priceCurrSTD, mean: priceCurrMean } = getStdMean(cleanedResults.map(sr => getCurrentPrice(sr)!));
    const { std: priceOrgSTD, mean: priceOrgMean } = getStdMean(cleanedResults.map(sr => getOriginalPrice(sr)!));


    const scores: ChannelsScore[] = cleanedResults.map(sr => {
        const ratingZScore = zScore(ratingSTD, ratingMean, sr.rating!)
        const totalRatingsZScore = zScore(ratingTotalSTD, ratingTotalMean, sr.ratings_total!)
        const priceCurrZScore = zScore(priceCurrSTD, priceCurrMean, getCurrentPrice(sr)!)
        const priceOrgZScore = zScore(priceOrgSTD, priceOrgMean, getOriginalPrice(sr)!)

        const ratingScore = sigmoid(ratingZScore, sigmoidRatingC1) * ratingWeight
        const ratingTotalScore = sigmoid(totalRatingsZScore, sigmoidRatingTotalC1) * ratingTotalWeight
        const priceOrgScore = sigmoid(priceOrgZScore, sigmoidPriceC1) * priceWeight
        

 
        return {
            qualityScore: ratingScore + ratingTotalScore + priceOrgScore,
            ratingScore: ratingScore,
            ratingTotalScore: ratingTotalScore,
            priceOrgScore: priceOrgScore,
            priceCurrZScore:priceCurrZScore,
            priceOrgZScore:priceOrgZScore,
            
        }
    })

    const maxQualityScore = Math.max(...scores.map(s=>s.qualityScore))
    const minQualityScore = Math.min(...scores.map(s=>s.qualityScore))

    const maxPriceZScore = Math.max(...scores.map(s=>s.priceCurrZScore))
    const minPriceZScore = Math.min(...scores.map(s=>s.priceCurrZScore))

    let scoredSearchResults = cleanedResults.map((sr, i) => {
        const qualityScoreNormalized = (scores[i].qualityScore - minQualityScore) / (maxQualityScore - minQualityScore)
        const priceCurrNormalized = (scores[i].priceCurrZScore - minPriceZScore) / (maxPriceZScore - minPriceZScore)
        let discount_raw = 0
        if(sr.prices && sr.prices.length>1 && sr.prices[1].value > sr.prices[0].value){
            discount_raw = sr.prices[1].value - sr.prices[0].value
        }


        return {
            searchResult: sr,
            quality: qualityScoreNormalized,
            priceCurrNormalized:priceCurrNormalized,
            value: qualityScoreNormalized / (priceCurrNormalized + 1),
            discount_raw
        }
    })

    // const smallestScore = Math.min(...scoredSearchResults.map(r=>r.quality))
    // scoredSearchResults.forEach(r=>{
    //     r.quality += (x - min) / (max - min)
    //     r.qualityPrice = (r.quality/r.searchResult.price.value)
    // })

    return scoredSearchResults

}

function getCurrentPrice(sr:SearchResult):number|null{
    if(sr.price != null && sr.price.value != null){
        return  sr.price.value
    }
    return null
}

function getOriginalPrice(sr:SearchResult):number|null{
    if(sr.prices && sr.prices.length>1 && sr.prices[1].value > sr.prices[0].value){
        return sr.prices[1].value
    }
    return getCurrentPrice(sr)
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

