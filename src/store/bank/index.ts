import { Coin } from "@cosmjs/proto-signing"
import { claptrapClient } from "@/services"
import { acceptHMRUpdate, defineStore } from "pinia"
import useAuth from "@/store/auth"
import useConfig from "@/store/config"
import {
	ChainBalance,
	GammBalance,
	OsmosisLock,
	Token,
	TokenBalance,
} from "@/types"
import { compact, reduce, unionBy } from "lodash"
import { toViewDenom } from "@/common/numbers"
import { BigNumber } from "bignumber.js"
import { getFaucet } from "@/services/faucet"
import { notifyError, notifyLoading, notifySuccess } from "@/common"
import { AxiosError } from "axios"
import usePools from "@/store/pools"

export interface BankState {
	loading: boolean
	loadingFaucet: boolean
	otherBalance: Coin[]
	osmosisBalance: Coin[]
	fanfuryBalance: Coin[]
	fantokensBalance: Coin[]
	lockedCoinsBalance: Coin[]
	totalMintedFantokens: Coin[]
	lockedLongerDuration: OsmosisLock[]
}

const useBank = defineStore("bank", {
	state: (): BankState => ({
		loading: false,
		loadingFaucet: false,
		otherBalance: [],
		osmosisBalance: [],
		fanfuryBalance: [],
		fantokensBalance: [],
		lockedCoinsBalance: [],
		totalMintedFantokens: [],
		lockedLongerDuration: [],
	}),
	actions: {
		async init() {
			try {
				this.loading = true

				this.totalMintedFantokens = await claptrapClient.totalMintedFantokens()
			} catch (error) {
				console.error(error)
				throw error
			} finally {
				this.loading = false
			}
		},
		async loadBalance(address: string, chainID: string) {
			try {
				const configStore = useConfig()
				const token = unionBy(
					configStore.allMainTokens,
					configStore.fantokens,
					"symbol"
				).find((el) => el.chainID === chainID)
				this.loading = true

				if (token) {
					const otherBalance = await claptrapClient.balance(address, token.apiURL)

					this.otherBalance = [...this.otherBalance, ...otherBalance]
				}
			} catch (error) {
				console.error(error)
				throw error
			} finally {
				this.loading = false
			}
		},
		async loadBalances() {
			try {
				const authStore = useAuth()
				const configStore = useConfig()
				const fanfuryAddress = authStore.fanfuryAddress
				const osmosisAddress = authStore.osmosisAddress
				this.loading = true
				this.otherBalance = []

				for (const token of configStore.tokens) {
					const address = authStore.getAddress(token.addressPrefix)

					if (address) {
						this.loadBalance(address, token.chainID)
					}
				}

				if (fanfuryAddress && osmosisAddress) {
					const data = await claptrapClient.balances(fanfuryAddress, osmosisAddress)

					if (data) {
						this.osmosisBalance = data.osmosisBalance
						this.fanfuryBalance = data.fanfuryBalance
						this.fantokensBalance = data.fantokensBalance
						this.lockedCoinsBalance = data.lockedCoinsBalance
						this.lockedLongerDuration = data.lockedLongerDuration
					}
				}
			} catch (error) {
				console.error(error)
				throw error
			} finally {
				this.loading = false
			}
		},
		async getFaucet() {
			const authStore = useAuth()

			const loader = notifyLoading("Faucet Loading", "Waiting for faucet")

			try {
				this.loadingFaucet = true

				if (authStore.fanfuryAddress) {
					await getFaucet({ address: authStore.fanfuryAddress })
					loader()
					notifySuccess(
						"Request Enqueued Successfully",
						"Your transaction is pending. It will be processed shortly."
					)
					this.loadBalances()
				}
			} catch (error) {
				const axiosError = error as AxiosError

				this.loadingFaucet = false

				loader()

				if (
					axiosError &&
					axiosError.response &&
					axiosError.response.status === 429
				) {
					notifyError(
						"Fauce Claim Failed",
						"You made too many requests, please try again in a while."
					)
				} else {
					notifyError("Fauce Claim Failed", "Try it later")
				}

				throw error
			} finally {
				this.loadingFaucet = false
			}
		},
	},
	getters: {
		balances(): TokenBalance[] {
			const configStore = useConfig()

			return unionBy(
				configStore.allMainTokens,
				configStore.fantokens,
				"symbol"
			).map((token) => {
				const price = new BigNumber(token.price ?? "0")
				let osmosisChain: ChainBalance | undefined = undefined
				let fanfuryChain: ChainBalance | undefined = undefined
				const chains: ChainBalance[] = []

				const coinLookup = token.coinLookup.find(
					(coin) => coin.viewDenom === token.symbol
				)

				if (coinLookup) {
					const osmosisBalance = this.osmosisBalance.find((coin) => {
						if (token.ibcEnabled) {
							return coin.denom === token.ibc.osmosis.destDenom
						}

						return coin.denom === coinLookup.chainDenom
					})

					const fanfuryBalance = this.fanfuryBalance.find((coin) =>
						token.fantoken
							? coin.denom === coinLookup.fantokenDenom
							: coin.denom === coinLookup.chainDenom
					)

					if (fanfuryBalance && configStore.fanfuryToken) {
						const fanfuryAvailable = toViewDenom(
							fanfuryBalance.amount,
							coinLookup.chainToViewConversionFactor
						)
						const fanfuryTotal = new BigNumber(fanfuryAvailable)

						fanfuryChain = {
							name: configStore.fanfuryToken.name,
							symbol: token.symbol,
							denom: token.ibc.osmosis.sourceDenom,
							logos: configStore.fanfuryToken.logos,
							total: fanfuryTotal.toString(),
							available: fanfuryAvailable.toString(),
							totalFiat: price.multipliedBy(fanfuryTotal.toString()).toString(),
							availableFiat: price
								.multipliedBy(fanfuryAvailable.toString())
								.toString(),
						}

						chains.push(fanfuryChain)
					}

					if (osmosisBalance && configStore.osmosisToken) {
						const osmosisAvailable = toViewDenom(
							osmosisBalance.amount,
							coinLookup.chainToViewConversionFactor
						)
						const osmosisTotal = new BigNumber(osmosisAvailable)

						osmosisChain = {
							name: configStore.osmosisToken.name,
							symbol: configStore.osmosisToken.symbol,
							denom: token.ibcEnabled
								? token.ibc.osmosis.sourceDenom
								: coinLookup.chainDenom,
							logos: configStore.osmosisToken.logos,
							total: osmosisTotal.toString(),
							available: osmosisAvailable.toString(),
							totalFiat: price.multipliedBy(osmosisTotal.toString()).toString(),
							availableFiat: price
								.multipliedBy(osmosisAvailable.toString())
								.toString(),
						}

						chains.push(osmosisChain)
					}
				}

				const available = reduce<ChainBalance, BigNumber>(
					chains,
					(all, balance) => {
						return all.plus(balance.available ?? "0")
					},
					new BigNumber("0")
				).toString()

				const total = new BigNumber(available).toString()

				return {
					...token,
					total,
					available,
					totalFiat: price.multipliedBy(total).toString(),
					availableFiat: price.multipliedBy(available).toString(),
					chains,
				}
			})
		},
		total() {
			const poolStore = usePools()
			const balances = this.balances as TokenBalance[]
			const totalGammPoolBalances = this.totalGammPoolBalances as string

			return reduce<TokenBalance, BigNumber>(
				balances,
				(all, balance) => {
					return all.plus(balance.totalFiat ?? "0")
				},
				new BigNumber("0")
			)
				.plus(poolStore.totalBondedFiat)
				.plus(totalGammPoolBalances)
				.toString()
		},
		available() {
			const balances = this.balances as TokenBalance[]
			const totalGammPoolBalances = this.totalGammPoolBalances as string

			return reduce<TokenBalance, BigNumber>(
				balances,
				(all, balance) => {
					return all.plus(balance.availableFiat ?? "0")
				},
				new BigNumber("0")
			)
				.plus(totalGammPoolBalances)
				.toString()
		},
		allGamms({ osmosisBalance, lockedCoinsBalance }) {
			return [...osmosisBalance, ...lockedCoinsBalance]
		},
		allBalances({ fanfuryBalance, osmosisBalance, otherBalance }) {
			return [...fanfuryBalance, ...osmosisBalance, ...otherBalance]
		},
		lockedLongerByPoolIdAndDuration({ lockedLongerDuration }) {
			return (poolID: string, duration: string): OsmosisLock[] =>
				lockedLongerDuration.filter(
					(lockedLonger) =>
						lockedLonger.coins.filter((coin) => coin.denom === `gamm/pool/${poolID}`)
							.length > 0 && lockedLonger.duration === duration
				)
		},
		allSwappableBalances(): TokenBalance[] {
			const configStore = useConfig()

			if (configStore.assetsConfig) {
				const allowedDenoms = Object.keys(configStore.assetsConfig.routes)

				return this.balances
					.map((token) => {
						let routeDenom = ""

						if (!token.ibcEnabled) {
							const coinLookup = token.coinLookup.find(
								(coin) => coin.viewDenom === token.symbol
							)

							if (coinLookup) {
								routeDenom = coinLookup.chainDenom
							}
						} else {
							routeDenom = token.ibc.osmosis.destDenom
						}

						return {
							...token,
							routeDenom,
						}
					})
					.filter((token) => {
						return allowedDenoms.includes(token.routeDenom)
					})
			}

			return []
		},
		swappableBalancesByRouteDenom() {
			const configStore = useConfig()

			return (from: Token): TokenBalance[] => {
				const coinLookupFrom = from.coinLookup.find(
					(coin) => coin.viewDenom === from.symbol
				)

				const fromDenom = from.ibcEnabled
					? from.ibc.osmosis.destDenom
					: coinLookupFrom?.chainDenom

				if (fromDenom && configStore.assetsConfig) {
					const fromDictionary = configStore.assetsConfig.routes[fromDenom]

					if (fromDictionary) {
						const routeDenoms = Object.keys(fromDictionary)

						return this.allSwappableBalances.filter((balance) =>
							routeDenoms.includes(balance.routeDenom ?? "")
						)
					}
				}

				return []
			}
		},
		balanceBySymbol() {
			return (symbol: string) =>
				this.balances.find((balance) => balance.symbol === symbol)
		},
		osmosisAvailableBalances() {
			return (denoms: string[]) =>
				this.balances.filter((balance) => {
					if (balance.ibcEnabled) {
						return denoms.includes(balance.ibc.osmosis.sourceDenom)
					}

					const coinLookup = balance.coinLookup.find(
						(coin) => coin.viewDenom === balance.symbol
					)

					if (coinLookup) {
						return denoms.includes(coinLookup.chainDenom)
					}

					return false
				})
		},
		gammPoolBalances({ osmosisBalance }): GammBalance[] {
			const poolsStore = usePools()

			return compact(
				poolsStore.myPools
					.filter((pool) => {
						const userLiquidity = new BigNumber(pool.lpLiquidity)

						return userLiquidity.gt(0)
					})
					.map((pool) => {
						const gammBalance = osmosisBalance.find(
							(balance) => balance.denom === `gamm/pool/${pool.id}`
						)

						if (gammBalance) {
							return {
								pool,
								coin: gammBalance,
							}
						}
					})
			)
		},
		totalGammPoolBalances() {
			const balances = this.gammPoolBalances as GammBalance[]

			return reduce<GammBalance, BigNumber>(
				balances,
				(all, balance) => {
					return all.plus(balance.pool.lpLiquidity ?? "0")
				},
				new BigNumber("0")
			).toString()
		},
	},
	persistedState: {
		persist: false,
	},
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useBank, import.meta.hot))
}

export default useBank
