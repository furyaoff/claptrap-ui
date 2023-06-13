import { externalClient } from "./external-client"

export const subscribeMailchimp = async (email: string, listID: string) => {
	const { data: result } = await externalClient.post(
		`${import.meta.env.VITE_FANFURY_MAILCHIMP_API}subscribe`,
		{
			email,
			listID,
		}
	)

	return result
}
