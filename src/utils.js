import { loaderByName, throwUnexpectedConfigError } from "@craco/craco";
import { isString } from "lodash";

const throwError = (message, githubIssueQuery) =>
  throwUnexpectedConfigError({
    message,
    packageName: "craco-plugin-less",
    githubRepo: "fanck0605/craco-plugin-less",
    githubIssueQuery,
  });

const styleRuleByName = (name, isModule) => {
  return (rule) => {
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

function toLoaderRule(useItem) {
  if (isString(useItem)) {
    return {
      loader: useItem,
    };
  } else {
    return useItem;
  }
}

function obtainOneOfRule(webpackConfig) {
  const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
  if (!oneOfRule) {
    throwError(
      `Can't find a 'oneOf' rule under module.rules in the ${this.env} webpack config!`,
      "webpack+rules+oneOf"
    );
  }

  return oneOfRule;
}

function obtainSassRule(oneOfRule) {
  const sassRule = oneOfRule.oneOf.find(styleRuleByName("scss|sass", false));
  if (!sassRule) {
    throwError(
      `Can't find the webpack rule to match scss/sass files in the ${this.env} webpack config!`,
      "webpack+rules+scss+sass"
    );
  }

  return sassRule;
}

function obtainSassModuleRule(oneOfRule) {
  const sassModuleRule = oneOfRule.oneOf.find(
    styleRuleByName("scss|sass", true)
  );
  if (!sassModuleRule) {
    throwError(
      `Can't find the webpack rule to match scss/sass module files in the ${this.env} webpack config!`,
      "webpack+rules+scss+sass"
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
  {
    styleLoaderOptions,
    miniCssExtractPluginOptions,
    cssLoaderOptions,
    postcssLoaderOptions,
    resolveUrlLoaderOptions,
    lessLoaderOptions,
    unknownLoader = "error",
  },
  loaderRule
) {
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
        throwError(
          `Found an unhandled loader in the ${this.env} webpack config: ${loaderRule.loader}`,
          "webpack+unknown+rule"
        );
    }
  }
}

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
