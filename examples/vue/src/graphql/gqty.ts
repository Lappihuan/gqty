/**
 * GQTY: You can safely modify this file and Query Fetcher based on your needs
 */

import { createLogger } from '@gqty/logger';
import { createVueClient } from '@gqty/vue';
import { createClient, QueryFetcher } from 'gqty';
import {
  generatedSchema,
  GeneratedSchema,
  scalarsEnumsHash,
  SchemaObjectTypes,
  SchemaObjectTypesNames,
} from './schema.generated';

const endpoint =
  typeof window !== 'undefined'
    ? '/api/graphql'
    : 'http://localhost:4141/api/graphql';

const queryFetcher: QueryFetcher = async function (query, variables) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  return json;
};

export const client = createClient<
  GeneratedSchema,
  SchemaObjectTypesNames,
  SchemaObjectTypes
>({
  schema: generatedSchema,
  scalarsEnumsHash,
  queryFetcher,
});

if (typeof window !== 'undefined') {
  const logger = createLogger(client);

  logger.start();
}

export const {
  query,
  mutation,
  mutate,
  subscription,
  resolved,
  refetch,
  track,
} = client;

export const {
  // graphql,
  useQuery,
  // usePaginatedQuery,
  // useTransactionQuery,
  // useLazyQuery,
  // useRefetch,
  useMutation,
  useMetaState,
  // useHydrateCache,
  // prepareQuery,
} = createVueClient<GeneratedSchema>(client, {
  defaults: {
    // Set this flag as "true" if your usage involves Vue Suspense
    // Keep in mind that you can overwrite it in a per-hook basis
    // suspense: false,

    // Set this flag based on your needs
    staleWhileRevalidate: false,
  },
});

export * from './schema.generated';
