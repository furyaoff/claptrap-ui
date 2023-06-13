import ClaptrapClient from "./claptrap-client"
import CoinGeckoClient from "./coingecko-client"
import { endpoints } from "@/configs/config"

const claptrapClient = new ClaptrapClient(
	import.meta.env.VITE_FANFURY_CONFIG_URL
)

const coinGeckoClient = new CoinGeckoClient(endpoints.coingecko)

export { claptrapClient, coinGeckoClient }
