<script lang="ts">
    export let data
    const {scoredSearchResults} = data
</script>

{#each scoredSearchResults as scoredSearchResult}
    <p>
        {scoredSearchResult.searchResult.asin}
    </p>
    <p>
        {scoredSearchResult.quality}
    </p>

{/each}