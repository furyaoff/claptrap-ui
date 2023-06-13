import { DenomUnit } from "./chain"

export interface FanfuryFantokenMetaData {
	description: string
	denom_units: DenomUnit[]
	base: string
	display: string
	name: string
	symbol: string
}

export interface FanfuryFantoken {
	name: string
	max_supply: string
	mintable: boolean
	owner: string
	meta_data: FanfuryFantokenMetaData
}

export interface FanfuryMerkledrop {
	id: string
	merkle_root: string
	start_height: string
	end_height: string
	denom: string
	amount: string
	claimed: string
	owner: string
}
