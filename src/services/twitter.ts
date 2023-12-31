import { TwitterPagination, TweetAuthor, Leaderboard } from "@/types"
import { externalClient } from "./external-client"

export const getTweetAuthors = async (limit = 50, page = 1, search = "") => {
	const { data: result } = await externalClient.get<
		TwitterPagination<TweetAuthor>
	>(
		`${
			import.meta.env.VITE_FANFURY_TWITTER_API
		}subscriptions/${limit}/${page}/${search}`
	)

	return result
}

export const getLeaderboard = async (limit = 50, page = 1, search = "") => {
	const { data: result } = await externalClient.get<
		TwitterPagination<Leaderboard>
	>(
		`${import.meta.env.VITE_FANFURY_TWITTER_API}leaderboards/${limit}/${page}/${
			search ?? ""
		}`
	)

	return result
}
