// https://docs.github.com/en/actions/reference/environment-variables
// `GITHUB_GRAPHQL_URL`
export const URL = "https://api.github.com/graphql";

/** https://github.com/settings/tokens */
export const V4_GITHUB_API_TOKEN = process.env.V4_GITHUB_API_TOKEN;
export const HEADERS = { Authorization: `Bearer ${V4_GITHUB_API_TOKEN}` };
