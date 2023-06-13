import { BigNumber } from "bignumber.js"
import { coinGeckoClient } from "@/services"
import { CoinGeckoPriceResponse } from "@/types"
import { acceptHMRUpdate, defineStore } from "pinia"
import useConfig from "@/store/config"
import usePools from "@/store/pools"
import { calculateSpotPrice } from "@/common/numbers"

export interface PricesState {
	loading: boolean
	coinGeckoPrices?: CoinGeckoPriceResponse
}

const usePrices = defineStore("prices", {
	state: (): PricesState => ({
		loading: false,
		coinGeckoPrices: undefined,
	}),
	actions: {
		async init() {
			try {
				const configStore = useConfig()
				this.loading = true

				const ids = configStore.allMainTokens.map((token) => token.coinGeckoId)

				const response = await coinGeckoClient.simplePrices(ids, ["usd"])

				this.coinGeckoPrices = response.data
			} catch (error) {
				console.error(error)
				throw error
			} finally {
				this.loading = false
			}
		},
	},
	getters: {
		getPriceById: ({ coinGeckoPrices }) => {
			return (id: string) => {
				if (coinGeckoPrices) {
					return coinGeckoPrices[id]["usd"]
				}

				return "0"
			}
		},
		getFantokensPrices: ({ coinGeckoPrices }) => {
			const configStore = useConfig()
			const poolsStore = usePools()
			const fanfuryToken = configStore.fanfuryToken

			if (coinGeckoPrices && fanfuryToken) {
				return configStore.rawFantokens.map((fantoken) => {
					let price = "0"

					const coinLookup = fantoken.coinLookup.find(
						(coin) => coin.viewDenom === fantoken.symbol
					)

					const routes = fantoken.routes

					if (routes) {
						const pool = poolsStore.rawPools.find(
							(rawPool) => rawPool.id === routes.poolID
						)

						if (pool) {
							const furyAsset = pool.pool_assets.find(
								(asset) => asset.token.denom === fanfuryToken.ibc.osmosis.destDenom
							)

							const fantokenAsset = pool.pool_assets.find(
								(asset) => asset.token.denom === fantoken.ibc.osmosis.destDenom
							)

							if (furyAsset && fantokenAsset) {
								const inSpotPrice = calculateSpotPrice(fantokenAsset, furyAsset)
								const spotPriceDec = inSpotPrice.isEqualTo(0)
									? new BigNumber(0)
									: new BigNumber(1).div(inSpotPrice)

								const destCoinPrice = coinGeckoPrices[fanfuryToken.coinGeckoId]["usd"]

								if (destCoinPrice) {
									const res = spotPriceDec.multipliedBy(destCoinPrice)

									if (!res.isNaN()) {
										price = res.toFixed(10)
									}
								}
							}
						}
					}

					const denom = coinLookup
						? coinLookup.fantokenDenom ?? fantoken.symbol
						: fantoken.symbol

					return {
						denom,
						price,
					}
				})
			}
		},
		getFantokenPriceById() {
			return (denom: string) => {
				if (this.getFantokensPrices) {
					const fantokenPrice = this.getFantokensPrices.find(
						(price) => price.denom === denom
					)

					if (fantokenPrice) {
						return fantokenPrice.price
					}
				}

				return "0"
			}
		},
		furyPrice({ coinGeckoPrices }) {
			const configStore = useConfig()

			if (coinGeckoPrices && configStore.fanfuryToken) {
				return coinGeckoPrices[configStore.fanfuryToken.coinGeckoId]["usd"]
			}

			return "0"
		},
	},
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(usePrices, import.meta.hot))
}

export default usePrices
