<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear, type ScaleLinear } from 'd3-scale';
	import type { ChartPoint } from '$lib/customTypes';

    
	export let points: ChartPoint[];
	export let labels: { xLabel: string; yLabel: string };
	export let selectedId:string|null|undefined
	export let areaPoints:ChartPoint[]=[]

	let selectedPoint:ChartPoint|null|undefined
	let svg: Element;
	
	let height = 0;
	let width = 0;
    const circleRadius = 6
    const rectSideLength = (circleRadius+1)*2

	const padding = { top: 20, right: 20, bottom: 45, left: 50 };

	$: if(selectedId){
		selectedPoint = points.find(p=>p.id==selectedId)
	}

	onMount(() => {
		resize();
	});

    let xScale: ScaleLinear<number, number>;
    let yScale: ScaleLinear<number, number>;
    updateScales()
	

	$: areaPointsPath = areaPoints.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(' ') 

	function updateScales() {

		xScale = scaleLinear()
			.domain([0, 1]).nice()
			.range([padding.left, width - padding.right]);
		yScale = scaleLinear()
			.domain([0, 1]).nice()
			.range([height - padding.bottom, padding.top]);
	}

	function resize() {
		({ width, height } = svg.getBoundingClientRect());
		updateScales();
	}
</script>

<svelte:window on:resize="{resize}" />
<svg class="w-full h-full" bind:this="{svg}">
	<!-- y axis -->
	<g class="axis y-axis">
		{#each yScale.ticks(6) as tick}
			<g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
				<line x1="{padding.left}" x2="{width - padding.right}" />
				<text x="{padding.left - 10}" dy="0.32em">{tick}</text>
			</g>
		{/each}
	</g>

	<!-- x axis -->
	<g class="axis x-axis" transform="translate(0,{height - padding.bottom})">
		{#each xScale.ticks(6) as tick}
			<g class="tick tick-{tick}" transform="translate({xScale(tick)})">
				<line y1="{padding.bottom}" y2="{height - padding.top}" />
				<text y="9" dy="0.71em" text-anchor="middle">{tick}</text>
			</g>
		{/each}
	</g>


	<linearGradient id="greenFade" x1="100%" y1="100%" x2="0%" y2="0%">
		<stop offset="0%" style="stop-color: green; stop-opacity: 0.8;" />
		<stop offset="30%" style="stop-color: green; stop-opacity: 0.4;" />
		<stop offset="100%" style="stop-color: green; stop-opacity: 0;" />
	  </linearGradient>
	{#if areaPointsPath}
		<polygon points="{areaPointsPath}" class="area-shape"  fill="url(#greenFade)"  />
	{/if}

	<!-- labels for axes -->
	<text class="label " transform="translate({padding.left/4},{height/2}) rotate(-90)">{labels.yLabel}</text>
	<text class="label " x="{width/2}" y="{height - padding.bottom/8}">{labels.xLabel}</text>

	<!-- data -->
	{#each points as point}
            <circle class=" circle " cx="{xScale(point.x)}" cy="{yScale(point.y)}" r="{circleRadius}" />
	{/each}
	{#if selectedPoint}
		<rect class=" selectedCircle " x="{xScale(selectedPoint.x)-rectSideLength/2}" y="{yScale(selectedPoint.y)-rectSideLength/2}" width="{rectSideLength}" height="{rectSideLength}" />
	{/if}


</svg>


<p>{width}</p>
<p>{height}</p>

<style>



	.circle {
		fill: rgba(0,0,0,0);
		fill-opacity: 0.7;
		stroke: rgba(255,255,255, 1);
        z-index: 0;
	}
    .selectedCircle {
		fill: #f70b32;
		fill-opacity:1;
		stroke: rgb(0, 0, 0);
        z-index: 100;
	}

    .label {
		fill: #999;
	}
	.tick line {
		stroke: #ddd;
		stroke-dasharray: 2;
	}

	.tick text {
		fill: #999;
		font-size: 12px;
	}

	.y-axis text {
		text-anchor: end;
	}

	.x-axis text {
		text-anchor: middle;
	}
</style>