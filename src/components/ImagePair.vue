<script setup lang="ts">
import { PoolAsset, Token } from "@/types"
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		coins?: PoolAsset[]
		tokens?: Token[]
		size?: number
		smallerSize?: number
		offset?: number[]
		inline?: boolean
		spacing?: number
	}>(),
	{
		spacing: 22,
	}
)

const sizeClass = computed(() => "s-" + (props.size ? props.size : 60))

const smallerSizeClass = computed(() => {
	return `s-${
		props.smallerSize
			? props.smallerSize
			: Math.round((props.size ? props.size : 60) / 2.9)
	} q-ml-${props.spacing}`
})

const style = props.offset
	? {
			right: props.offset[0] + "px",
			bottom: props.offset[1] + "px",
	  }
	: {}

const tokenLogos = computed(() => {
	if (props.tokens) {
		return props.tokens.map((token) => token.logos)
	}

	if (props.coins) {
		return props.coins.map((coin) => coin.token.logos)
	}

	return []
})
</script>

<template>
	<div class="relative-position w-fit">
		<template v-for="(logos, index) of tokenLogos" :key="index">
			<q-img
				v-if="index === 0"
				:src="logos.default"
				:class="'rounded cover ' + sizeClass"
				fit="cover"
			/>
			<div class="absolute right-0 bottom-0" :style="style" v-else-if="!inline">
				<q-img
					:src="logos.default"
					:class="'rounded cover ' + smallerSizeClass"
					fit="cover"
				/>
			</div>
			<q-img
				v-else
				:src="logos.default"
				:class="'rounded cover ' + smallerSizeClass"
				fit="cover"
			/>
		</template>
	</div>
</template>
