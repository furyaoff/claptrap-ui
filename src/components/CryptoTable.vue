<script setup lang="ts">
import { TableColumn, TokenBalance } from "@/types"
import LightTable from "./LightTable.vue"

defineProps<{
	rows: TokenBalance[]
	columns: TableColumn[]
}>()
</script>

<template>
	<LightTable
		class="q-px-0 q-py-0 table-no-padding"
		:rows="rows"
		:columns="columns"
		no-background
		header-border
		alternative-index
		:hide-bottom="false"
	>
		<template v-slot:body-cell-rank="slotProps">
			<q-td :props="slotProps">
				<span class="fs-13 opacity-40 text-white">{{ slotProps.row.rank }}</span>
			</q-td>
		</template>
		<template v-slot:body-cell-symbol="slotProps">
			<q-td :props="slotProps">
				<span class="opacity-40"> {{ slotProps.row.symbol }} </span>
			</q-td>
		</template>
		<template v-slot:body-cell-token="slotProps">
			<q-td :props="slotProps">
				<div class="row items-center no-wrap">
					<q-avatar size="30px" class="q-mr-22">
						<img :src="slotProps.row.logos.default" :alt="slotProps.row.name" />
					</q-avatar>
					<p class="text-weight-medium fs-15 white-space-pre-line">
						{{ slotProps.row.name }}
					</p>
				</div>
			</q-td>
		</template>
		<template v-slot:body-cell-index="props">
			<q-td :props="props">
				<span class="opacity-40">
					{{ props.rowIndex + 1 }}
				</span>
			</q-td>
		</template>
		<template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
			<slot :name="slot" v-bind="scope"></slot>
		</template>
		<template v-slot:bottom></template>
	</LightTable>
</template>
