<script lang="ts">
	import type { ScoredSearchResult } from '$lib/customTypes';
	import StarRating from './StarRating.svelte';
	export let scoredSearchResult: ScoredSearchResult;
	export let isSelected: boolean;
	export let index: number;

	// === call back on add ===
	function truncate(text: string, size: number) {
		return text.substring(0, size) + ' ...';
	}


</script>

{#if scoredSearchResult.searchResult.title && scoredSearchResult.searchResult.image && scoredSearchResult.searchResult.link}
	<div
		id={scoredSearchResult.searchResult.asin}
		class=" flex flex-col justify-between card drop-shadow-lg  rounded-lg p-2 md:p-4 w-full {isSelected
			? 'variant-ringed-primary'
			: 'variant-glass-surface'}"
	>
		<!-- Media -->
		<header class="flex flex-col justify-center items-center">
			<div class="flex justify-between w-full p-1">
				<h1>
					{index + 1}.
				</h1>
				<h1 class="{isSelected
					? 'text-primary-500'
					: ''}">
					Quality Score: {scoredSearchResult.quality.toFixed(2)}
				</h1>
			</div>
		</header>

		<div class="flex justify-center">
			<a href={scoredSearchResult.searchResult.link} id="media" target="_blank" rel="noreferrer">
				<div
					class="flex justify-center items-center w-32 h-36 md:w-72 md:h-74 p-2 md:p-4 rounded-lg bg-white shadow-gray-800/90"
				>
					<img
						class="max-w-full max-h-full"
						src={scoredSearchResult.searchResult.image}
						alt="Thumbnail"
					/>
				</div>
			</a>

			<div id="info" class="flex flex-col gap-1 p-2">
				<!-- Title -->
				<div id="title" class="row">
					<a
						href={scoredSearchResult.searchResult.link}
						id="media"
						target="_blank"
						rel="noreferrer"
					>
						<p>{truncate(scoredSearchResult.searchResult.title, 40)}</p>
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

						{#if scoredSearchResult.searchResult.prices.length > 1}
							<s>
								{scoredSearchResult.searchResult.prices[1].symbol}{scoredSearchResult.searchResult
									.prices[1].value}
							</s>
						{/if}
					</div>
				{/if}

				<!-- Badges -->
				{#if scoredSearchResult.searchResult.is_prime}
					<div id="extra" class="row">
						<h3>✔ Prime</h3>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
