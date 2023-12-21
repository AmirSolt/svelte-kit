<script lang="ts">
	import type { ScoredSearchResult } from '$lib/customTypes';
	import StarRating from './StarRating.svelte';
	export let scoredSearchResult: ScoredSearchResult;
	export let isSelected: boolean;
	export let index: number;
</script>

{#if scoredSearchResult.searchResult.title && scoredSearchResult.searchResult.image && scoredSearchResult.searchResult.link}
	<div
		id={scoredSearchResult.searchResult.asin}
		class="flex flex-col justify-between card rounded-lg p-2 md:p-4 {isSelected
			? 'variant-ringed-primary'
			: 'variant-glass-surface'}"
	>
		<header class="flex justify-between p-1">
			<h1>{index + 1}.</h1>
			<h1 class={isSelected ? 'text-primary-500' : ''}>
				Quality Score: {scoredSearchResult.quality.toFixed(2)}
			</h1>
		</header>

		<div class="flex justify-center">

			<div class="w-1/3">
				<a href={scoredSearchResult.searchResult.link} target="_blank" rel="noreferrer">
					<div
						class="flex justify-center items-center w-full aspect-square p-1 md:p-4 rounded-lg bg-white"
					>
						<img
							class="max-w-full max-h-full"
							src={scoredSearchResult.searchResult.image}
							alt="Thumbnail"
							loading="lazy"
						/>
					</div>
				</a>
			</div>

			<div class="w-2/3">

				<div class="flex flex-col gap-1 p-2">
					<div id="title" class="line-clamp-1">
						<a href={scoredSearchResult.searchResult.link} target="_blank" rel="noreferrer">
							<p>{scoredSearchResult.searchResult.title}</p>
						</a>
					</div>
	
					<!-- Ratings -->
					{#if scoredSearchResult.searchResult.rating && typeof scoredSearchResult.searchResult.rating == 'number' && scoredSearchResult.searchResult.ratings_total}
						<div id="review" class="row flex flex-col justify-center items-start">
							<StarRating rating={scoredSearchResult.searchResult.rating} />
							<small class="mx-2">({scoredSearchResult.searchResult.ratings_total})</small>
						</div>
					{/if}
	
					<!-- Prices -->
					{#if scoredSearchResult.searchResult.prices && scoredSearchResult.searchResult.prices.length > 0}
						<div id="price" class="row">
							<span class="text-2xl">
								{scoredSearchResult.searchResult.prices[0].symbol}{scoredSearchResult.searchResult
									.prices[0].value}
							</span>
	
							{#if scoredSearchResult.discount_raw}
								<s class="text-xs">
									{scoredSearchResult.searchResult.prices[0].symbol}{scoredSearchResult.searchResult
										.prices[1].value}
								</s>
							{/if}
						</div>
					{/if}
	
					<!-- Badges -->
					<div class="flex row gap-2">
						{#if scoredSearchResult.searchResult.prices && scoredSearchResult.discount_raw}
							<span class="badge variant-filled-primary text-xl">
								{scoredSearchResult.searchResult.prices[0].symbol}{(scoredSearchResult.discount_raw).toFixed(1)}
		
									OFF
							</span>
						{/if}
						{#if scoredSearchResult.searchResult.is_prime}
							<span id="extra" class="badge variant-filled">
								✔ Prime
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
