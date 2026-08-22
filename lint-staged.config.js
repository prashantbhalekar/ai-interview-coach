module.exports = {
  '*.{ts,tsx,js,jsx,json,md,yml,yaml}': ['prettier --write'],
  '*.{ts,tsx,js,jsx}': ['eslint --max-warnings=0 --fix'],
};
