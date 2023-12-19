<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear, type ScaleLinear } from 'd3-scale';
	import { extent } from 'd3-array';

    interface Point{ x: number; y: number, circleClass:string }
	export let points: Point[];
	export let labels: { xLabel: string; yLabel: string };
	let svg: Element;
	
	let height = 0;
	let width = 0;
    const circleRadius = 6

	const padding = { top: 20, right: 20, bottom: 45, left: 50 };

	onMount(() => {
		resize();
	});

    let xScale: ScaleLinear<number, number>;
    let yScale: ScaleLinear<number, number>;
    updateScales()

    function moveToLastSelected(points: Point[], keyword:string="selectedCircle"): Point[] {
        const selectedIndex = points.findIndex(point => point.circleClass === keyword);
        if (selectedIndex === -1 || selectedIndex === points.length - 1) {
          return points;
        }
        const selectedElement = points[selectedIndex];
        points.splice(selectedIndex, 1);
        points.push(selectedElement);
        return points;
    }

	function updateScales() {
		xScale = scaleLinear()
			.domain(extent(points, d => d.x)).nice()
			.range([padding.left, width - padding.right]);
		yScale = scaleLinear()
			.domain(extent(points, d => d.y)).nice()
			.range([height - padding.bottom, padding.top]);
	}

	function resize() {
		({ width, height } = svg.getBoundingClientRect());
		updateScales();
	}
</script>

<svelte:window bind:outerWidth="{width}" bind:outerHeight="{height}" on:resize="{resize}" />
<svg bind:this="{svg}">
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

	<!-- labels for axes -->
	<text class="label " transform="translate({padding.left/4},{height/2}) rotate(-90)">{labels.yLabel}</text>
	<text class="label " x="{width/2}" y="{height - padding.bottom/8}">{labels.xLabel}</text>

	<!-- data -->
	{#each moveToLastSelected(points) as point}
            <circle class=" {point.circleClass} " cx="{xScale(point.x)}" cy="{yScale(point.y)}" r="{circleRadius}" />
	{/each}
</svg>

<style>
	svg {
		width: 100%;
		height: 100%;
	}

	.circle {
		fill: blue;
		fill-opacity: 0.7;
		stroke: rgba(0, 0, 0, 0.5);
        z-index: 0;
	}
    .selectedCircle {
		fill: red;
		fill-opacity: 0.9;
		stroke: rgba(0, 0, 0, 0.5);
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