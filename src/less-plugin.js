import {
  obtainOneOfRule,
  obtainSassModuleRule,
  obtainSassRule,
  throwError,
  toLessLoaders,
  toLoaderRule,
} from "./utils";
import { loaderByName } from "@craco/craco";
import { cloneDeep } from "lodash";

const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

const overrideWebpackConfig = ({
  context,
  webpackConfig,
  pluginOptions = {},
}) => {
  const { modifyLessRule, modifyLessModuleRule } = pluginOptions;

  const createLessRule = ({ baseRule, overrideRule }) => {
    baseRule = cloneDeep(baseRule);

    const loaders = baseRule.use
      .map(toLoaderRule.bind(context))
      .map(toLessLoaders.bind(context, pluginOptions))
      .filter(Boolean);

    return {
      ...baseRule,
      ...overrideRule,
      use: loaders,
    };
  };

  const oneOfRule = obtainOneOfRule.call(context, webpackConfig);

  const sassRule = obtainSassRule.call(context, oneOfRule);

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

  const sassModuleRule = obtainSassModuleRule.call(context, oneOfRule);

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
