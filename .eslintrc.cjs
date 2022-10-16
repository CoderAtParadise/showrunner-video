module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "import"],
  extends: ["eslint:recommended", "prettier", "next/core-web-vitals"],
  rules: {
    "no-useless-escape": "off",
  },
};
