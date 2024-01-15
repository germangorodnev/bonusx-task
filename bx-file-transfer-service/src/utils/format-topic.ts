/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Format topic containing `+` wildcards, replacing them with given arguments.
 */
export const formatTopic = (topic: string, ...args: unknown[]) => {
  const copy = [...args];

  return topic.replace(/\+/g, () => copy.shift()!.toString());
};
