import * as dotenv from 'dotenv'
dotenv.config()
if (process.env.ASINDATAAPI_KEY == null) {
    throw new Error('missing ASINDATAAPI_KEY');
}
if (process.env.AMAZON_AFFILIATE_ID == null) {
    throw new Error('missing AMAZON_AFFILIATE_ID');
}


class AmazonApi {
    api_key: string
    affiliate_id: string
    include_html: string = "false"
    output: "json" | "html" | "csv" = "json"
    exclude_sponsored: string = "false"
    api_url: string = 'https://api.asindataapi.com/request'
    constructor(api_key: string, affiliate_id: string) {
        this.api_key = api_key
        this.affiliate_id = affiliate_id
    }

    async search(amazon_domain: string, search_term: string, discounts: boolean): Promise<{
        amazonSearchUrl:string
        products:Product[]
    } | null> {

        const callType = "search"

        const queryParams = {
            type: callType,
            api_key: this.api_key,
            associate_id: this.affiliate_id,
            amazon_domain: amazon_domain,
            search_term: search_term,
            exclude_sponsored: this.exclude_sponsored,
            include_html: this.include_html,
            output: this.output,
            refinements: discounts ? "p_n_deal_type/23566065011" : "",
        };
        const queryString = new URLSearchParams(queryParams).toString();
        const urlWithQuery = `${this.api_url}?${queryString}`;
        const response = await fetch(urlWithQuery);

        let data = await response.json();

        if (response.ok) {
            const searchResponse = data as Amazon.SearchResponse
            return {
                amazonSearchUrl:searchResponse.request_metadata.amazon_url,
                products: this.convertSearchResponseToNativeType(searchResponse.search_results)
            }
        } else {

            console.log("Request to api.asindataapi.com Failed.:", data)
            return null
        }

    }

    convertSearchResponseToNativeType(searchResponse:Amazon.SearchResult[]):Product[]{

        const rawProducts = searchResponse.map(sr=>{


            if(
                !Boolean(sr.prices?.length) ||
                sr.rating==null ||
                sr.ratings_total==null 
            ) return null

            const prices = getPrices(sr)
            if(
                prices.length <= 0
            ) return null

            const couponValue = getCouponValue(sr)
            const discountValue = getDiscountValue(sr, prices)
            const currValue = prices[0].value - couponValue
            const orgValue = prices.length>1 ? prices[1].value : prices[0].value


            return {
                title:sr.title,
                asin:sr.asin,
                link:sr.link,
                image:sr.image,

                isPrime:sr.is_prime??false,
                isSponsored:sr.sponsored??false,
                rating:sr.rating,
                ratingsTotal:sr.ratings_total,
                symbol:prices[0].symbol,

                priceCurrValue:currValue,
                priceOrgValue:orgValue,

                discountValue:discountValue,
                couponValue:couponValue,

                totalSaleValue:discountValue+couponValue,
                productStats:undefined,
            } as Product
        })


        return rawProducts.filter(r=>r!=null) as Product[]

    }

    countryToDomain(countryCode: string | null): string {
        if (countryCode && countryCode in countryDomainList) {
            return countryDomainList[countryCode]
        }
        return countryDomainList.US
    }
}

export const amazon = new AmazonApi(
    process.env.ASINDATAAPI_KEY,
    process.env.AMAZON_AFFILIATE_ID
)




function getPrices(sr:Amazon.SearchResult):Amazon.Price[]{
    return sr.prices!.filter(p=>`${p.symbol}${p.value}`===p.raw)
}

function getDiscountValue(sr:Amazon.SearchResult, prices:Amazon.Price[]):number{
    if(sr.deal && prices.length>1){
        return prices[1].value - prices[0].value
    }
    return 0
}

function getCouponValue(sr:Amazon.SearchResult):number{
    if(sr.coupon){
        const extracted = extractNumberFromString(sr.coupon.badge_text)
        if(extracted==null) return 0
        return extracted
    }
    return 0
}

function extractNumberFromString(text: string): number | null {
    const matched = text.match(/-?\d+(\.\d+)?/);
    return matched ? parseFloat(matched[0]) : null;
}







// ============================================================













