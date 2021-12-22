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

const getCracoContext = (callerCracoConfig, env = process.env.NODE_ENV) => {
  const context = { env };
  const cracoConfig = processCracoConfig(callerCracoConfig, { env });
  context.paths = getCraPaths(cracoConfig);
  return context;
};

const getCracoWebpackContext = getCracoContext;

const getCracoJestContext = (callerCracoConfig, env) => {
  const context = getCracoContext(callerCracoConfig, env);
  const customResolve = (relativePath) =>
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

function addUnknownLoader(webpackConfig) {
  const oneOfRule = obtainOneOfRule.call(this, webpackConfig);
  const sassRule = obtainSassRule.call(this, oneOfRule);
  const sassModuleRule = obtainSassModuleRule.call(this, oneOfRule);
  sassRule.use.push(toLoaderRule.call(this, unknownLoader));
  sassModuleRule.use.push(toLoaderRule.call(this, unknownLoader));
}

export {
  getCracoWebpackContext,
  getCracoJestContext,
  unknownLoader,
  addUnknownLoader,
};
