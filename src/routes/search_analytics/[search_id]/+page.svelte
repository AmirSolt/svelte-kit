<script lang="ts">
	import { SvelteComponent, onMount } from 'svelte';
	import ProductCard from './ProductCard.svelte';
	import ScatterPlot from './ScatterPlot.svelte';

	export let data;
	const { scoredSearchResults, search_url } = data;
	let selectedAsin = scoredSearchResults[0].searchResult.asin;

	const maxPrice = Math.max(...scoredSearchResults.map((r) => r.searchResult.price.value));
	const maxQuality = Math.max(...scoredSearchResults.map((r) => r.quality));


	let containers: { id: string; element: HTMLElement|null }[]=scoredSearchResults.map(r=>{
		return {id:r.searchResult.asin, element:null}
	});

	let dataset = scoredSearchResults.map((r) => {
			return {
				id: r.searchResult.asin,
				x: r.quality,
				y: r.searchResult.price.value,
			};
	});
	const axLabels = {
		xLabel: 'Quality',
		yLabel: 'Price'
	};
	const areaPoints = [
		{
			id: "area",
			x: 0,
			y: 0,
		},
		{
			id: "area",
			x: maxQuality,
			y: 0,
		},
		{
			id: "area",
			x: maxQuality,
			y: maxPrice,
		},
	]

	function onCenter(container:{ id: string; element: HTMLElement|null }) {
		selectedAsin = container.id;
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


<svelte:head>
	<meta property="og:title" content="Product search analyzer" />
	<meta property="og:image" content="%sveltekit.assets%/chart.png" />
</svelte:head>



<div class="flex flex-col justify-center items-center w-full">
	<div class="p-2 w-full sticky top-0 z-10 card h-64 drop-shadow-lg">
		<ScatterPlot points={dataset} labels={axLabels} selectedId={selectedAsin} areaPoints={areaPoints} />
	</div>

	<br />

	<div class="card flex flex-col justify-center items-center gap-4 p-4">
		<p>
			Disclaimer: Links included on this page maybe affiliated with third parties and we may recieve commission or other compensation from them. 
		</p>

		<a class="btn variant-filled" href={search_url} target="_blank" rel="noreferrer">
			Original Search Link
		</a>
	</div>

	<br />

	<h1 class="text-3xl p-2">
		Top {scoredSearchResults.length} products by <b>best-value for price</b> 
	</h1>

	<div class="flex flex-col justify-center items-center p-4 gap-4 max-w-5xl scroll-smooth">
		{#each scoredSearchResults as scoredSearchResult, i}
			<div class="w-full" bind:this={containers[i].element}>
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
