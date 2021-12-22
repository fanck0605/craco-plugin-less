import { processCracoConfig } from "@craco/craco/lib/config";
import { getCraPaths } from "@craco/craco/lib/cra";
import {
  obtainOneOfRule,
  obtainSassModuleRule,
  obtainSassRule,
  toLoaderRule,
} from "../src/utils";
import path from "path";
import { projectRoot } from "@craco/craco/lib/paths";
import type { CracoConfig, CracoWebpackContext } from "@craco/craco";
import type { Configuration, RuleSetUseItem } from "webpack";

const getCracoContext = (
  callerCracoConfig: CracoConfig,
  env: string = process.env.NODE_ENV || "development"
) => {
  const context = { env };
  const cracoConfig = processCracoConfig(callerCracoConfig, { env });
  return {
    ...context,
    paths: getCraPaths(cracoConfig),
  };
};

const getCracoWebpackContext = getCracoContext;

const getCracoJestContext = (callerCracoConfig: CracoConfig, env?: string) => {
  const context = getCracoContext(callerCracoConfig, env);
  const customResolve = (relativePath: string) =>
    require.resolve(
      path.join(callerCracoConfig.reactScriptsVersion, relativePath),
      { paths: [projectRoot] }
    );
  return {
    ...context,
    resolve: customResolve,
    rootDir: projectRoot,
  };
};

const unknownLoader = path.join(
  path.sep,
  "path",
  "to",
  "unknown-loader",
  "index.js"
);

function addUnknownLoader(
  this: CracoWebpackContext,
  webpackConfig: Configuration
) {
  const oneOfRule = obtainOneOfRule.call(this, webpackConfig);
  const sassRule = obtainSassRule.call(this, oneOfRule);
  const sassModuleRule = obtainSassModuleRule.call(this, oneOfRule);
  (sassRule.use as RuleSetUseItem[]).push(
    toLoaderRule.call(this, unknownLoader)
  );
  (sassModuleRule.use as RuleSetUseItem[]).push(
    toLoaderRule.call(this, unknownLoader)
  );
}

export {
  getCracoWebpackContext,
  getCracoJestContext,
  unknownLoader,
  addUnknownLoader,
};
