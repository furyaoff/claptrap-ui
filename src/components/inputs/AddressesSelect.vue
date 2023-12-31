<script setup lang="ts">
import { resolveIcon } from "@/common/resolvers"
import { shortenMiddle } from "@/common/strings"
import { ValidationRule } from "quasar"
import { TokenWithAddress } from "@/types"
import { computed, ref } from "vue"
import DangerTooltip from "../tooltips/DangerTooltip.vue"
import { validateRules } from "@/common/inputs"

const props = defineProps<{
	addresses: TokenWithAddress[]
	title?: string
	modelValue?: TokenWithAddress
	rules?: ValidationRule<any>[] | undefined
}>()

const emit = defineEmits<{
	(e: "update:modelValue", value?: TokenWithAddress): void
}>()

const errorMessage = ref("")

const value = computed<TokenWithAddress | undefined>({
	get() {
		return props.modelValue
	},
	set(value) {
		validateRules(props.rules, value, errorMessage)
		emit("update:modelValue", value)
	},
})

const showTooltip = computed(() => errorMessage.value != "")

const address = computed(() => {
	if (props.modelValue) {
		return props.addresses.find((el) => el.chainID === props.modelValue?.chainID)
			?.address
	}

	return ""
})
</script>

<template>
	<q-select
		v-model="value"
		:options="addresses"
		:dropdown-icon="resolveIcon('dropdown', 11, 7)"
		borderless
		class="rounded-20 select-border text-white q-px-select-0 light:border-gray-700"
		input-class="q-px-20 q-py-20"
		popup-content-class="rounded-20 q-px-10 q-py-0"
		:menu-offset="[0, 8]"
		:rules="rules"
		hide-bottom-space
		behavior="menu"
	>
		<template v-slot:option="{ itemProps, opt }">
			<div v-bind="itemProps" class="text-white q-py-16 q-px-10 cursor-pointer">
				<p class="fs-14 q-mb-2">
					{{ opt.name }}
				</p>
			</div>
		</template>
		<template v-slot:selected-item="{ opt }">
			<div class="q-py-15">
				<div class="title-with-error flex q-mb-8 items-center">
					<p class="fs-10 text-uppercase text-weight-medium opacity-40 q-mr-8">
						{{ title }}
					</p>
					<q-icon
						:name="resolveIcon('info', 15, 15)"
						size="12px"
						color="primary"
					></q-icon>
				</div>
				<p class="fs-14 q-mb-2">
					{{ opt.name }}
				</p>
				<p class="fs-12 text-weight-medium opacity-40">
					{{ address ? shortenMiddle(address, 20) : "uknown" }}
				</p>
			</div>
			<DangerTooltip
				anchor="center middle"
				self="center start"
				v-model="showTooltip"
				no-parent-event
				@click="errorMessage = ''"
				class="all-pointer-events"
			>
				{{ errorMessage }}
			</DangerTooltip>
		</template>
	</q-select>
</template>
