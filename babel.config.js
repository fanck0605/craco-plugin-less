module.exports = {
  plugins: ["lodash"],
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "12",
        },
      },
    ],
  ],
  comments: false,
  overrides: [
    {
      test: ["**/*.ts"],
      presets: ["@babel/preset-typescript"],
    },
  ],
};
