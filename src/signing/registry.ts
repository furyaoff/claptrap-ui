import { Registry, GeneratedType } from "@cosmjs/proto-signing"
import { defaultRegistryTypes } from "@cosmjs/stargate"
import { MsgClaim } from "./codec/fanfury/merkledrop/v1beta1/tx"

export const fanfuryRegistry = (): Registry => {
	return new Registry([
		...defaultRegistryTypes,
		["/fanfury.merkledrop.v1beta1.MsgClaim", MsgClaim as GeneratedType],
	])
}
