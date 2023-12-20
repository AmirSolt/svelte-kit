<script lang="ts">
	import { onMount } from 'svelte';
	import ProductCard from './ProductCard.svelte';
	import ScatterPlot from './ScatterPlot.svelte';
	import type { ScoredSearchResult, ChartPoint } from '$lib/customTypes';
	export let data;
	let { scoredSearchResults, search_url, topProductsCount } = data;

	let filteredScoredSearchResults: ScoredSearchResult[] = [];
	let selectedAsin:string|undefined
	let containers:HTMLElement[] = [];
	let dataset: ChartPoint[] = [];

	let sortByKey = 'Quality';
	let sortBy: { [key: string]: any } = {
		"Quality": () => {
			filteredScoredSearchResults = scoredSearchResults
				.sort((a, b) => {
					return a.quality - b.quality;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredScoredSearchResults[0].searchResult.asin;
			updateChartData();
		},
		"Value": () => {
			filteredScoredSearchResults = scoredSearchResults
				.sort((a, b) => {
					return a.value - b.value;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredScoredSearchResults[0].searchResult.asin;
			updateChartData();
		},
		"Lowest Price": () => {
			filteredScoredSearchResults = scoredSearchResults
				.sort((a, b) => {
					return b.priceScoreNormalized - a.priceScoreNormalized;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredScoredSearchResults[0].searchResult.asin;
			updateChartData();
		},
		"Highest Price": () => {
			filteredScoredSearchResults = scoredSearchResults
				.sort((a, b) => {
					return a.priceScoreNormalized - b.priceScoreNormalized;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredScoredSearchResults[0].searchResult.asin;
			updateChartData();
		}
	};

	sortBy[sortByKey]();

	const axLabels = {
		xLabel: 'Quality',
		yLabel: 'Price'
	};
	const areaPoints = [
		{
			id: 'area',
			x: 0,
			y: 0
		},
		{
			id: 'area',
			x: 1,
			y: 0
		},
		{
			id: 'area',
			x: 1,
			y: 1
		}
	];

	function updateChartData() {
		dataset = filteredScoredSearchResults.map((r) => {
			return {
				id: r.searchResult.asin,
				x: r.quality,
				y: r.priceScoreNormalized
			};
		});
	}

	function onCenter(container:HTMLElement) {
		selectedAsin = container.dataset.id
	}

	function checkCenter() {
		containers.forEach((container) => {
			const containerElement = container;

			if (!containerElement) return;

			const rect = containerElement.getBoundingClientRect();
			const elementTop = rect.top;
			const elementBottom = rect.top + rect.height;
			const viewportCenterY = window.innerHeight * 0.6;
			const isCentered =
				elementTop < viewportCenterY  &&
				elementBottom > viewportCenterY

			if (isCentered) {
				// Pass the container (div element and id) to the onCenter callback
				onCenter(container);
			}
		});
	}

	onMount(() => {
		window.addEventListener('scroll', checkCenter);
		window.addEventListener('resize', checkCenter);

		// Run the check initially in case any elements are centered on initial load
		requestAnimationFrame(() => {
			checkCenter();
		});

		return () => {
			// Cleanup event listeners on component destruction
			window.removeEventListener('scroll', checkCenter);
			window.removeEventListener('resize', checkCenter);
		};
	});
</script>

<svelte:head>
	<meta property="og:title" content="Product search analyzer" />
	<meta property="og:image" content="%sveltekit.assets%/chart.png" />
</svelte:head>

<div class="flex flex-col justify-center items-center w-full">
	<div class="p-2 w-full sticky top-0 z-10 card h-64 drop-shadow-lg">
		<ScatterPlot points={dataset} labels={axLabels} selectedId={selectedAsin} {areaPoints} />
	</div>

	<br />

	<div class="card flex flex-col justify-center items-center gap-4 p-4">
		<p>
			Disclaimer: Links included on this page maybe affiliated with third parties and we may recieve
			commission or other compensation from them.
		</p>

		<a class="btn variant-filled" href={search_url} target="_blank" rel="noreferrer">
			Original Search Link
		</a>
	</div>

	<br />

	<div class="flex flex-col justify-center items-center">
		<h1 class="text-3xl p-2">
			Top {filteredScoredSearchResults.length} products by
		</h1>
		<select class="select w-40 text-xl" bind:value={sortByKey} on:change={sortBy[sortByKey]}>
			{#each Object.keys(sortBy) as key}
				<option value={key}>
					{key}
				</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2 py-4 max-w-2xl">
		{#each filteredScoredSearchResults as scoredSearchResult, i}
			<div  bind:this={containers[i]} data-id={scoredSearchResult.searchResult.asin}>
				<ProductCard
					{scoredSearchResult}
					isSelected={selectedAsin === scoredSearchResult.searchResult.asin}
					index={i}
				/>
			</div>
		{/each}
	</div>


	<div class="h-32" />
</div>
