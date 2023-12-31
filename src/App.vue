<script setup lang="ts">
import { RouterView } from "vue-router"
import { externalWebsites } from "./configs/config"
import { useQuasar } from "quasar"
import { onBeforeMount, ref } from "vue"
import Header from "@/components/navigation/Header.vue"
import SideMenu from "@/components/navigation/SideMenu.vue"
import useBootstrap from "@/hooks/useBootstrap"
import useSettings from "@/store/settings"
import LightModeSwitch from "@/components/inputs/LightModeSwitch.vue"
import DisclaimerModal from "@/components/modals/DisclaimerModal.vue"

const settingsStore = useSettings()
const $q = useQuasar()
const showDisclaimer = ref(false)

const { bootstrap } = useBootstrap()

bootstrap()

onBeforeMount(() => {
	$q.dark.set(settingsStore.darkMode)

	if (!settingsStore.disclaimerApprove) {
		showDisclaimer.value = true
	}
})

const disclaimerUpdate = (value: boolean) => {
	settingsStore.setDisclaimerApprove(value)

	if (value) {
		showDisclaimer.value = false
	}
}
</script>

<template>
	<div
		class="min-h-window-height q-pt-74 q-pb-60 q-pt-md-64 q-mt-xs-10 q-pt-xs-40 q-pb-xs-150 column"
	>
		<div class="spot bg-blur-white-700 absolute"></div>
		<div class="container q-px-xs-0 q-px-md-0">
			<div class="column col-grow">
				<Header></Header>
				<div v-if="$q.screen.gt.md" class="no-pointer-events full-width flex">
					<div
						class="full-width !w-xs-1/3 q-px-xs-0 !w-sm-1/4 !w-md-1/6 self-end fixed-xs z-10 left-0 bottom-0"
					>
						<div class="column justify-end">
							<div
								class="vertical-sm-fixed relative-xs flex-xs items-center-xs justify-end-xs q-mt-vsm-40 top-0 bottom-xs-0 vertical-sm-window-height min-h-fit column justify-center"
							>
								<SideMenu class="all-pointer-events"></SideMenu>
							</div>
							<div
								class="vertical-sm-fixed flex-xs justify-center-xs relative-xs no-pointer-events bottom-0 q-mb-40 q-mb-xs-14 q-pt-lg w-fit"
							>
								<div class="all-pointer-events">
									<div class="q-mb-20">
										<LightModeSwitch class="flex q-mr-10"></LightModeSwitch>
									</div>
									<a
										:href="externalWebsites.coingecko"
										class="q-pl-12 block w-fit q-mb-14 text-center fs-12 text-weight-medium opacity-30"
									>
										<span class="text-white"> Price Data by CoinGecko </span>
									</a>
								</div>
							</div>
						</div>
					</div>
					<div
						class="full-width q-ml-auto !w-xs-2/3 !w-sm-3/4 !w-md-5/6 q-pt-42 all-pointer-events"
					>
						<router-view v-slot="{ Component }">
							<Transition name="fade" mode="out-in">
								<component :is="Component"></component>
							</Transition>
						</router-view>
					</div>
				</div>
			</div>
		</div>

		<DisclaimerModal v-model="showDisclaimer" @submit="disclaimerUpdate" />
	</div>
</template>

<style lang="scss" scoped>
.spot {
	width: 970px;
	height: 70px;
	top: -50px;
	left: 50%;
	transform: translate(-50%, -100%);
	pointer-events: none;
}
</style>
