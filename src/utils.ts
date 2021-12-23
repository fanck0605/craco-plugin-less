import type { CracoWebpackContext } from "@craco/craco";
import { loaderByName, throwUnexpectedConfigError } from "@craco/craco";
import { isFunction, isString } from "lodash";
import type { Configuration, RuleSetRule, RuleSetUseItem } from "webpack";
import type { LessPluginOptions } from "./less-plugin";

interface LoaderRule {
  ident?: string;
  loader?: string;
  options?: { [index: string]: unknown };
}

interface OneOfRule extends RuleSetRule {
  oneOf: RuleSetRule[];
}

const throwError = (message: string, githubIssueQuery?: string) =>
  throwUnexpectedConfigError({
    message,
    packageName: "craco-plugin-less",
    githubRepo: "fanck0605/craco-plugin-less",
    githubIssueQuery,
  });

const styleRuleByName = (name: string, isModule: boolean) => {
  return (rule: RuleSetRule): boolean => {
    if (rule.test) {
      const test = rule.test.toString();

      const includeName = test.includes(name);
      const includeModule = test.includes("module");

      return isModule
        ? includeName && includeModule
        : includeName && !includeModule;
    }

    return false;
  };
};

function toLoaderRule(
  this: CracoWebpackContext,
  useItem: RuleSetUseItem
): LoaderRule {
  if (isString(useItem)) {
    return {
      loader: useItem,
    };
  }

  if (!isFunction(useItem) && !isString(useItem.options)) {
    return {
      ...useItem,
      options: useItem.options,
    };
  }

  return throwError(
    `Unexpected RuleSetUseItem type in the ${this.env} webpack config!`,
    "webpack+loader+rule"
  );
}

function obtainOneOfRule(
  this: CracoWebpackContext,
  webpackConfig: Configuration
): OneOfRule {
  const oneOfRule = webpackConfig.module?.rules?.find(
    (rule) => !isString(rule) && rule.oneOf
  );
  if (!oneOfRule) {
    return throwError(
      `Can't find a 'oneOf' rule under module.rules in the ${this.env} webpack config!`,
      "webpack+rules+oneOf"
    );
  }

  return oneOfRule as OneOfRule;
}

function obtainSassRule(
  this: CracoWebpackContext,
  oneOfRule: OneOfRule
): RuleSetRule {
  const sassRule = oneOfRule.oneOf.find(styleRuleByName("scss|sass", false));
  if (!sassRule) {
    return throwError(
      `Can't find the webpack rule to match scss/sass files in the ${this.env} webpack config!`,
      "webpack+rules+scss+sass"
    );
  }

  return sassRule;
}

function obtainSassModuleRule(
  this: CracoWebpackContext,
  oneOfRule: OneOfRule
): RuleSetRule {
  const sassModuleRule = oneOfRule.oneOf.find(
    styleRuleByName("scss|sass", true)
  );
  if (!sassModuleRule) {
    return throwError(
      `Can't find the webpack rule to match scss/sass module files in the ${this.env} webpack config!`,
      "webpack+rules+scss+sass+module"
    );
  }

  return sassModuleRule;
}

const matchesStyleLoader = loaderByName("style-loader");

const matchesMiniCssExtractPlugin = loaderByName("mini-css-extract-plugin");

const matchesCssLoader = loaderByName("css-loader");

const matchesPostcssLoader = loaderByName("postcss-loader");

const matchesResolveUrlLoader = loaderByName("resolve-url-loader");

const matchesSassLoader = loaderByName("sass-loader");

function toLessLoaders(
  this: CracoWebpackContext,
  {
    styleLoaderOptions,
    miniCssExtractPluginOptions,
    cssLoaderOptions,
    postcssLoaderOptions,
    resolveUrlLoaderOptions,
    lessLoaderOptions,
    unknownLoader = "error",
  }: LessPluginOptions,
  loaderRule: LoaderRule
): LoaderRule | null {
  const isEnvDevelopment = this.env === "development";
  const isEnvProduction = this.env === "production";

  if (isEnvDevelopment && matchesStyleLoader(loaderRule)) {
    return {
      loader: loaderRule.loader,
      options: {
        ...loaderRule.options,
        ...styleLoaderOptions,
      },
    };
  } else if (isEnvProduction && matchesMiniCssExtractPlugin(loaderRule)) {
    return {
      loader: loaderRule.loader,
      options: {
        ...loaderRule.options,
        ...miniCssExtractPluginOptions,
      },
    };
  } else if (matchesCssLoader(loaderRule)) {
    return {
      loader: loaderRule.loader,
      options: {
        ...loaderRule.options,
        ...cssLoaderOptions,
      },
    };
  } else if (matchesPostcssLoader(loaderRule)) {
    return {
      loader: loaderRule.loader,
      options: {
        ...loaderRule.options,
        ...postcssLoaderOptions,
      },
    };
  } else if (matchesResolveUrlLoader(loaderRule)) {
    return {
      loader: loaderRule.loader,
      options: {
        ...loaderRule.options,
        ...resolveUrlLoaderOptions,
      },
    };
  } else if (matchesSassLoader(loaderRule)) {
    return {
      loader: require.resolve("less-loader"),
      options: {
        ...loaderRule.options,
        ...lessLoaderOptions,
      },
    };
  } else {
    switch (unknownLoader) {
      case "accept":
        return loaderRule;
      case "ignore":
        return null;
      case "error":
        return throwError(
          `Found an unhandled loader in the ${this.env} webpack config: ${
            loaderRule.loader ?? "unknown"
          }`,
          "webpack+unknown+rule"
        );
    }
  }
}

export type { LoaderRule, OneOfRule };

export {
  throwError,
  styleRuleByName,
  obtainOneOfRule,
  obtainSassRule,
  obtainSassModuleRule,
  toLoaderRule,
  matchesStyleLoader,
  matchesMiniCssExtractPlugin,
  matchesCssLoader,
  matchesPostcssLoader,
  matchesResolveUrlLoader,
  matchesSassLoader,
  toLessLoaders,
};
