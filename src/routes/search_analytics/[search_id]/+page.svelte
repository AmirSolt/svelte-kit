<script lang="ts">
	import '@carbon/charts-svelte/styles.css';
	import { onDestroy } from 'svelte';
	import { ScaleTypes, ComboChart, ChartTheme } from '@carbon/charts-svelte';
	import ProductCard from './ProductCard.svelte';
	import type { ScoredSearchResult } from '$lib/customTypes';
	export let data;

	const { scoredSearchResults, search_url } = data;
	let selectedAsin = scoredSearchResults[0].searchResult.asin;
	const maxPrice = Math.max(...scoredSearchResults.map((r) => r.searchResult.price.value))
	const maxQuality = Math.max(...scoredSearchResults.map((r) => r.quality))

	// console.log(scoredSearchResults)

	const productsDataset = 'Products'
	const recommendedAreaDataset = 'Recommended Area'
	let chart:ComboChart

	const chartData: any[] = [];
	chartData.push(
		...scoredSearchResults.map((r) => {
			return {
				group: productsDataset,
				id: r.searchResult.asin,
				price: r.searchResult.price.value,
				quality: r.quality
			};
		})
	);
	chartData.push(
		{
			group: recommendedAreaDataset,
			id: 'area',
			price: 0,
			quality: 0
		},
		{
			group: recommendedAreaDataset,
			id: 'area',
			price: maxPrice + maxPrice/10,
			quality: maxQuality + maxQuality/10
		}
	);



	function setColor(group: string, label?: string, data?: any, defaultFillColor?: string){
		if(group===recommendedAreaDataset)
			return "#049115A0"
		if(data && data.id===selectedAsin)
			return "#ffffff"
		return "#0a92bff0"
	}


	function productClicked(event: any) {
		const scoredSearchResult: ScoredSearchResult = event.detail.scoredSearchResult;
		console.log('>', scoredSearchResult);
		selectedAsin = scoredSearchResult.searchResult.asin
		// chartData.forEach(d=>{
		// 	if(d.group===selectedProductDataset){
		// 		d.group = productsDataset
		// 	}
		// 	if(d.id===selectedAsin){
		// 		d.group = selectedProductDataset
		// 	}
		// })
		// chart.model.setData(chartData)
		// chart.model.setOptions()
		chart.update()
	}
</script>

<div class="flex flex-col justify-center items-center w-full">
	<div class="p-2 w-full sticky top-0 z-10 card" style="height: 320px;">
		<ComboChart
		bind:chart
			data={chartData}
			
			options={{
				title: 'Price/Quality',
				height: '300px',
				theme: ChartTheme.G90,
				animations:false,
				getFillColor:setColor,
				getStrokeColor:setColor,
				axes: {
					bottom: {
						title: 'Quality',
						mapsTo: 'quality',
						scaleType: ScaleTypes.LINEAR
					},
					left: {
						title: 'Price',
						mapsTo: 'price',
						scaleType: ScaleTypes.LINEAR
					},

				},
				comboChartTypes: [
					{
						type: 'scatter',
						correspondingDatasets: [productsDataset],
					},
					{
						type: 'area',
						correspondingDatasets: [recommendedAreaDataset]
					},
					
				]
			}}
		/>
	</div>

	<br>

	<div class="card flex flex-col justify-center items-center gap-4 p-4">
		<div>
			disclaimer
		</div>
	
		<a class="btn variant-filled" href="{search_url}" target="_blank" rel="noreferrer">
			Search Link
		</a>
	</div>

	<br>


	<h1 class="text-3xl p-2">
		Top {scoredSearchResults.length} products by best-value (quality/price)
	</h1>

	<div class="flex flex-col justify-center items-center p-4 gap-4 max-w-5xl">
		{#each scoredSearchResults as scoredSearchResult, i}
			<ProductCard
				{scoredSearchResult}
				isSelected={selectedAsin === scoredSearchResult.searchResult.asin}
				index={i}
				on:click={productClicked}
			/>
		{/each}
	</div>
</div>
