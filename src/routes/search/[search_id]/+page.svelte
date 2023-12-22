<script lang="ts">
	import { onMount } from 'svelte';
	import ProductCard from './ProductCard.svelte'
	import ScatterPlot from './ScatterPlot.svelte';
	export let data;
	let { products, search_url, topProductsCount } = data;

	let filteredProducts: Product[] = [];
	let selectedAsin:string|undefined
	let containers:HTMLElement[] = [];
	let dataset: ChartPoint[] = [];

	let sortByKey = 'Discount';
	let sortBy: { [key: string]: any } = {
		"Discount": () => {
			filteredProducts = products
				.sort((a, b) => {
					return a.totalSaleValue - b.totalSaleValue;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredProducts[0].asin;
			// updateChartData();
		},
		"Value": () => {
			filteredProducts = products
				.sort((a, b) => {
					return a.productStats!.valueScore - b.productStats!.valueScore;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredProducts[0].asin;
			// updateChartData();
		},
		"Quality": () => {
			filteredProducts = products
				.sort((a, b) => {
					return a.productStats!.qualityScore - b.productStats!.qualityScore;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredProducts[0].asin;
			// updateChartData();
		},
		"Lowest Price": () => {
			filteredProducts = products
				.sort((a, b) => {
					return b.productStats!.priceCurrNormalized - a.productStats!.priceCurrNormalized;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredProducts[0].asin;
			// updateChartData();
		},
		"Highest Price": () => {
			filteredProducts = products
				.sort((a, b) => {
					return a.productStats!.priceCurrNormalized - b.productStats!.priceCurrNormalized;
				})
				.slice(-topProductsCount)
				.reverse();
			selectedAsin = filteredProducts[0].asin;
			// updateChartData();
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
		dataset = filteredProducts.map((r) => {
			return {
				id: r.asin,
				x: r.productStats!.qualityScore,
				y: r.productStats!.priceCurrNormalized
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
			const viewportCenterY = window.innerHeight * 0.5;
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

<!-- <div class="w-full sticky top-0 z-10 card h-48 drop-shadow-lg">
	<ScatterPlot points={dataset} labels={axLabels} selectedId={selectedAsin} {areaPoints} />
</div> -->

<div class="flex flex-col justify-center items-center px-2">

	<br />

	<div class="card flex flex-col justify-center items-center gap-4 p-4">
		<p>
			Disclaimer: We may earn commissions from third-party affiliate links on this page.
		</p>

		<a class="btn variant-filled" href={search_url} target="_blank" rel="noreferrer">
			Original Search Link
		</a>
	</div>

	<br />

	<div class="flex flex-col justify-center items-center">
		<h1 class="text-3xl p-2">
			Top {filteredProducts.length} products by
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
		{#each filteredProducts as product, i}
			<div  bind:this={containers[i]} data-id={product.asin}>
				<ProductCard
					product={product}
					isSelected={selectedAsin === product.asin}
					index={i}
				/>
			</div>
		{/each}
	</div>


	<div class="h-32" />
</div>
