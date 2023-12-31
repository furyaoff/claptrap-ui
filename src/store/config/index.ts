import { FantokenRank } from "./../../types/balance"
import { claptrapClient } from "@/services"
import {
	AssetListConfig,
	ExtraGauge,
	ExtraGaugeList,
	Token,
	TokenBalance,
} from "@/types"
import { defineStore } from "pinia"
import { BigNumber } from "bignumber.js"
import { compact, reduce, unionBy } from "lodash"
import useBank from "@/store/bank"
import { Coin } from "@cosmjs/proto-signing"
import usePrices from "@/store/prices"

export interface ConfigState {
	loading: boolean
	assetsConfig?: AssetListConfig
	extraGauges?: ExtraGaugeList
}

const useConfig = defineStore("config", {
	state: (): ConfigState => ({
		loading: false,
		assetsConfig: undefined,
		extraGauges: undefined,
	}),
	actions: {
		async init() {
			try {
				this.loading = true

				const [assetsConfig, extraGauges] = await Promise.all([
					await claptrapClient.assetLists(),
					await claptrapClient.extraGauges(),
				])

				this.assetsConfig = assetsConfig
				this.extraGauges = extraGauges
			} catch (error) {
				console.error(error)
				throw error
			} finally {
				this.loading = false
			}
		},
	},
	getters: {
		fanfuryToken: ({ assetsConfig }): Token | undefined =>
			assetsConfig ? assetsConfig.fanfuryToken : undefined,
		osmosisToken: ({ assetsConfig }): Token | undefined =>
			assetsConfig ? assetsConfig.osmosisToken : undefined,
		rawFantokens: ({ assetsConfig }): Token[] =>
			assetsConfig ? assetsConfig.fantokens : [],
		fantokens(): TokenBalance[] {
			const bankStore = useBank()
			const pricesStore = usePrices()

			return this.rawFantokens.map((fantoken) => {
				const coinLookup = fantoken.coinLookup.find(
					(coin) => coin.viewDenom === fantoken.symbol
				)

				let circulatingSupply = new BigNumber("0")
				let totalMintedTokens = new BigNumber("0")
				let price = "0"

				if (coinLookup) {
					price = pricesStore.getFantokenPriceById(
						coinLookup.fantokenDenom ? coinLookup.fantokenDenom : coinLookup.viewDenom
					)

					const totalMintedFantokens = bankStore.totalMintedFantokens.filter(
						(el) => el.denom === coinLookup.fantokenDenom
					)

					totalMintedTokens = reduce<Coin, BigNumber>(
						totalMintedFantokens,
						(all, minted) => {
							return all.plus(minted.amount)
						},
						new BigNumber("0")
					).multipliedBy(coinLookup.chainToViewConversionFactor)

					circulatingSupply = totalMintedTokens
				}

				return {
					...fantoken,
					price,
					marketCap: circulatingSupply.multipliedBy(price).toString(),
					circulatingSupply: circulatingSupply.toString(),
					totalMintedTokens: totalMintedTokens.toString(),
				}
			})
		},
		fantokensRanking(): FantokenRank[] {
			return this.fantokens
				.sort(
					(left, right) =>
						parseInt(right.marketCap ?? "0", 10) - parseInt(left.marketCap ?? "0", 10)
				)
				.map((fantoken, rank) => ({
					...fantoken,
					rank: rank + 1,
				}))
		},
		tokens: ({ assetsConfig }) => (assetsConfig ? assetsConfig.tokens : []),
		allMainTokens(): TokenBalance[] {
			return compact([this.fanfuryToken, this.osmosisToken, ...this.tokens]).map(
				(el) => {
					const pricesStore = usePrices()
					let price = "0"

					if (pricesStore.coinGeckoPrices) {
						const priceMap = pricesStore.coinGeckoPrices[el.coinGeckoId]

						if (priceMap) {
							price = priceMap["usd"]
						}
					}

					return {
						...el,
						price,
					}
				}
			)
		},
		findTokenByDenom() {
			return (denom: string) =>
				unionBy(this.allMainTokens, this.fantokens, "symbol").find((token) => {
					const coinLookup = token.coinLookup.find(
						(coin) => coin.viewDenom === token.symbol
					)

					if (coinLookup) {
						if (coinLookup.fantokenDenom) {
							return coinLookup.fantokenDenom === denom
						}

						return coinLookup.chainDenom === denom
					}
				})
		},
		findFantokenByDenom() {
			return (denom: string) =>
				this.fantokens.find((token) => {
					const coinLookup = token.coinLookup.find(
						(coin) => coin.viewDenom === token.symbol
					)

					if (coinLookup) {
						return coinLookup.fantokenDenom === denom
					}
				})
		},
		findTokenBySymbol() {
			return (symbol: string) =>
				unionBy(this.allMainTokens, this.fantokens, "symbol").find(
					(token) => token.symbol === symbol
				)
		},
		extraGaugeIds({ extraGauges, assetsConfig }) {
			let gaugeIds: ExtraGauge[] = []

			if (extraGauges && assetsConfig) {
				for (const poolID in extraGauges) {
					const pool = assetsConfig.pools.find((el) => el.id === poolID)

					if (pool) {
						const gauges = extraGauges[poolID]

						gaugeIds = [...gaugeIds, ...gauges]
					}
				}
			}

			return gaugeIds.map((gauge) => gauge.gaugeId)
		},
	},
	persistedState: {
		persist: false,
	},
})

/* if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useConfig, import.meta.hot))
} */

export default useConfig
