import { processCracoConfig } from "@craco/craco/lib/config";
import { getCraPaths } from "@craco/craco/lib/cra";
import { styleRuleByName, toLoaderRule } from "../src/utils";
import path from "path";

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

const unknownLoader = path.join(
  path.sep,
  "path",
  "to",
  "unknown-loader",
  "index.js"
);

const addUnknownLoader = (webpackConfig) => {
  const sassRule = obtainSassRule(webpackConfig);
  const sassModuleRule = obtainSassModuleRule(webpackConfig);
  sassRule.use.push(toLoaderRule(unknownLoader));
  sassModuleRule.use.push(toLoaderRule(unknownLoader));
};

export {
  getCracoContext,
  obtainSassRule,
  obtainSassModuleRule,
  unknownLoader,
  addUnknownLoader,
};
