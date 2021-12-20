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
  if (typeof loaderNameOrRule == "string") {
    return {
      loader: loaderNameOrRule,
      options: {},
    };
  } else {
    return loaderNameOrRule;
  }
};

export { styleRuleByName, toLoaderRule };