const countryDomainList: { [key: string]: string } = {
    AD: 'amazon.es', // Andorra -> Spain
    AE: 'amazon.ae', // United Arab Emirates (the)
    AT: 'amazon.de', // Austria -> Germany
    AU: 'amazon.com.au', // Australia
    BR: 'amazon.com.br', // Brazil
    CA: 'amazon.ca', // Canada
    CH: 'amazon.de', // Switzerland -> Germany
    CK: 'amazon.com.au', // Cook Islands (the) -> Australia
    CN: 'amazon.cn', // China
    CX: 'amazon.com.au', // Christmas Island -> Australia
    DE: 'amazon.de', // Germany
    ES: 'amazon.es', // Spain
    FR: 'amazon.fr', // France
    GB: 'amazon.co.uk', // United Kingdom of Great Britain and Northern Ireland (the)
    GI: 'amazon.co.uk', // Gibraltar -> UK
    IE: 'amazon.co.uk', // Ireland -> UK
    IM: 'amazon.co.uk', // Isle of Man -> UK
    IN: 'amazon.in', // India
    IO: 'amazon.in', // British Indian Ocean Territory (the) -> India
    IT: 'amazon.it', // Italy
    JP: 'amazon.co.jp', // Japan
    LI: 'amazon.nl', // Liechtenstein -> Netherlands
    LU: 'amazon.nl', // Luxembourg -> Netherlands
    MC: 'amazon.fr', // Monaco -> France
    MN: 'amazon.cn', // Mongolia -> China
    MT: 'amazon.co.uk', // Malta -> UK
    MX: 'amazon.com.mx', // Mexico
    NC: 'amazon.com.au', // New Caledonia -> Australia
    NZ: 'amazon.com.au', // New Zealand -> Australia
    SG: 'amazon.sg', // Singapore
    SM: 'amazon.it', // San Marino -> Italy
    TR: 'amazon.com.tr', // Turkey
    TW: 'amazon.cn', // Taiwan (Province of China) -> China
    VA: 'amazon.it' // Holy See (the) -> Italy

}





namespace Amazon {

    export interface Price {
        symbol: string;
        value: number;
        currency: string;
        raw: string;
        name?: string;
        is_primary?: boolean;
        is_rrp?: boolean;
        is_free?: boolean;
        asin?: string;
        link?: string;
    }

    interface Category {
        name: string;
        id: string;
    }

    interface Delivery {
        tagline: string;
        price?: Price;
    }

    interface BestSeller {
        link: string;
        category: string;
    }

    interface Carousel {
        title: string;
        sub_title: string;
        sponsored: boolean;
        id: string;
        total_items: number;
    }



    interface RelatedSearch {
        query: string;
        link: string;
    }

    interface Brand {
        logo: string;
        image: string;
        title: string;
        link: string;
        store_link: string;
        store_id: string;
        store_name: string;
    }

    interface Pagination {
        total_results: number;
        current_page: number;
        next_page_link: string;
        total_pages: number;
    }

    interface Refinement {
        name: string;
        value: string;
        link: string;
        refinement_display_name: string;
    }

    interface Refinements {
        prime: Refinement[];
        delivery: Refinement[];
        departments: Refinement[];
        reviews: Refinement[];
        price: Refinement[];
        brand: Refinement[];
        marking_pen_water_resistance_level: Refinement[];
        subscription_options: Refinement[];
        from_our_brands: Refinement[];
        packaging_option: Refinement[];
        amazon_global_store: Refinement[];
        international_shipping: Refinement[];
        condition: Refinement[];
        customizable_products: Refinement[];
        availability: Refinement[];
    }

    interface ShoppingAdvisorRecommendationProduct {
        title: string;
        asin: string;
        link: string;
        image: string;
        is_prime: boolean;
        rating: number;
        ratings_total: number;
        price: Price;
    }

    interface ShoppingAdvisorRecommendation {
        position: number;
        title: string;
        product: ShoppingAdvisorRecommendationProduct;
    }

    interface ShoppingAdvisor {
        position: number;
        title: string;
        recommendations: ShoppingAdvisorRecommendation[];
    }

    interface AdBlockProduct {
        asin: string;
        link: string;
        image: string;
        is_prime: boolean;
        rating: number;
        ratings_total: number;
    }

    interface AdBlock {
        campaign_id: string;
        brand_logo: string;
        background_image: string;
        advertiser_id: string;
        ad_id: string;
        link: string;
        title: string;
        store_link: string;
        store_id: string;
        store_name: string;
        products: AdBlockProduct[];
    }

    interface VideoBlock {
        video_link: string;
        thumbnail_link: string;
        campaign_id: string;
        advertiser_id: string;
        has_audio: boolean;
        store_name: string;
        store_link: string;
        store_id: string;
        products: AdBlockProduct[]; // Products in video block are similar to those in AdBlock
    }

    interface Deal {
        link: string
        badge_text: string
    }

    interface Coupon {
        badge_text: string
        text: string
    }

    export interface SearchResult {
        position: number;
        title: string;
        asin: string;
        link: string;
        categories: Category[];
        image: string;
        is_prime?: boolean;
        rating?: number;
        ratings_total?: number;
        sponsored?: boolean;
        prices?: Price[];
        price: Price;
        coupon?: Coupon;
        deal?: Deal;
        delivery?: Delivery;
        is_small_business?: boolean;
        bestseller?: BestSeller;
        is_carousel?: boolean;
        carousel?: Carousel;
    }

    export interface SearchResponse {
        request_info: {
            success: boolean;
            credits_used: number;
            credits_remaining: number;
            credits_reset_at: string;
        };
        request_parameters: {
            type: string;
            amazon_domain: string;
            search_term: string;
        };
        request_metadata: {
            created_at: string;
            processed_at: string;
            total_time_taken: number;
            amazon_url: string;
        };
        search_results: SearchResult[];
        related_searches: RelatedSearch[];
        related_brands: Brand[];
        pagination: Pagination;
        refinements: Refinements;
        shopping_advisors: ShoppingAdvisor[];
        ad_blocks: AdBlock[];
        video_blocks: VideoBlock[];
    }

}