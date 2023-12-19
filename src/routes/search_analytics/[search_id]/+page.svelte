<script lang="ts">
	import { SvelteComponent, onMount } from 'svelte';
	import ProductCard from './ProductCard.svelte';
	import ScatterPlot from './ScatterPlot.svelte';

	export let data;
	const { scoredSearchResults, search_url } = data;
	let selectedAsin = scoredSearchResults[0].searchResult.asin;

	const maxPrice = Math.max(...scoredSearchResults.map((r) => r.searchResult.price.value));
	const maxQuality = Math.max(...scoredSearchResults.map((r) => r.quality));


	let containers: { id: string; element: HTMLElement|null }[]=[];
	let dataset = updateDataset();
	const axLabels = {
		xLabel: 'Quality',
		yLabel: 'Price'
	};

	function updateDataset() {
		return scoredSearchResults.map((r) => {
			return {
				x: r.quality,
				y: r.searchResult.price.value,
				circleClass: r.searchResult.asin === selectedAsin ? 'selectedCircle' : 'circle'
			};
		});
	}
	function onCenter(container:{ id: string; element: HTMLElement|null }) {
		selectedAsin = container.id;
		dataset = updateDataset();
	}


	function checkCenter() {
		containers.forEach((container) => {
			const containerElement = container.element;

			if (!containerElement) return;

			const rect = containerElement.getBoundingClientRect();
			const elementCenterY = rect.top + rect.height / 2;
			const viewportCenterY = window.innerHeight / 2;
			const isCentered =
				elementCenterY >= viewportCenterY - rect.height / 2 &&
				elementCenterY <= viewportCenterY + rect.height / 2;

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

<div class="flex flex-col justify-center items-center w-full">
	<div class="p-2 w-full sticky top-0 z-10 card h-64 drop-shadow-lg">
		<ScatterPlot points={dataset} labels={axLabels} />
	</div>

	<br />

	<div class="card flex flex-col justify-center items-center gap-4 p-4">
		<div>disclaimer</div>

		<a class="btn variant-filled" href={search_url} target="_blank" rel="noreferrer">
			Search Link
		</a>
	</div>

	<br />

	<h1 class="text-3xl p-2">
		Top {scoredSearchResults.length} products by best-value (quality/price)
	</h1>

	<div class="flex flex-col justify-center items-center p-4 gap-4 max-w-5xl">
		{#each scoredSearchResults as scoredSearchResult, i}
			{containers.push({id:scoredSearchResult.searchResult.asin, element:null})}
			<div bind:this={containers[i].element}>
				<ProductCard
					{scoredSearchResult}
					isSelected={selectedAsin === scoredSearchResult.searchResult.asin}
					index={i}
				/>
			</div>
		{/each}
	</div>
	<div class="h-96" />
</div>
