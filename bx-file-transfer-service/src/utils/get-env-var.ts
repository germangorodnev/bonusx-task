export const getEnvVar = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`process.env.${name} is not defined`);
  }

  return value;
};
