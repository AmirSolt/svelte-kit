import type { Config } from "@prisma/client";





interface StatsChannels {
    qualityScore: number
    ratingScore: number
    ratingsTotalScore: number
    priceOrgScore: number

    priceCurrZScore:number
    priceOrgZScore:number
}


export function updateProductStats(config: Config, products: Product[]) {

    const ratingWeight = config.rating_weight
    const ratingTotalWeight = config.total_ratings_weight
    const priceWeight = config.price_weight

    const sigmoidRatingC1 = config.sigmoid_rating_c1
    const sigmoidRatingTotalC1 = config.sigmoid_total_ratings_c1
    const sigmoidPriceC1 = config.sigmoid_price_c1


    const { std: ratingSTD, mean: ratingMean } = getStdMean(products.map(p => p.rating));
    const { std: ratingsTotalSTD, mean: ratingsTotalMean } = getStdMean(products.map(p => p.ratingsTotal));
    const { std: priceCurrSTD, mean: priceCurrMean } = getStdMean(products.map(p => p.priceCurrValue));
    const { std: priceOrgSTD, mean: priceOrgMean } = getStdMean(products.map(p => p.priceOrgValue));


    const scores: StatsChannels[] = products.map(p => {
        const ratingZScore = zScore(ratingSTD, ratingMean, p.rating!)
        const ratingsTotalZScore = zScore(ratingsTotalSTD, ratingsTotalMean, p.ratingsTotal)
        const priceCurrZScore = zScore(priceCurrSTD, priceCurrMean, p.priceCurrValue)
        const priceOrgZScore = zScore(priceOrgSTD, priceOrgMean, p.priceOrgValue)

        const ratingScore = sigmoid(ratingZScore, sigmoidRatingC1) * ratingWeight
        const ratingsTotalScore = sigmoid(ratingsTotalZScore, sigmoidRatingTotalC1) * ratingTotalWeight
        const priceOrgScore = sigmoid(priceOrgZScore, sigmoidPriceC1) * priceWeight
        
        return {
            qualityScore: ratingScore + ratingsTotalScore + priceOrgScore,
            ratingScore: ratingScore,
            ratingsTotalScore: ratingsTotalScore,
            priceOrgScore: priceOrgScore,

            priceCurrZScore:priceCurrZScore,
            priceOrgZScore:priceOrgZScore,
        }
    })

    const maxQualityScore = Math.max(...scores.map(s=>s.qualityScore))
    const minQualityScore = Math.min(...scores.map(s=>s.qualityScore))

    const maxPriceZScore = Math.max(...scores.map(s=>s.priceCurrZScore))
    const minPriceZScore = Math.min(...scores.map(s=>s.priceCurrZScore))

    products.forEach((p, i) => {
        const qualityScoreNormalized = (scores[i].qualityScore - minQualityScore) / (maxQualityScore - minQualityScore)
        const priceCurrNormalized = (scores[i].priceCurrZScore - minPriceZScore) / (maxPriceZScore - minPriceZScore)

        p.productStats = {
            qualityScore: qualityScoreNormalized,
            valueScore: qualityScoreNormalized / (priceCurrNormalized + 1),
            priceCurrNormalized: priceCurrNormalized,
        }
    })
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

