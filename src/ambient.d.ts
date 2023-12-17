interface Product{
    title: string;
    asin: string;
    link: string;
    image: string;

    is_prime?: boolean;

    rating?: number;
    ratings_total?: number;

    priceSymbol: string;
    priceValue: number;
}

interface ScoredProduct{
    product:Product
    quality:number
}