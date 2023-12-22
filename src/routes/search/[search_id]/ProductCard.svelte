<script lang="ts">
	import StarRating from './StarRating.svelte';
	export let product: Product;
	export let isSelected: boolean;
	export let index: number;

    // Weird Typescript bug makes me do this
    const productStats = product.productStats!

</script>

<div
    id={product.asin}
    class="flex flex-col justify-between card rounded-lg p-2 md:p-4
     {isSelected
        ? 'variant-ringed-primary'
        : 'variant-glass-surface'}"
>
    <div class="flex justify-center">

        <div class="w-1/3">
            <a href={product.link} target="_blank" rel="noreferrer">
                <div
                    class="flex justify-center items-center w-full aspect-square p-1 md:p-4 rounded-lg bg-white"
                >
                    <img
                        class="max-w-full max-h-full"
                        src={product.image}
                        alt="Thumbnail"
                        loading="lazy"
                    />
                </div>
            </a>
        </div>

        <div class="w-2/3">

            <div class="flex flex-col gap-1 p-2">


                <div id="title" class="line-clamp-1">
                    <a href={product.link} target="_blank" rel="noreferrer">
                        <p>{product.title}</p>
                    </a>
                </div>

                <!-- Ratings -->
                {#if product.rating && typeof product.rating == 'number' && product.ratingsTotal}
                    <div id="review" class="row flex flex-col justify-center items-start">
                        <StarRating rating={product.rating} />
                        <small class="mx-2">({product.ratingsTotal})</small>
                    </div>
                {/if}

                <!-- Prices -->
                <div id="price" class="row">
                    <span class="text-lg">
                        {product.symbol}{product.priceCurrValue.toFixed(2)}
                    </span>

                    {#if product.totalSaleValue > 0}
                        <s class="text-xs">
                            {product.symbol}{product.priceOrgValue.toFixed(2)}
                        </s>
                    {/if}
                </div>


                <!-- Badges -->
                <div class="flex row gap-2 p-2">
                    {#if product.discountValue > 0}
                        <span class="badge variant-filled-primary text-xl">
                            {product.symbol}{(product.discountValue).toFixed(0)}
    
                                OFF
                        </span>
                    {/if}
                    {#if product.couponValue > 0}
                        <span class="badge variant-filled-secondary text-xl">
                            {product.symbol}{(product.couponValue).toFixed(0)}
    
                                Coupon
                        </span>
                    {/if}
                    {#if product.isPrime}
                        <span id="extra" class="badge variant-filled text-xl">
                            ✔ Prime
                        </span>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
