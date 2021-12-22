import type { LoaderRule } from "./utils";
import {
  obtainOneOfRule,
  obtainSassModuleRule,
  obtainSassRule,
  throwError,
  toLessLoaders,
  toLoaderRule,
} from "./utils";
import type {
  CracoWebpackContext,
  OverrideJestConfigFunc,
  OverrideWebpackConfigFunc,
} from "@craco/craco";
import { loaderByName } from "@craco/craco";
import { cloneDeep, isArray } from "lodash";
import type { RuleSetRule } from "webpack";

type ModifyLessRuleFunc = (
  lessRule: RuleSetRule,
  cracoContext: CracoWebpackContext
) => RuleSetRule;

interface LessPluginOptions {
  styleLoaderOptions?: { [key: string]: any };
  miniCssExtractPluginOptions?: { [key: string]: any };
  cssLoaderOptions?: { [key: string]: any };
  postcssLoaderOptions?: { [key: string]: any };
  resolveUrlLoaderOptions?: { [key: string]: any };
  lessLoaderOptions?: { [key: string]: any };

  modifyLessRule?: ModifyLessRuleFunc;
  modifyLessModuleRule?: ModifyLessRuleFunc;

  unknownLoader?: "accept" | "ignore" | "error";
}

type CreateLessRuleFunc = (props: {
  baseRule: RuleSetRule;
  overrideRule: RuleSetRule;
}) => RuleSetRule;

const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

const overrideWebpackConfig: OverrideWebpackConfigFunc = ({
  context,
  webpackConfig,
  pluginOptions = {},
}) => {
  const { modifyLessRule, modifyLessModuleRule } =
    pluginOptions as LessPluginOptions;

  const createLessRule: CreateLessRuleFunc = ({ baseRule, overrideRule }) => {
    baseRule = cloneDeep(baseRule);
    if (!isArray(baseRule.use)) {
      return throwError(
        `Unexpected 'use' type under style rule in the ${context.env} webpack config`,
        "webpack+rule+use"
      );
    }

    const loaders = baseRule.use
      .map(toLoaderRule.bind(context))
      .map(toLessLoaders.bind(context, pluginOptions))
      .filter(Boolean) as LoaderRule[];

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

const overrideJestConfig: OverrideJestConfigFunc = ({
  context,
  jestConfig,
}) => {
  const moduleNameMapper = jestConfig.moduleNameMapper;
  if (!moduleNameMapper) {
    return throwError(
      `Can't find moduleNameMapper in the ${context.env} jest config!`,
      "jest+moduleNameMapper"
    );
  }

  const cssModulesPattern = Object.keys(moduleNameMapper).find((p) =>
    p.match(/\\\.module\\\.\(.*?css.*?\)/)
  );

  if (!cssModulesPattern) {
    return throwError(
      `Can't find CSS Modules pattern under moduleNameMapper in the ${context.env} jest config!`,
      "jest+moduleNameMapper+css"
    );
  }

  moduleNameMapper[cssModulesPattern.replace("css", "css|less")] =
    moduleNameMapper[cssModulesPattern];
  delete moduleNameMapper[cssModulesPattern];

  const transformIgnorePatterns = jestConfig.transformIgnorePatterns;
  if (!transformIgnorePatterns) {
    return throwError(
      `Can't find transformIgnorePatterns in the ${context.env} jest config!`,
      "jest+transformIgnorePatterns"
    );
  }

  const cssModulesPatternIndex = transformIgnorePatterns.findIndex((p) =>
    p.match(/\\\.module\\\.\(.*?css.*?\)/)
  );
  if (cssModulesPatternIndex === -1) {
    return throwError(
      `Can't find CSS Modules pattern under transformIgnorePatterns in the ${context.env} jest config!`,
      "jest+transformIgnorePatterns+css"
    );
  }

  transformIgnorePatterns[cssModulesPatternIndex] = transformIgnorePatterns[
    cssModulesPatternIndex
  ].replace("css", "css|less");

  return jestConfig;
};

export type { ModifyLessRuleFunc, LessPluginOptions };

export default Object.freeze({ overrideWebpackConfig, overrideJestConfig });
