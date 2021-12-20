import { processCracoConfig } from "@craco/craco/lib/config";
import { getCraPaths } from "@craco/craco/lib/cra";
import { styleRuleByName } from "../src/utils";

const getCracoContext = (callerCracoConfig, env = process.env.NODE_ENV) => {
  const context = { env };
  const cracoConfig = processCracoConfig(callerCracoConfig, { env });
  context.paths = getCraPaths(cracoConfig);
  return context;
};

const obtainSassRule = (webpackConfig) => {
  return webpackConfig.module.rules
    .find((rule) => rule.oneOf)
    .oneOf.find(styleRuleByName("scss|sass", false));
};

const obtainSassModuleRule = (webpackConfig) => {
  return webpackConfig.module.rules
    .find((rule) => rule.oneOf)
    .oneOf.find(styleRuleByName("scss|sass", true));
};

export { getCracoContext, obtainSassRule, obtainSassModuleRule };
