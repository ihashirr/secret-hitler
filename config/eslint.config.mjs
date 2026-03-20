import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [".next/**", "backend/convex/_generated/**"],
  },
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];
