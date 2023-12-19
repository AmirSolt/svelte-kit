import type { Config } from "@prisma/client";
import type { SearchResult, ScoredSearchResult } from "../../customTypes";


export function scoreSearchResults(config:Config, searchResults:SearchResult[]):ScoredSearchResult[]{

    const ratingWeight = config.rating_weight
    const ratingTotalWeight = config.total_ratings_weight
    const priceWeight = config.price_weight


    const cleanedResults = searchResults.filter(sr => {
        return sr.rating != null && sr.ratings_total != null && sr.price!=null && sr.price.value != null;
      });
    
    const {std:ratingSTD, mean:ratingMean}  = getStdMean(cleanedResults.map(sr => sr.rating!));
    const {std:ratingTotalSTD, mean:ratingTotalMean} = getStdMean(cleanedResults.map(sr => sr.ratings_total!));
    const {std:priceSTD, mean:priceMean} = getStdMean(cleanedResults.map(sr => sr.price!.value));


      const scores = cleanedResults.map(sr=>{
            return zScore(ratingSTD,ratingMean,sr.rating??-1)*ratingWeight
                + zScore(ratingTotalSTD,ratingTotalMean,sr.ratings_total??-1)*ratingTotalWeight
                + zScore(priceSTD,priceMean,sr.price.value)*priceWeight
      })

      const maxScore = Math.max(...scores)
      const minScore = Math.min(...scores)


    let scoredSearchResults = cleanedResults.map((sr, i)=>{
        const quality = (scores[i] - minScore) / (maxScore - minScore)
        return{
            searchResult:sr,
            quality:quality,
            qualityPrice:(quality/sr.price.value)
        }
    })

    // const smallestScore = Math.min(...scoredSearchResults.map(r=>r.quality))
    // scoredSearchResults.forEach(r=>{
    //     r.quality += (x - min) / (max - min)
    //     r.qualityPrice = (r.quality/r.searchResult.price.value)
    // })

    return scoredSearchResults

}




function getStdMean(lst:number[]){
    const mean = lst.reduce((a, b) => a + b, 0) / lst.length;
    const variance = lst.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (lst.length - 1);
    const std = Math.sqrt(variance);
    return {std, mean}
}


function zScore(std:number, mean:number, elementValue: number): number {
    return (elementValue - mean) / std;
}



