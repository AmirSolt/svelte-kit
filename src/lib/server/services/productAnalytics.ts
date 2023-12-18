import type { SearchResult, ScoredSearchResult } from "../../customTypes";


export function scoreSearchResults(searchResults:SearchResult[]):ScoredSearchResult[]{

    const ratingWeight = 1.6
    const ratingTotalWeight = 0.8
    const priceWeight = 0.6


    const cleanedResults = searchResults.filter(sr => {
        return sr.rating != null && sr.ratings_total != null && sr.price!=null && sr.price.value != null;
      });
    
    const {std:ratingSTD, mean:ratingMean}  = getStdMean(cleanedResults.map(sr => sr.rating!));
    const {std:ratingTotalSTD, mean:ratingTotalMean} = getStdMean(cleanedResults.map(sr => sr.ratings_total!));
    const {std:priceSTD, mean:priceMean} = getStdMean(cleanedResults.map(sr => sr.price!.value));





    return cleanedResults.map(sr=>{

        const score = zScore(ratingSTD,ratingMean,sr.rating??-1)*ratingWeight
             + zScore(ratingTotalSTD,ratingTotalMean,sr.ratings_total??-1)*ratingTotalWeight
              + zScore(priceSTD,priceMean,sr.price.value)*priceWeight

        return{
            searchResult:sr,
            quality:score,
            qualityPrice:(score/sr.price.value)
        }
    })
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



