

interface Product{
    title:string
    asin:string
    link:string
    image:string
    
    isPrime:boolean
    isSponsored:boolean

    rating:number
    ratingsTotal:number

    symbol:string
    priceCurrValue:number
    priceOrgValue:number
    discountValue:number
    couponValue:number
    totalSaleValue:number

    productStats:ProductStats|undefined
}


interface ProductStats{
    qualityScore:number
    valueScore:number
    priceCurrNormalized:number
    
    ratingScore:number
    ratingsTotalScore:number
    priceOrgScore:number
}

interface ChartPoint{ id:string, x: number; y: number}

