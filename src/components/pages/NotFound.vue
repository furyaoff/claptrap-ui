<script setup lang="ts">
import { onMounted } from "vue"
import LargeButton from "@/components/buttons/LargeButton.vue"
import { sample } from "lodash"

onMounted(() => {
	document.title = "404 - Page Not Found"
})

const messages = [
	{
		artist: "Lost and insecure",
		text: "Where were you? Where were you?",
	},
	{
		artist: "Bob Dylan",
		text: "Lost, I was lost, I was lost 'til you loved me",
	},
	{
		artist: "Bob Marley",
		text: `There's no one around,
There's no one around,
There's no one around,
There's no one around`,
	},
	{
		artist: "Chase & Status",
		text: `You're the only one that I want
But we're not working (no)
Yeah, I told you from the start
I'm not perfect (oh)`,
	},
	{
		artist: "Tate McRae, Khalid",
		text: `Somebody holds the key.
But I can't find my way home.`,
	},
]

const message = sample(messages)
</script>

<template>
	<div class="grid grid-cols-12 gap-40">
		<div
			class="col-span-12 col-start-md-4 col-span-md-5 flex items-center column"
		>
			<q-img
				class="q-mt-md-34 q-mb-48 opacity-90 max-w-316 full-width"
				src="@/assets/images/microphone.png"
				alt="404 Not Found"
				title="404 Not Found"
				width="316px"
				height="316px"
				no-spinner
			/>

			<h1 class="fs-36 !leading-46 text-weight-medium text-center q-mt-0 q-mb-32">
				Ops, something is missing.
			</h1>

			<p
				class="fs-16 !leading-24 opacity-40 text-center q-mb-62 white-space-pre-line"
				v-if="message"
			>
				{{ message.text }}<br />
				{{ message.artist }}
			</p>

			<div class="flex justify-center">
				<LargeButton fit class="q-px-64 q-py-22" to="/pools">
					Go to Pools List
				</LargeButton>
			</div>
		</div>
	</div>
</template>
