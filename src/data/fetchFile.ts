import { request, gql } from "graphql-request";

import { URL, HEADERS } from "./common";

// $expression "main:website/content/docs/exec.mdx"
const QUERY = gql`
  query GetFile($owner: String!, $name: String!, $expression: String!) {
    rateLimit {
      cost
      used
      remaining
    }
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        ... on Blob {
          byteSize
          text
        }
        ... on Tree {
          entries {
            name
            type
            mode
            object {
              ... on Blob {
                byteSize
                text
              }
            }
          }
        }
      }
    }
  }
`;

// {
//   "owner": "hashicorp",
//   "name":"waypoint",
//   "expression": "main:website/content/docs/exec.mdx"
// }
/**
 * @TODO type the response w/ https://www.graphql-code-generator.com/
 */
export default async function fetchFile(variables: {
  owner: string;
  name: string;
  expression: string;
}) {
  return await request(URL, QUERY, variables, HEADERS);
}
