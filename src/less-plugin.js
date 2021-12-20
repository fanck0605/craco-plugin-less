import { sep as pathSep } from "path";
import { styleRuleByName, throwError, toLoaderRule } from "./utils";
import { loaderByName } from "@craco/craco";
import { cloneDeep } from "lodash";

const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

const overrideWebpackConfig = ({
  context,
  webpackConfig,

  pluginOptions: {
    styleLoaderOptions,
    miniCssExtractPluginOptions,
    cssLoaderOptions,
    postcssLoaderOptions,
    resolveUrlLoaderOptions,
    lessLoaderOptions,

    modifyLessRule,
    modifyLessModuleRule,
  } = {},
}) => {
  const isEnvDevelopment = context.env === "development";
  const isEnvProduction = context.env === "production";

  const createLessRule = ({ baseRule, overrideRule }) => {
    baseRule = cloneDeep(baseRule);

    const loaders = baseRule.use.map(toLoaderRule).map((rule) => {
      if (
        isEnvDevelopment &&
        rule.loader.includes(`${pathSep}style-loader${pathSep}`)
      ) {
        return {
          loader: rule.loader,
          options: {
            ...rule.options,
            ...styleLoaderOptions,
          },
        };
      } else if (
        isEnvProduction &&
        rule.loader.includes(`${pathSep}mini-css-extract-plugin${pathSep}`)
      ) {
        return {
          loader: rule.loader,
          options: {
            ...rule.options,
            ...miniCssExtractPluginOptions,
          },
        };
      } else if (rule.loader.includes(`${pathSep}css-loader${pathSep}`)) {
        return {
          loader: rule.loader,
          options: {
            ...rule.options,
            ...cssLoaderOptions,
          },
        };
      } else if (rule.loader.includes(`${pathSep}postcss-loader${pathSep}`)) {
        return {
          loader: rule.loader,
          options: {
            ...rule.options,
            ...postcssLoaderOptions,
          },
        };
      } else if (
        rule.loader.includes(`${pathSep}resolve-url-loader${pathSep}`)
      ) {
        return {
          loader: rule.loader,
          options: {
            ...rule.options,
            ...resolveUrlLoaderOptions,
          },
        };
      } else if (rule.loader.includes(`${pathSep}sass-loader${pathSep}`)) {
        return {
          loader: require.resolve("less-loader"),
          options: {
            ...rule.options,
            ...lessLoaderOptions,
          },
        };
      } else {
        throwError(
          `Found an unhandled loader in the ${context.env} webpack config: ${rule.loader}`,
          "webpack+unknown+rule"
        );
      }
    });

    return {
      ...baseRule,
      ...overrideRule,
      use: loaders,
    };
  };

  const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
  if (!oneOfRule) {
    throwError(
      "Can't find a 'oneOf' rule under module.rules in the " +
        `${context.env} webpack config!`,
      "webpack+rules+oneOf"
    );
  }

  const sassRule = oneOfRule.oneOf.find(styleRuleByName("scss|sass", false));
  if (!sassRule) {
    throwError(
      "Can't find the webpack rule to match scss/sass files in the " +
        `${context.env} webpack config!`,
      "webpack+rules+scss+sass"
    );
  }
  let lessRule = createLessRule({
    baseRule: sassRule,
    overrideRule: {
      test: lessRegex,
      exclude: lessModuleRegex,
    },
  });

  if (modifyLessRule) {
    lessRule = modifyLessRule(lessRule, context);
  }

  const sassModuleRule = oneOfRule.oneOf.find(
    styleRuleByName("scss|sass", true)
  );
  if (!sassModuleRule) {
    throwError(
      "Can't find the webpack rule to match scss/sass module files in the " +
        `${context.env} webpack config!`,
      "webpack+rules+scss+sass"
    );
  }
  let lessModuleRule = createLessRule({
    baseRule: sassModuleRule,
    overrideRule: {
      test: lessModuleRegex,
    },
  });

  if (modifyLessModuleRule) {
    lessModuleRule = modifyLessModuleRule(lessModuleRule, context);
  }

  // insert less loader before "file" loader
  // https://webpack.js.org/guides/asset-modules/
  // https://github.com/facebook/create-react-app/blob/v5.0.0/packages/react-scripts/config/webpack.config.js#L590-L597
  let fileLoaderIndex = oneOfRule.oneOf.findIndex(
    ({ type }) => type === "asset/resource"
  );
  if (fileLoaderIndex === -1) {
    // https://github.com/facebook/create-react-app/blob/v4.0.3/packages/react-scripts/config/webpack.config.js#L583-L593
    fileLoaderIndex = oneOfRule.oneOf.findIndex(loaderByName("file-loader"));
    if (fileLoaderIndex === -1) {
      throwError(
        `Can't find "file" loader in the ${context.env} webpack config!`,
        "webpack+file+loader"
      );
    }
  }

  oneOfRule.oneOf.splice(fileLoaderIndex, 0, lessRule, lessModuleRule);

  return webpackConfig;
};

const overrideJestConfig = ({ context, jestConfig }) => {
  const moduleNameMapper = jestConfig.moduleNameMapper;
  const cssModulesPattern = Object.keys(moduleNameMapper).find((p) =>
    p.match(/\\\.module\\\.\(.*?css.*?\)/)
  );

  if (!cssModulesPattern) {
    throwError(
      `Can't find CSS Modules pattern under moduleNameMapper in the ${context.env} jest config!`,
      "jest+moduleNameMapper+css"
    );
  }

  moduleNameMapper[cssModulesPattern.replace("css", "css|less")] =
    moduleNameMapper[cssModulesPattern];
  delete moduleNameMapper[cssModulesPattern];

  const transformIgnorePatterns = jestConfig.transformIgnorePatterns;
  const cssModulesPatternIndex = transformIgnorePatterns.findIndex((p) =>
    p.match(/\\\.module\\\.\(.*?css.*?\)/)
  );
  if (cssModulesPatternIndex === -1) {
    throwError(
      `Can't find CSS Modules pattern under transformIgnorePatterns in the ${context.env} jest config!`,
      "jest+transformIgnorePatterns+css"
    );
  }

  transformIgnorePatterns[cssModulesPatternIndex] = transformIgnorePatterns[
    cssModulesPatternIndex
  ].replace("css", "css|less");

  return jestConfig;
};

export default Object.freeze({ overrideWebpackConfig, overrideJestConfig });
