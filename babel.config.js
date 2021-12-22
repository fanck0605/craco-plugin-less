module.exports = {
  plugins: ["lodash"],
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "12",
        },
        modules: "commonjs",
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
