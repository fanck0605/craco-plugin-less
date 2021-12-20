import { throwUnexpectedConfigError } from "@craco/craco";
import { isString } from "lodash";

const styleRuleByName = (name, module) => {
  return (rule) => {
    if (rule.test) {
      const test = rule.test.toString();

      const includeName = test.includes(name);
      const includeModule = test.includes("module");

      return module
        ? includeName && includeModule
        : includeName && !includeModule;
    }

    return false;
  };
};

const toLoaderRule = (loaderNameOrRule) => {
  if (isString(loaderNameOrRule)) {
    return {
      loader: loaderNameOrRule,
      options: {},
    };
  } else {
    return loaderNameOrRule;
  }
};

const throwError = (message, githubIssueQuery) =>
  throwUnexpectedConfigError({
    message,
    packageName: "craco-plugin-less",
    githubRepo: "fanck0605/craco-plugin-less",
    githubIssueQuery,
  });

export { styleRuleByName, toLoaderRule, throwError };
